-- =============================================
-- 既存プロンプトバージョンにアセットを作成するマイグレーション
-- =============================================

-- プロンプトバージョンでアセットが存在しないものにアセットを作成
INSERT INTO public.prompt_assets (
  prompt_version_id,
  kind,
  text_content,
  size_bytes
)
SELECT 
  pv.id AS prompt_version_id,
  'text_body' AS kind,
  COALESCE(pv.sample_output_snapshot, pv.description_snapshot, '') AS text_content,
  LENGTH(COALESCE(pv.sample_output_snapshot, pv.description_snapshot, '')) AS size_bytes
FROM public.prompt_versions pv
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompt_assets pa WHERE pa.prompt_version_id = pv.id
)
AND (
  pv.sample_output_snapshot IS NOT NULL 
  OR pv.description_snapshot IS NOT NULL
);

-- アセット作成結果を表示
SELECT 
  'Migrated assets' AS status,
  COUNT(*) AS count
FROM public.prompt_assets
WHERE created_at > NOW() - INTERVAL '1 minute';

