-- =============================================
-- 日本語全文検索設定（オプション）（修正版 - 既存の設定を安全に削除してから再作成）
-- =============================================
-- 
-- このファイルは、より高度な日本語全文検索を使用したい場合に
-- 実行してください。Supabaseの標準設定では日本語テキスト検索設定が
-- 利用できないため、03_indexes.sqlでは'simple'設定を使用しています。
--
-- 日本語の形態素解析を使用したい場合は、以下のSQLを実行してください：
-- （注意: これには追加の拡張機能が必要な場合があります）

-- 既存の日本語検索関連のオブジェクトを安全に削除
DROP FUNCTION IF EXISTS search_prompts_japanese(text, bigint, integer, integer, text, text, integer, integer);
DROP INDEX IF EXISTS public.idx_prompts_long_description_trgm;
DROP INDEX IF EXISTS public.idx_prompts_description_trgm;
DROP INDEX IF EXISTS public.idx_prompts_title_trgm;
DROP FUNCTION IF EXISTS japanese_search(text, text);

-- 日本語テキスト検索設定の作成
-- CREATE TEXT SEARCH CONFIGURATION japanese (COPY = simple);

-- 日本語用のマッピング設定
-- ALTER TEXT SEARCH CONFIGURATION japanese 
--   ALTER MAPPING FOR hword, hword_part, word WITH japanese_stem;

-- より高度な日本語検索が必要な場合は、以下の拡張機能をインストールしてください：
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- 類似度検索用
-- CREATE EXTENSION IF NOT EXISTS unaccent; -- アクセント除去用

-- 日本語検索用のカスタム関数（オプション）
CREATE OR REPLACE FUNCTION japanese_search(
    search_text text,
    target_text text
)
RETURNS boolean AS $$
BEGIN
    -- ひらがな・カタカナ・漢字の正規化
    search_text := regexp_replace(search_text, '[ァ-ヶ]', '[ァ-ヶ]', 'g');
    search_text := regexp_replace(search_text, '[ぁ-ん]', '[ぁ-ん]', 'g');
    
    -- 部分一致検索
    RETURN target_text ILIKE '%' || search_text || '%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 日本語検索用のインデックス（部分一致検索用）
CREATE INDEX IF NOT EXISTS idx_prompts_title_trgm ON public.prompts 
USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_prompts_description_trgm ON public.prompts 
USING GIN (short_description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_prompts_long_description_trgm ON public.prompts 
USING GIN (long_description gin_trgm_ops);

-- 日本語検索関数の更新版
CREATE OR REPLACE FUNCTION search_prompts_japanese(
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
            WHEN search_query != '' THEN 
                similarity(p.title, search_query) + 
                similarity(p.short_description, search_query) * 0.5 +
                similarity(p.long_description, search_query) * 0.3
            ELSE 0
        END as rank
    FROM public.prompts p
    WHERE 
        p.status = 'published' 
        AND p.visibility = 'public'
        AND (search_query = '' OR 
             p.title ILIKE '%' || search_query || '%' OR
             p.short_description ILIKE '%' || search_query || '%' OR
             p.long_description ILIKE '%' || search_query || '%')
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
