-- =============================================
-- プロフィール取得エラー修正用スクリプト
-- =============================================

-- 1. 現在のuser_profilesテーブルの状態を確認
SELECT 
    user_id,
    display_name,
    avatar_url,
    created_at,
    updated_at
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 認証済みユーザーの一覧を確認
SELECT 
    id,
    email,
    user_metadata,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. プロフィールが存在しないユーザーを特定
SELECT 
    u.id,
    u.email,
    u.user_metadata,
    u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;

-- 4. プロフィールが存在しないユーザーのプロフィールを手動作成
-- （必要に応じて実行）
INSERT INTO public.user_profiles (
    user_id,
    display_name,
    avatar_url,
    bio,
    contact,
    role,
    is_banned,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(
        u.user_metadata->>'display_name', 
        u.user_metadata->>'full_name',
        u.email
    ),
    u.user_metadata->>'avatar_url',
    NULL,
    '{}',
    'user',
    false,
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 5. 修正後の状態を確認
SELECT 
    user_id,
    display_name,
    avatar_url,
    created_at,
    updated_at
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 10;
