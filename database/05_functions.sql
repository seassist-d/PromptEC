-- =============================================
-- PostgreSQL関数定義（修正版 - 既存の関数を安全に削除してから再作成）
-- =============================================

-- 既存の関数を安全に削除
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();
DROP FUNCTION IF EXISTS update_prompt_popularity();
DROP FUNCTION IF EXISTS get_sales_statistics(uuid, date, date);
DROP FUNCTION IF EXISTS check_download_permission(uuid, uuid);
DROP FUNCTION IF EXISTS search_prompts(text, bigint, integer, integer, text, text, integer, integer);
DROP FUNCTION IF EXISTS generate_prompt_slug(text);
DROP FUNCTION IF EXISTS update_seller_balance();
DROP FUNCTION IF EXISTS calculate_seller_balance(uuid);
DROP FUNCTION IF EXISTS update_prompt_stats();
DROP FUNCTION IF EXISTS generate_order_number();
DROP FUNCTION IF EXISTS increment_like_count(uuid);
DROP FUNCTION IF EXISTS decrement_like_count(uuid);

-- 注文番号生成関数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
    order_number text;
    counter integer;
BEGIN
    -- 現在の日時をベースにした番号を生成
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS integer)), 0) + 1
    INTO counter
    FROM public.orders
    WHERE order_number LIKE 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%';
    
    order_number := 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::text, 4, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- プロンプト統計更新関数
CREATE OR REPLACE FUNCTION update_prompt_stats()
RETURNS trigger AS $$
BEGIN
    -- レビューが追加・更新・削除された時にプロンプトの統計を更新
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.prompts
        SET 
            avg_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.reviews
                WHERE prompt_id = NEW.prompt_id AND status = 'visible'
            ),
            ratings_count = (
                SELECT COUNT(*)
                FROM public.reviews
                WHERE prompt_id = NEW.prompt_id AND status = 'visible'
            ),
            updated_at = now()
        WHERE id = NEW.prompt_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.prompts
        SET 
            avg_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.reviews
                WHERE prompt_id = OLD.prompt_id AND status = 'visible'
            ),
            ratings_count = (
                SELECT COUNT(*)
                FROM public.reviews
                WHERE prompt_id = OLD.prompt_id AND status = 'visible'
            ),
            updated_at = now()
        WHERE id = OLD.prompt_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 出品者残高計算関数
CREATE OR REPLACE FUNCTION calculate_seller_balance(seller_uuid uuid)
RETURNS TABLE(available_jpy bigint, pending_jpy bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN entry_type IN ('seller_net', 'adjustment') THEN amount_jpy ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN entry_type = 'payout' THEN amount_jpy ELSE 0 END), 0) as available_jpy,
        COALESCE(SUM(CASE WHEN entry_type = 'seller_net' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN amount_jpy ELSE 0 END), 0) as pending_jpy
    FROM public.ledger_entries
    WHERE seller_id = seller_uuid;
END;
$$ LANGUAGE plpgsql;

-- 出品者残高更新関数
CREATE OR REPLACE FUNCTION update_seller_balance()
RETURNS trigger AS $$
DECLARE
    balance_record RECORD;
BEGIN
    -- 台帳エントリーが追加された時に出品者残高を更新
    IF TG_OP = 'INSERT' THEN
        -- 出品者残高レコードが存在しない場合は作成
        INSERT INTO public.seller_balances (seller_id, available_jpy, pending_jpy, updated_at)
        SELECT NEW.seller_id, 0, 0, now()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.seller_balances WHERE seller_id = NEW.seller_id
        );
        
        -- 残高を再計算
        SELECT * INTO balance_record FROM calculate_seller_balance(NEW.seller_id);
        
        UPDATE public.seller_balances
        SET 
            available_jpy = balance_record.available_jpy,
            pending_jpy = balance_record.pending_jpy,
            updated_at = now()
        WHERE seller_id = NEW.seller_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- プロンプトスラッグ生成関数
