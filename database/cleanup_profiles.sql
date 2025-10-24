-- =============================================
-- 不要なプロフィールレコードクリーンアップスクリプト
-- =============================================

-- 注意: このスクリプトは既存のプロフィールレコードを削除します
-- 実行前に必ずバックアップを取ってください

-- 1. 現在のプロフィール数を確認
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 2. 各ユーザーのプロフィール作成状況を確認
SELECT 
    up.user_id,
    au.email,
    au.created_at as user_created_at,
    up.created_at as profile_created_at,
    (up.created_at - au.created_at) as time_diff
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
ORDER BY au.created_at DESC;

-- 3. プロフィールが自動作成された可能性のあるレコードを特定
-- （ユーザー作成から1分以内にプロフィールが作成されたレコード）
SELECT 
    up.user_id,
    au.email,
    au.created_at as user_created_at,
    up.created_at as profile_created_at,
    (up.created_at - au.created_at) as time_diff
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE (up.created_at - au.created_at) < INTERVAL '1 minute'
ORDER BY au.created_at DESC;

-- 4. 不要なプロフィールレコードを削除（コメントアウト）
-- 注意: 実際に削除する場合は以下のコメントを外してください
-- DELETE FROM user_profiles 
-- WHERE user_id IN (
--     SELECT up.user_id
--     FROM user_profiles up
--     JOIN auth.users au ON up.user_id = au.id
--     WHERE (up.created_at - au.created_at) < INTERVAL '1 minute'
-- );

-- 5. 削除後の確認
-- SELECT COUNT(*) as remaining_profiles FROM user_profiles;
