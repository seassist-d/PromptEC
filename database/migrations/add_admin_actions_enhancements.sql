-- =============================================
-- 管理者アクションテーブル拡張マイグレーション
-- 作成日: 2024年
-- 説明: ユーザー管理機能の実装に必要な機能を追加
-- =============================================

-- =============================================
-- 1. admin_action ENUM型にrole_changeを追加
-- =============================================

-- role_changeアクションをENUMに追加
-- 注意: PostgreSQLのENUM型への値追加は不可逆的な操作です
-- IF NOT EXISTSはPostgreSQLのENUM型ではにサポートされていないため、
-- エラーが発生する場合は既に値が存在しています

-- まず、値が存在するか確認してから追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'role_change' 
        AND enumtypid = 'admin_action'::regtype
    ) THEN
        ALTER TYPE admin_action ADD VALUE 'role_change';
    END IF;
END $$;

-- =============================================
-- 2. admin_actionsテーブルにmetadataカラムを追加
-- =============================================

-- metadataカラムを追加（変更前後のロール情報などを保存）
ALTER TABLE public.admin_actions 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- =============================================
-- 3. インデックスの追加・確認
-- =============================================

-- metadataカラムにGINインデックスを追加（JSON検索用）
CREATE INDEX IF NOT EXISTS idx_admin_actions_metadata 
ON public.admin_actions USING gin (metadata);

-- =============================================
-- 4. コメント追加
-- =============================================

-- カラムにコメントを追加
COMMENT ON COLUMN public.admin_actions.metadata IS 
'管理者アクションのメタデータ（例：ロール変更前後の値、BAN理由の詳細等）';

-- =============================================
-- 5. 確認クエリ
-- =============================================

-- 追加されたENUM値を確認
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'admin_action'::regtype
ORDER BY enumsortorder;

-- metadataカラムが追加されたことを確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_actions'
  AND column_name = 'metadata';

-- インデックスが作成されたことを確認
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'admin_actions'
  AND indexname = 'idx_admin_actions_metadata';

-- =============================================
-- 使用例
-- =============================================

-- ロール変更の記録例
/*
INSERT INTO public.admin_actions (
  actor_id,
  action,
  target_type,
  target_id,
  reason,
  metadata
) VALUES (
  '管理者のUUID'::uuid,
  'role_change',
  'user',
  '対象ユーザーのUUID'::uuid,
  '売上実績に基づく昇格',
  jsonb_build_object(
    'from_role', 'user',
    'to_role', 'seller'
  )
);
*/

-- BAN解除の詳細記録例
/*
INSERT INTO public.admin_actions (
  actor_id,
  action,
  target_type,
  target_id,
  reason,
  metadata
) VALUES (
  '管理者のUUID'::uuid,
  'user_unban',
  'user',
  '対象ユーザーのUUID'::uuid,
  '審査の結果、誤検知と判断',
  jsonb_build_object(
    'banned_reason', 'スパム行為の疑い',
    'investigation_result', 'レビューにより正常なユーザーと判明'
  )
);
*/
