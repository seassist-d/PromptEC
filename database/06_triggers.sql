-- =============================================
-- トリガー定義
-- =============================================

-- プロンプト統計更新トリガー
CREATE TRIGGER trigger_update_prompt_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_stats();

-- 出品者残高更新トリガー
CREATE TRIGGER trigger_update_seller_balance
    AFTER INSERT ON public.ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_balance();

-- プロンプト人気度更新トリガー
CREATE TRIGGER trigger_update_prompt_popularity
    AFTER INSERT ON public.recommendation_events
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_popularity();

-- プロンプト作成時のスラッグ自動生成トリガー
CREATE OR REPLACE FUNCTION auto_generate_prompt_slug()
RETURNS trigger AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_prompt_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_prompt_slug
    BEFORE INSERT ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_prompt_slug();

-- 注文作成時の注文番号自動生成トリガー
CREATE OR REPLACE FUNCTION auto_generate_order_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_order_number();

-- 監査ログ記録トリガー
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
BEGIN
    -- 変更前のデータを記録
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
    END IF;
    
    -- 変更後のデータを記録
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        new_data := to_jsonb(NEW);
    END IF;
    
    -- 監査ログに記録
    INSERT INTO public.audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        diff,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP || '.' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', old_data,
            'new', new_data
        ),
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 主要テーブルに監査ログトリガーを設定
CREATE TRIGGER audit_trigger_prompts
    AFTER INSERT OR UPDATE OR DELETE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_orders
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- プロンプトバージョン作成時の自動バージョン番号生成
CREATE OR REPLACE FUNCTION auto_generate_version_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.version IS NULL OR NEW.version = 0 THEN
        SELECT COALESCE(MAX(version), 0) + 1
        INTO NEW.version
        FROM public.prompt_versions
        WHERE prompt_id = NEW.prompt_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_version_number
    BEFORE INSERT ON public.prompt_versions
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_version_number();

-- プロンプトバージョン公開時のタイムスタンプ設定
CREATE OR REPLACE FUNCTION set_published_timestamp()
RETURNS trigger AS $$
BEGIN
    -- プロンプトがpublishedに変更された場合
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
        -- 最新バージョンのpublished_atを設定
        UPDATE public.prompt_versions
        SET published_at = now()
        WHERE prompt_id = NEW.id
        AND version = (
            SELECT MAX(version) 
            FROM public.prompt_versions 
            WHERE prompt_id = NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_published_timestamp
    AFTER UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION set_published_timestamp();

-- 決済完了時の所有権自動発行
CREATE OR REPLACE FUNCTION auto_grant_entitlements()
RETURNS trigger AS $$
BEGIN
    -- 決済が成功した場合
    IF NEW.status = 'captured' AND (OLD.status IS NULL OR OLD.status != 'captured') THEN
        -- 注文アイテムに対して所有権を発行
        INSERT INTO public.entitlements (buyer_id, order_item_id, prompt_version_id)
        SELECT 
            o.buyer_id,
            oi.id,
            oi.prompt_version_id
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.id = NEW.order_id;
        
        -- 売上台帳エントリーを作成
        INSERT INTO public.ledger_entries (entry_type, order_id, order_item_id, seller_id, amount_jpy, note)
        SELECT 
            'sale_gross'::ledger_entry_type,
            o.id,
            oi.id,
            p.seller_id,
            oi.unit_price_jpy,
            '売上計上'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- 決済手数料エントリー（仮で3.6%）
        INSERT INTO public.ledger_entries (entry_type, order_id, seller_id, amount_jpy, note)
        SELECT 
            'payment_fee'::ledger_entry_type,
            o.id,
            p.seller_id,
            -ROUND(oi.unit_price_jpy * 0.036),
            '決済手数料'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- プラットフォーム手数料エントリー（20%）
        INSERT INTO public.ledger_entries (entry_type, order_id, seller_id, amount_jpy, note)
        SELECT 
            'platform_fee'::ledger_entry_type,
            o.id,
            p.seller_id,
            -ROUND(oi.unit_price_jpy * 0.20),
            'プラットフォーム手数料'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- 出品者純利益エントリー（80% - 決済手数料）
        INSERT INTO public.ledger_entries (entry_type, order_id, seller_id, amount_jpy, note)
        SELECT 
            'seller_net'::ledger_entry_type,
            o.id,
            p.seller_id,
            ROUND(oi.unit_price_jpy * 0.80 - oi.unit_price_jpy * 0.036),
            '出品者純利益'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- 注文ステータスをpaidに更新
        UPDATE public.orders
        SET status = 'paid'::order_status, updated_at = now()
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_grant_entitlements
    AFTER UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_grant_entitlements();

-- ユーザープロフィール作成時の自動残高レコード作成
CREATE OR REPLACE FUNCTION auto_create_seller_balance()
RETURNS trigger AS $$
BEGIN
    -- ユーザープロフィールが作成された時に残高レコードを作成
    INSERT INTO public.seller_balances (seller_id, available_jpy, pending_jpy, updated_at)
    VALUES (NEW.user_id, 0, 0, now())
    ON CONFLICT (seller_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_seller_balance
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_seller_balance();

-- 新規ユーザー登録時にプロフィールを自動作成する関数
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();
