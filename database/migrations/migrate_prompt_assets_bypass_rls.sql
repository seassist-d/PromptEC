-- =============================================
-- RLSを一時的に無効化してアセットを作成
-- =============================================

-- RLSを一時的に無効化（アセット作成のため）
ALTER TABLE public.prompt_assets DISABLE ROW LEVEL SECURITY;

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

-- RLSを再有効化
ALTER TABLE public.prompt_assets ENABLE ROW LEVEL SECURITY;

-- 作成されたアセットの確認
SELECT 
  'Created assets' AS status,
  COUNT(*) AS count
FROM public.prompt_assets
WHERE created_at > NOW() - INTERVAL '1 minute';

