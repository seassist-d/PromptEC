-- いいね機能の関数を修正
-- Supabaseダッシュボードで実行してください

-- 既存の関数を削除
DROP FUNCTION IF EXISTS increment_like_count(uuid);
DROP FUNCTION IF EXISTS decrement_like_count(uuid);

-- いいね数を増やす関数（修正版）
CREATE OR REPLACE FUNCTION increment_like_count(prompt_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts
    SET 
        like_count = COALESCE(like_count, 0) + 1,
        updated_at = now()
    WHERE id = prompt_id;
    
    -- ログを出力（デバッグ用）
    RAISE NOTICE 'increment_like_count: Updated prompt % to %, new count: %', 
        prompt_id, 
        (SELECT like_count FROM public.prompts WHERE id = prompt_id),
        (SELECT like_count FROM public.prompts WHERE id = prompt_id);
END;
$$ LANGUAGE plpgsql;

-- いいね数を減らす関数（修正版）
CREATE OR REPLACE FUNCTION decrement_like_count(prompt_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts
    SET 
        like_count = GREATEST(COALESCE(like_count, 0) - 1, 0),
        updated_at = now()
    WHERE id = prompt_id;
    
    -- ログを出力（デバッグ用）
    RAISE NOTICE 'decrement_like_count: Updated prompt % to %, new count: %', 
        prompt_id, 
        (SELECT like_count FROM public.prompts WHERE id = prompt_id),
        (SELECT like_count FROM public.prompts WHERE id = prompt_id);
END;
$$ LANGUAGE plpgsql;

-- 関数が正しく作成されたか確認
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname IN ('increment_like_count', 'decrement_like_count');

-- テスト: 直接UPDATEして確認
-- SELECT increment_like_count('your-prompt-id'::uuid);

