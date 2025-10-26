-- いいね機能のデバッグ用SQL
-- Supabaseダッシュボードで実行してください

-- 1. 現在の関数の実装を確認
SELECT 
    proname,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('increment_like_count', 'decrement_like_count');

-- 2. テスト: 関数を直接実行して確認
-- 注意: 'your-prompt-id' を実際のプロンプトIDに置き換えてください
/*
SELECT decrement_like_count('your-prompt-id'::uuid);

-- 結果を確認
SELECT id, slug, like_count 
FROM prompts 
WHERE id = 'your-prompt-id';
*/

-- 3. 修正版: もっと詳細なログを出力する
DROP FUNCTION IF EXISTS decrement_like_count(uuid);

CREATE OR REPLACE FUNCTION decrement_like_count(prompt_id uuid)
RETURNS void AS $$
DECLARE
    old_count integer;
    new_count integer;
    affected_rows integer;
BEGIN
    -- 現在の値を取得
    SELECT like_count INTO old_count
    FROM public.prompts
    WHERE id = prompt_id;
    
    RAISE NOTICE 'decrement_like_count called for prompt_id: %, current count: %', prompt_id, old_count;
    
    -- 更新を実行
    UPDATE public.prompts
    SET 
        like_count = GREATEST(COALESCE(like_count, 0) - 1, 0),
        updated_at = now()
    WHERE id = prompt_id;
    
    -- 影響を受けた行数を取得
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE NOTICE 'Rows affected: %, after update count: %', affected_rows, (SELECT like_count FROM public.prompts WHERE id = prompt_id);
    
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'No rows updated for prompt_id: %', prompt_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 同様にincrement_like_countも修正
DROP FUNCTION IF EXISTS increment_like_count(uuid);

CREATE OR REPLACE FUNCTION increment_like_count(prompt_id uuid)
RETURNS void AS $$
DECLARE
    old_count integer;
    affected_rows integer;
BEGIN
    -- 現在の値を取得
    SELECT like_count INTO old_count
    FROM public.prompts
    WHERE id = prompt_id;
    
    RAISE NOTICE 'increment_like_count called for prompt_id: %, current count: %', prompt_id, old_count;
    
    -- 更新を実行
    UPDATE public.prompts
    SET 
        like_count = COALESCE(like_count, 0) + 1,
        updated_at = now()
    WHERE id = prompt_id;
    
    -- 影響を受けた行数を取得
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE NOTICE 'Rows affected: %, after update count: %', affected_rows, (SELECT like_count FROM public.prompts WHERE id = prompt_id);
    
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'No rows updated for prompt_id: %', prompt_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 関数が正しく作成されたか確認
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname IN ('increment_like_count', 'decrement_like_count');

