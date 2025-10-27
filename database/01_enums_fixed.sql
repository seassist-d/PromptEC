-- =============================================
-- Enum型定義（修正版 - 既存の型を安全に削除してから再作成）
-- =============================================

-- 既存のEnum型を安全に削除（依存関係がある場合はCASCADEで削除）
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS visibility CASCADE;
DROP TYPE IF EXISTS prompt_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS payout_status CASCADE;
DROP TYPE IF EXISTS payout_provider CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS asset_kind CASCADE;
DROP TYPE IF EXISTS ledger_entry_type CASCADE;
DROP TYPE IF EXISTS ai_job_type CASCADE;
DROP TYPE IF EXISTS ai_job_status CASCADE;
DROP TYPE IF EXISTS model_provider CASCADE;
DROP TYPE IF EXISTS moderation_result CASCADE;
DROP TYPE IF EXISTS moderation_method CASCADE;
DROP TYPE IF EXISTS admin_action CASCADE;
DROP TYPE IF EXISTS preview_type CASCADE;
DROP TYPE IF EXISTS recommendation_event_type CASCADE;
DROP TYPE IF EXISTS ranking_type CASCADE;
DROP TYPE IF EXISTS ranking_period CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_period CASCADE;
DROP TYPE IF EXISTS subscription_plan_status CASCADE;
DROP TYPE IF EXISTS target_type CASCADE;

-- ユーザーロール
CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');

-- 可視性設定
CREATE TYPE visibility AS ENUM ('public', 'unlisted', 'private');

-- プロンプトステータス
CREATE TYPE prompt_status AS ENUM ('draft', 'pending', 'published', 'suspended', 'deleted');

-- 注文ステータス
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

-- 決済ステータス
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');

-- レビューステータス
CREATE TYPE review_status AS ENUM ('visible', 'hidden', 'removed');

-- 出金ステータス
CREATE TYPE payout_status AS ENUM ('requested', 'processing', 'paid', 'failed');

-- 出金プロバイダー
CREATE TYPE payout_provider AS ENUM ('bank', 'paypal', 'paypay', 'stripe_connect', 'other');

-- コンテンツタイプ
CREATE TYPE content_type AS ENUM ('text', 'file', 'mixed');

-- アセット種別
CREATE TYPE asset_kind AS ENUM ('text_body', 'attachment', 'image', 'meta');

-- 台帳エントリータイプ
CREATE TYPE ledger_entry_type AS ENUM ('sale_gross', 'platform_fee', 'payment_fee', 'seller_net', 'payout', 'adjustment', 'refund');

-- AIジョブタイプ
CREATE TYPE ai_job_type AS ENUM ('preview_generate', 'moderation_analyze', 'auto_tagging', 'recommendation_train');

-- AIジョブステータス
CREATE TYPE ai_job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- モデルプロバイダー
CREATE TYPE model_provider AS ENUM ('openai', 'google', 'claude', 'other');

-- モデレーション結果
CREATE TYPE moderation_result AS ENUM ('pass', 'flag', 'reject');

-- モデレーション方法
CREATE TYPE moderation_method AS ENUM ('ai_sdk', 'manual');

-- 管理者アクション
CREATE TYPE admin_action AS ENUM ('user_ban', 'user_unban', 'prompt_approve', 'prompt_remove', 'prompt_suspend', 'review_remove', 'refund', 'other');

-- プレビュータイプ
CREATE TYPE preview_type AS ENUM ('head_lines', 'truncated_output', 'masked_text');

-- 推薦イベントタイプ
CREATE TYPE recommendation_event_type AS ENUM ('view', 'click', 'add_to_cart', 'purchase', 'like');

-- ランキングタイプ
CREATE TYPE ranking_type AS ENUM ('sales', 'views', 'rating', 'trending');

-- ランキング期間
CREATE TYPE ranking_period AS ENUM ('daily', 'weekly', 'monthly');

-- サブスクリプションステータス
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');

-- サブスクリプション期間
CREATE TYPE subscription_period AS ENUM ('monthly', 'yearly');

-- サブスクリプションプランステータス
CREATE TYPE subscription_plan_status AS ENUM ('active', 'inactive');

-- ターゲットタイプ（モデレーション・管理者アクション用）
CREATE TYPE target_type AS ENUM ('prompt', 'sample_output', 'review', 'user', 'order');
