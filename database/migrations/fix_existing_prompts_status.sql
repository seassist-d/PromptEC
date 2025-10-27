-- =============================================
-- 既存プロンプトのステータス修正
-- 公開プロンプトをpublishedに設定
-- =============================================

-- 1. 現在のプロンプトステータスを確認
SELECT status, COUNT(*) as count
FROM public.prompts
GROUP BY status;

-- 2. visibility='public' のプロンプトを published に更新
UPDATE public.prompts
SET status = 'published'
WHERE visibility = 'public' AND status != 'published';

-- 3. visibility='unlisted' のプロンプトは published のまま
-- または draft にする場合は以下のコメントアウトを有効化
-- UPDATE public.prompts
-- SET status = 'draft'
-- WHERE visibility = 'unlisted';

-- 4. 確認
SELECT status, COUNT(*) as count
FROM public.prompts
GROUP BY status;

