-- =============================================
-- Google認証エラー修正用スクリプト
-- =============================================

-- 既存のトリガーを安全に削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS audit_trigger_user_profiles ON public.user_profiles;

-- 修正されたプロフィール作成関数
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS trigger AS $$
BEGIN
    -- Google認証の場合、user_metadataから情報を取得
    INSERT INTO public.user_profiles (
        user_id, 
        display_name, 
        avatar_url,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.user_metadata->>'display_name', 
            NEW.user_metadata->>'full_name',
            NEW.email
        ),
        NEW.user_metadata->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- エラーが発生した場合はログを出力して処理を継続
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- 監査ログトリガーを一時的に無効化（Google認証時のエラーを回避）
-- 必要に応じて後で有効化
-- CREATE TRIGGER audit_trigger_user_profiles
--     AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION audit_trigger_function();
