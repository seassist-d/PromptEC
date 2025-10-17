-- =============================================
-- 基本テーブル作成（修正版 - 既存のテーブルを安全に削除してから再作成）
-- =============================================

-- 既存のテーブルを安全に削除（依存関係がある場合はCASCADEで削除）
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.ranking_snapshots CASCADE;
DROP TABLE IF EXISTS public.auto_tags CASCADE;
DROP TABLE IF EXISTS public.recommendation_events CASCADE;
DROP TABLE IF EXISTS public.preview_cache CASCADE;
DROP TABLE IF EXISTS public.ai_jobs CASCADE;
DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.moderation_checks CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.ledger_entries CASCADE;
DROP TABLE IF EXISTS public.seller_balances CASCADE;
DROP TABLE IF EXISTS public.entitlements CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.payment_providers CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.prompt_localizations CASCADE;
DROP TABLE IF EXISTS public.prompt_assets CASCADE;
DROP TABLE IF EXISTS public.prompt_versions CASCADE;
DROP TABLE IF EXISTS public.prompt_tags CASCADE;
DROP TABLE IF EXISTS public.prompts CASCADE;
DROP TABLE IF EXISTS public.seller_payout_accounts CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- カテゴリテーブル
CREATE TABLE public.categories (
  id bigserial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  parent_id bigint REFERENCES public.categories(id),
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- タグテーブル
CREATE TABLE public.tags (
  id bigserial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ユーザープロフィールテーブル
CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  contact jsonb DEFAULT '{}',
  role user_role NOT NULL DEFAULT 'user',
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- 出品者出金アカウントテーブル
CREATE TABLE public.seller_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  provider payout_provider NOT NULL,
  account_payload jsonb NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- プロンプトテーブル
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE RESTRICT,
  title text NOT NULL,
  slug text UNIQUE,
  category_id bigint REFERENCES public.categories(id),
  thumbnail_url text,
  price_jpy integer NOT NULL CHECK (price_jpy >= 0),
  currency text NOT NULL DEFAULT 'JPY',
  short_description text,
  long_description text,
  sample_output text,
  visibility visibility NOT NULL DEFAULT 'public',
  status prompt_status NOT NULL DEFAULT 'draft',
  like_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  ratings_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- プロンプトタグ関連テーブル（M:N）
CREATE TABLE public.prompt_tags (
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  tag_id bigint NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

-- プロンプトバージョンテーブル
CREATE TABLE public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title_snapshot text,
  description_snapshot text,
  sample_output_snapshot text,
  content_type content_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (prompt_id, version)
);

-- プロンプトアセットテーブル
CREATE TABLE public.prompt_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id uuid NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  kind asset_kind NOT NULL,
  storage_path text,
  text_content text,
  checksum text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- プロンプトローカライゼーションテーブル（将来の多言語展開）
CREATE TABLE public.prompt_localizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title_l10n text,
  short_description_l10n text,
  long_description_l10n text,
  UNIQUE (prompt_id, locale)
);

-- カートテーブル
CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  temp_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- カートアイテムテーブル
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  unit_price_jpy integer NOT NULL CHECK (unit_price_jpy >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity = 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 注文テーブル
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE RESTRICT,
  order_number text UNIQUE NOT NULL,
  total_amount_jpy integer NOT NULL CHECK (total_amount_jpy >= 0),
  currency text NOT NULL DEFAULT 'JPY',
  status order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- 注文アイテムテーブル
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE RESTRICT,
  prompt_version_id uuid NOT NULL REFERENCES public.prompt_versions(id) ON DELETE RESTRICT,
  unit_price_jpy integer NOT NULL CHECK (unit_price_jpy >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity = 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 決済プロバイダーテーブル
CREATE TABLE public.payment_providers (
  id smallserial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  display_name text NOT NULL,
  fee_percent numeric(5,2),
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 決済テーブル
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_id smallint NOT NULL REFERENCES public.payment_providers(id),
  provider_txn_id text,
  amount_jpy integer NOT NULL CHECK (amount_jpy >= 0),
  status payment_status NOT NULL DEFAULT 'pending',
  raw_payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- 所有権テーブル（ダウンロード権）
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  prompt_version_id uuid NOT NULL REFERENCES public.prompt_versions(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now()
);

-- 出品者残高テーブル
CREATE TABLE public.seller_balances (
  seller_id uuid PRIMARY KEY REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  available_jpy bigint NOT NULL DEFAULT 0,
  pending_jpy bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 台帳エントリーテーブル
CREATE TABLE public.ledger_entries (
  id bigserial PRIMARY KEY,
  entry_type ledger_entry_type NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  order_item_id uuid REFERENCES public.order_items(id),
  seller_id uuid REFERENCES public.user_profiles(user_id),
  amount_jpy bigint NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 出金テーブル
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  payout_account_id uuid NOT NULL REFERENCES public.seller_payout_accounts(id),
  amount_jpy bigint NOT NULL CHECK (amount_jpy > 0),
  status payout_status NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  provider_txn_id text
);

-- レビューテーブル
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status review_status NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  UNIQUE (prompt_id, buyer_id)
);

-- モデレーションチェックテーブル
CREATE TABLE public.moderation_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type target_type NOT NULL,
  target_id uuid NOT NULL,
  method moderation_method NOT NULL,
  result moderation_result NOT NULL,
  detail jsonb DEFAULT '{}',
  checked_by uuid REFERENCES public.user_profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 管理者アクションテーブル
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE RESTRICT,
  action admin_action NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AIジョブテーブル
CREATE TABLE public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type ai_job_type NOT NULL,
  status ai_job_status NOT NULL DEFAULT 'queued',
  input_payload jsonb DEFAULT '{}',
  output_payload jsonb DEFAULT '{}',
  model_provider model_provider,
  model_name text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- プレビューキャッシュテーブル
CREATE TABLE public.preview_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id uuid NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  preview_type preview_type NOT NULL,
  content text NOT NULL,
  generated_by_job uuid REFERENCES public.ai_jobs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prompt_version_id, preview_type)
);

-- 推薦イベントテーブル
CREATE TABLE public.recommendation_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(user_id),
  event_type recommendation_event_type NOT NULL,
  prompt_id uuid REFERENCES public.prompts(id),
  referrer text,
  event_time timestamptz NOT NULL DEFAULT now(),
  meta jsonb DEFAULT '{}'
);

-- 自動タグテーブル
CREATE TABLE public.auto_tags (
  id bigserial PRIMARY KEY,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  tag_text text NOT NULL,
  confidence numeric(4,3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ランキングスナップショットテーブル
CREATE TABLE public.ranking_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_type ranking_type NOT NULL,
  period ranking_period NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  rows jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rank_type, period, from_date, to_date)
);

-- 監査ログテーブル
CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES public.user_profiles(user_id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  diff jsonb DEFAULT '{}',
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- サブスクリプションプランテーブル（将来機能）
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_jpy integer NOT NULL CHECK (price_jpy >= 0),
  period subscription_period NOT NULL,
  benefits jsonb DEFAULT '{}',
  status subscription_plan_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- サブスクリプションテーブル（将来機能）
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