CREATE OR REPLACE FUNCTION generate_prompt_slug(title_text text)
RETURNS text AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- タイトルからスラッグを生成（日本語対応）
    base_slug := LOWER(REGEXP_REPLACE(title_text, '[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(base_slug, '-');
    
    -- 最大50文字に制限
    IF LENGTH(base_slug) > 50 THEN
        base_slug := LEFT(base_slug, 50);
        base_slug := REGEXP_REPLACE(base_slug, '-[^-]*$', '');
    END IF;
    
    final_slug := base_slug;
    
    -- 重複チェック
    WHILE EXISTS (SELECT 1 FROM public.prompts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- プロンプト検索関数
CREATE OR REPLACE FUNCTION search_prompts(
    search_query text DEFAULT '',
    category_filter bigint DEFAULT NULL,
    min_price integer DEFAULT NULL,
    max_price integer DEFAULT NULL,
    sort_by text DEFAULT 'created_at',
    sort_order text DEFAULT 'DESC',
    limit_count integer DEFAULT 20,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    title text,
    slug text,
    seller_id uuid,
    category_id bigint,
    thumbnail_url text,
    price_jpy integer,
    short_description text,
    avg_rating numeric,
    ratings_count integer,
    view_count integer,
    created_at timestamptz,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.seller_id,
        p.category_id,
        p.thumbnail_url,
        p.price_jpy,
        p.short_description,
        p.avg_rating,
        p.ratings_count,
        p.view_count,
        p.created_at,
        CASE 
            WHEN search_query != '' THEN ts_rank(
                to_tsvector('simple', p.title || ' ' || COALESCE(p.short_description, '') || ' ' || COALESCE(p.long_description, '')),
                plainto_tsquery('simple', search_query)
            )
            ELSE 0
        END as rank
    FROM public.prompts p
    WHERE 
        p.status = 'published' 
        AND p.visibility = 'public'
        AND (search_query = '' OR to_tsvector('simple', p.title || ' ' || COALESCE(p.short_description, '') || ' ' || COALESCE(p.long_description, '')) @@ plainto_tsquery('simple', search_query))
        AND (category_filter IS NULL OR p.category_id = category_filter)
        AND (min_price IS NULL OR p.price_jpy >= min_price)
        AND (max_price IS NULL OR p.price_jpy <= max_price)
    ORDER BY 
        CASE WHEN sort_by = 'price' AND sort_order = 'ASC' THEN p.price_jpy END ASC,
        CASE WHEN sort_by = 'price' AND sort_order = 'DESC' THEN p.price_jpy END DESC,
        CASE WHEN sort_by = 'rating' AND sort_order = 'ASC' THEN p.avg_rating END ASC,
        CASE WHEN sort_by = 'rating' AND sort_order = 'DESC' THEN p.avg_rating END DESC,
        CASE WHEN sort_by = 'views' AND sort_order = 'ASC' THEN p.view_count END ASC,
        CASE WHEN sort_by = 'views' AND sort_order = 'DESC' THEN p.view_count END DESC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'ASC' THEN p.created_at END ASC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'DESC' THEN p.created_at END DESC,
        CASE WHEN search_query != '' THEN rank END DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 期限切れセッションクリーンアップ関数（破壊的操作を含むため削除）
-- この関数は09_maintenance_functions.sqlに移動しました

-- プロンプトダウンロード権限チェック関数
CREATE OR REPLACE FUNCTION check_download_permission(
    user_uuid uuid,
    prompt_version_uuid uuid
)
RETURNS boolean AS $$
DECLARE
    has_permission boolean := false;
BEGIN
    -- ユーザーが購入済みかチェック
    SELECT EXISTS (
        SELECT 1 
        FROM public.entitlements e
        WHERE e.buyer_id = user_uuid 
        AND e.prompt_version_id = prompt_version_uuid
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- 売上統計取得関数
CREATE OR REPLACE FUNCTION get_sales_statistics(
    seller_uuid uuid,
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL
)
RETURNS TABLE(
    total_sales bigint,
    total_orders integer,
    average_order_value numeric,
    total_commission bigint,
    net_earnings bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN le.entry_type = 'sale_gross' THEN le.amount_jpy ELSE 0 END), 0) as total_sales,
        COUNT(DISTINCT le.order_id) as total_orders,
        CASE 
            WHEN COUNT(DISTINCT le.order_id) > 0 
            THEN COALESCE(SUM(CASE WHEN le.entry_type = 'sale_gross' THEN le.amount_jpy ELSE 0 END), 0)::numeric / COUNT(DISTINCT le.order_id)
            ELSE 0 
        END as average_order_value,
        COALESCE(SUM(CASE WHEN le.entry_type = 'platform_fee' THEN ABS(le.amount_jpy) ELSE 0 END), 0) as total_commission,
        COALESCE(SUM(CASE WHEN le.entry_type = 'seller_net' THEN le.amount_jpy ELSE 0 END), 0) as net_earnings
    FROM public.ledger_entries le
    WHERE le.seller_id = seller_uuid
    AND (start_date IS NULL OR le.created_at::date >= start_date)
    AND (end_date IS NULL OR le.created_at::date <= end_date);
END;
$$ LANGUAGE plpgsql;

-- プロンプト人気度更新関数
CREATE OR REPLACE FUNCTION update_prompt_popularity()
RETURNS trigger AS $$
BEGIN
    -- 推薦イベントが追加された時にプロンプトの人気度を更新
    IF TG_OP = 'INSERT' AND NEW.prompt_id IS NOT NULL THEN
        -- ビューイベントの場合、view_countを増加
        IF NEW.event_type = 'view' THEN
            UPDATE public.prompts
            SET view_count = view_count + 1
            WHERE id = NEW.prompt_id;
        -- いいねイベントの場合、like_countを増加
        ELSIF NEW.event_type = 'like' THEN
            UPDATE public.prompts
            SET like_count = like_count + 1
            WHERE id = NEW.prompt_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- プロフィール更新専用関数
CREATE OR REPLACE FUNCTION update_user_profile(
    p_user_id uuid,
    p_display_name text DEFAULT NULL,
    p_bio text DEFAULT NULL,
    p_contact jsonb DEFAULT NULL,
    p_avatar_url text DEFAULT NULL
)
RETURNS TABLE(
    success boolean,
    message text,
    profile_data jsonb
) AS $$
DECLARE
    updated_profile RECORD;
BEGIN
    -- プロフィールが存在するかチェック
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = p_user_id) THEN
        -- プロフィールが存在しない場合は新規作成
        INSERT INTO public.user_profiles (
            user_id,
            display_name,
            bio,
            contact,
            avatar_url,
            role,
            is_banned,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            COALESCE(p_display_name, 'ユーザー'),
            p_bio,
            COALESCE(p_contact, '{}'),
            p_avatar_url,
            'user',
            false,
            now(),
            now()
        );
    ELSE
        -- プロフィールが存在する場合は更新
        UPDATE public.user_profiles
        SET 
            display_name = COALESCE(p_display_name, display_name),
            bio = COALESCE(p_bio, bio),
            contact = COALESCE(p_contact, contact),
            avatar_url = COALESCE(p_avatar_url, avatar_url),
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
    
    -- 更新されたプロフィールを取得
    SELECT * INTO updated_profile
    FROM public.user_profiles
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT 
        true as success,
        'プロフィールを更新しました' as message,
        to_jsonb(updated_profile) as profile_data;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        false as success,
        'プロフィールの更新に失敗しました: ' || SQLERRM as message,
        NULL::jsonb as profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者ダッシュボード統計関数
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
    total_users bigint,
    total_prompts bigint,
    total_orders bigint,
    total_revenue bigint,
    pending_reviews bigint,
    banned_users bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.user_profiles) as total_users,
        (SELECT COUNT(*) FROM public.prompts WHERE status = 'published') as total_prompts,
        (SELECT COUNT(*) FROM public.orders WHERE status = 'paid') as total_orders,
        (SELECT COALESCE(SUM(total_amount_jpy), 0) FROM public.orders WHERE status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM public.reviews WHERE status = 'visible') as pending_reviews,
        (SELECT COUNT(*) FROM public.user_profiles WHERE is_banned = true) as banned_users;
END;
$$ LANGUAGE plpgsql;

-- いいね数を増やす関数
CREATE OR REPLACE FUNCTION increment_like_count(prompt_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts
    SET like_count = like_count + 1,
        updated_at = now()
    WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- いいね数を減らす関数
CREATE OR REPLACE FUNCTION decrement_like_count(prompt_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = now()
    WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;
