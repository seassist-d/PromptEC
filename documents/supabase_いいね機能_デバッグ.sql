-- いいね機能 デバッグ用SQL
-- SupabaseダッシュボードのSQL Editorで実行

-- ============================================
-- 1. 現在のプロンプトのいいね数を確認
-- ============================================
-- あなたのプロンプトのslugを 'your-slug' に置き換えてください
SELECT 
  id,
  slug,
  title,
  like_count,
  created_at,
  updated_at
FROM prompts
WHERE slug = 'your-slug';

-- ============================================
-- 2. いいねレコードを確認
-- ============================================
-- 特定のプロンプトのいいねを確認
SELECT 
  re.id,
  re.prompt_id,
  re.user_id,
  re.event_type,
  re.event_time,
  up.display_name
FROM recommendation_events re
JOIN prompts p ON p.id = re.prompt_id
LEFT JOIN user_profiles up ON up.user_id = re.user_id
WHERE p.slug = 'your-slug'
  AND re.event_type = 'like';

-- ============================================
-- 3. RPC関数が存在するか確認
-- ============================================
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname IN ('increment_like_count', 'decrement_like_count');

-- ============================================
-- 4. RLSポリシーを確認
-- ============================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'recommendation_events'
ORDER BY policyname;

-- ============================================
-- 5. テスト用の手動更新
-- ============================================
-- 注意: このクエリはテスト用です。本番環境では使用しないでください

-- いいね数を1増やす（テスト用）
-- UPDATE prompts 
-- SET like_count = COALESCE(like_count, 0) + 1
-- WHERE slug = 'your-slug';

-- ============================================
-- 6. データベース関数の実行テスト
-- ============================================
-- プロンプトIDを 'your-prompt-id' に置き換えてください

-- いいね数を増やすテスト
-- SELECT increment_like_count('your-prompt-id'::uuid);

-- いいね数を減らすテスト
-- SELECT decrement_like_count('your-prompt-id'::uuid);

-- ============================================
-- 7. 現在のいいね数をリセット（テスト用）
-- ============================================
-- 注意: このクエリはテスト用です
-- UPDATE prompts 
-- SET like_count = (
--   SELECT COUNT(*) 
--   FROM recommendation_events 
--   WHERE prompt_id = prompts.id 
--     AND event_type = 'like'
-- )
-- WHERE slug = 'your-slug';

-- ============================================
-- 8. おかしいレコードを検索
-- ============================================
-- 重複していいねレコードを探す
SELECT 
  prompt_id,
  user_id,
  COUNT(*) as duplicate_count
FROM recommendation_events
WHERE event_type = 'like'
GROUP BY prompt_id, user_id
HAVING COUNT(*) > 1;

-- 一致しないlike_countを探す
SELECT 
  p.id,
  p.slug,
  p.like_count as db_like_count,
  COUNT(re.id) as actual_like_count,
  (p.like_count - COUNT(re.id)) as difference
FROM prompts p
LEFT JOIN recommendation_events re ON re.prompt_id = p.id AND re.event_type = 'like'
GROUP BY p.id, p.slug, p.like_count
HAVING p.like_count != COUNT(re.id);

