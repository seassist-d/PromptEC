-- =============================================
-- プロフィール編集エラー修正用スクリプト
-- =============================================

-- 既存のuser_profiles監査ログトリガーを削除
DROP TRIGGER IF EXISTS audit_trigger_user_profiles ON public.user_profiles;

-- 修正された監査ログ関数を再作成
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    entity_id_value uuid;
BEGIN
    -- 変更前のデータを記録
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
    END IF;
    
    -- 変更後のデータを記録
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        new_data := to_jsonb(NEW);
    END IF;
    
    -- エンティティIDを安全に取得
    BEGIN
        CASE TG_TABLE_NAME
            WHEN 'user_profiles' THEN
                entity_id_value := COALESCE(NEW.user_id, OLD.user_id);
            WHEN 'orders' THEN
                entity_id_value := COALESCE(NEW.id, OLD.id);
            WHEN 'payments' THEN
                entity_id_value := COALESCE(NEW.id, OLD.id);
            WHEN 'prompts' THEN
                entity_id_value := COALESCE(NEW.id, OLD.id);
            ELSE
                entity_id_value := COALESCE(NEW.id, OLD.id);
        END CASE;
    EXCEPTION WHEN OTHERS THEN
        -- エンティティIDの取得に失敗した場合はスキップ
        RETURN COALESCE(NEW, OLD);
    END;
    
    -- 監査ログに記録（エラーハンドリング付き）
    BEGIN
        INSERT INTO public.audit_logs (
            actor_user_id,
            action,
            entity_type,
            entity_id,
            diff,
            created_at
        ) VALUES (
            auth.uid(),
            TG_OP || '.' || TG_TABLE_NAME,
            TG_TABLE_NAME,
            entity_id_value,
            jsonb_build_object(
                'old', old_data,
                'new', new_data
            ),
            now()
        );
    EXCEPTION WHEN OTHERS THEN
        -- 監査ログの記録に失敗した場合はスキップ（メイン処理は継続）
        NULL;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 他のテーブルの監査ログトリガーは再作成
DROP TRIGGER IF EXISTS audit_trigger_prompts ON public.prompts;
DROP TRIGGER IF EXISTS audit_trigger_orders ON public.orders;
DROP TRIGGER IF EXISTS audit_trigger_payments ON public.payments;

CREATE TRIGGER audit_trigger_prompts
    AFTER INSERT OR UPDATE OR DELETE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_orders
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- user_profilesテーブルの監査ログトリガーを有効化
CREATE TRIGGER audit_trigger_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();
