-- =============================================
-- 既存プロンプトにバージョンデータを作成するマイグレーション
-- =============================================

-- 既存のプロンプトでバージョンが存在しないものにバージョン1を作成
INSERT INTO public.prompt_versions (
  prompt_id,
  version,
  title_snapshot,
  description_snapshot,
  sample_output_snapshot,
  content_type,
  published_at
)
SELECT 
  p.id AS prompt_id,
  1 AS version,
  p.title AS title_snapshot,
  p.short_description AS description_snapshot,
  p.long_description AS sample_output_snapshot,
  'text' AS content_type,
  p.created_at AS published_at
FROM public.prompts p
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompt_versions pv WHERE pv.prompt_id = p.id
)
AND p.status = 'published';

-- バージョン作成結果を表示
SELECT 
  'Migrated prompts' AS status,
  COUNT(*) AS count
FROM public.prompt_versions
WHERE prompt_id IN (
  SELECT id FROM public.prompts WHERE status = 'published'
);

