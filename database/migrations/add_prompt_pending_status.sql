-- =============================================
-- プロンプト審査機能用のマイグレーション
-- pendingステータスとプロンプト承認アクションの追加
-- =============================================

-- 既存のenum型を削除して再作成
DROP TYPE IF EXISTS prompt_status CASCADE;
CREATE TYPE prompt_status AS ENUM ('draft', 'pending', 'published', 'suspended', 'deleted');

-- admin_actionにprompt_approveとprompt_suspendを追加
DROP TYPE IF EXISTS admin_action CASCADE;
CREATE TYPE admin_action AS ENUM (
  'user_ban', 
  'user_unban', 
  'prompt_approve', 
  'prompt_remove', 
  'prompt_suspend', 
  'review_remove', 
  'refund', 
  'other'
);

-- 変更をコミット
-- 注: このマイグレーションは既存のデータに影響を与えます
-- 既存のプロンプトのstatusは維持されます

