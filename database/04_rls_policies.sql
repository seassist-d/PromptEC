-- =============================================
-- RLS (Row Level Security) ポリシー設定（修正版 - 既存のポリシーを安全に削除してから再作成）
-- =============================================

-- 既存のRLSポリシーを安全に削除
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Only admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Active subscription plans are viewable by everyone" ON public.subscription_plans;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Payment providers are viewable by everyone" ON public.payment_providers;
DROP POLICY IF EXISTS "Admins can manage all payout accounts" ON public.seller_payout_accounts;
DROP POLICY IF EXISTS "Users can manage their own payout accounts" ON public.seller_payout_accounts;
DROP POLICY IF EXISTS "Users can create payments for their orders" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all prompt assets" ON public.prompt_assets;
DROP POLICY IF EXISTS "Users can manage prompt assets for their own versions" ON public.prompt_assets;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Only admins can insert ranking snapshots" ON public.ranking_snapshots;
DROP POLICY IF EXISTS "Ranking snapshots are viewable by everyone" ON public.ranking_snapshots;
DROP POLICY IF EXISTS "Public auto tags are viewable by everyone" ON public.auto_tags;
DROP POLICY IF EXISTS "Only admins can view all recommendation events" ON public.recommendation_events;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.recommendation_events;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.recommendation_events;
DROP POLICY IF EXISTS "Anyone can insert recommendation events" ON public.recommendation_events;
DROP POLICY IF EXISTS "Public previews are viewable by everyone" ON public.preview_cache;
DROP POLICY IF EXISTS "Only admins can manage AI jobs" ON public.ai_jobs;
DROP POLICY IF EXISTS "Only admins can manage admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Only admins can manage moderation checks" ON public.moderation_checks;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Users can request payouts" ON public.payouts;
DROP POLICY IF EXISTS "Users can view their own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admins can view all ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Users can view their own ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Admins can view all balances" ON public.seller_balances;
DROP POLICY IF EXISTS "Users can view their own balance" ON public.seller_balances;
DROP POLICY IF EXISTS "Admins can view all entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Users can view their own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anonymous users can manage temp cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can manage temp carts" ON public.carts;
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.carts;
DROP POLICY IF EXISTS "Admins can view all prompt assets" ON public.prompt_assets;
DROP POLICY IF EXISTS "Users can view their own prompt assets" ON public.prompt_assets;
DROP POLICY IF EXISTS "Buyers can view purchased prompt assets" ON public.prompt_assets;
DROP POLICY IF EXISTS "Public prompt assets are viewable by everyone" ON public.prompt_assets;
DROP POLICY IF EXISTS "Admins can view all prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can update their own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can insert their own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can view their own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Public prompt versions are viewable by everyone" ON public.prompt_versions;
DROP POLICY IF EXISTS "Admins can update any prompt" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can view all prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON public.prompts;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;

-- RLSを有効化
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ユーザープロフィールテーブルのポリシー
-- =============================================

-- 全ユーザーがプロフィールを閲覧可能
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (true);

-- ユーザーは自分のプロフィールを更新可能
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールを挿入可能
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者は全ユーザーのプロフィールを更新可能
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 決済プロバイダーテーブルのポリシー
-- =============================================

-- 決済プロバイダーは参照用なので、全員が閲覧可能にする
CREATE POLICY "Payment providers are viewable by everyone" ON public.payment_providers
  FOR SELECT USING (true);

-- =============================================
-- 出品者出金アカウントテーブルのポリシー
-- =============================================

-- ユーザーは自分の出金アカウントを閲覧・挿入・更新可能
CREATE POLICY "Users can manage their own payout accounts" ON public.seller_payout_accounts
  FOR ALL USING (auth.uid() = seller_id);

-- 管理者は全出金アカウントを閲覧・更新可能
CREATE POLICY "Admins can manage all payout accounts" ON public.seller_payout_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- プロンプトテーブルのポリシー
-- =============================================

-- 公開プロンプトは誰でも閲覧可能
CREATE POLICY "Public prompts are viewable by everyone" ON public.prompts
  FOR SELECT USING (status = 'published' AND visibility = 'public');

-- ユーザーは自分のプロンプトを閲覧可能
CREATE POLICY "Users can view their own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = seller_id);

-- 管理者は全プロンプトを閲覧可能
CREATE POLICY "Admins can view all prompts" ON public.prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ユーザーは自分のプロンプトを挿入可能
CREATE POLICY "Users can insert their own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- ユーザーは自分のプロンプトを更新可能
CREATE POLICY "Users can update their own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = seller_id);

-- ユーザーは自分のプロンプトを削除可能
CREATE POLICY "Users can delete their own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = seller_id);

-- 管理者は全プロンプトを更新可能
CREATE POLICY "Admins can update any prompt" ON public.prompts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- プロンプトバージョンテーブルのポリシー
-- =============================================

-- 公開プロンプトのバージョンは誰でも閲覧可能
CREATE POLICY "Public prompt versions are viewable by everyone" ON public.prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = prompt_id 
      AND status = 'published' 
      AND visibility = 'public'
    )
  );

-- ユーザーは自分のプロンプトのバージョンを閲覧可能
CREATE POLICY "Users can view their own prompt versions" ON public.prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = prompt_id AND seller_id = auth.uid()
    )
  );

-- 管理者は全プロンプトバージョンを閲覧可能
CREATE POLICY "Admins can view all prompt versions" ON public.prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ユーザーは自分のプロンプトのバージョンを挿入可能
CREATE POLICY "Users can insert their own prompt versions" ON public.prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = prompt_id AND seller_id = auth.uid()
    )
  );

-- ユーザーは自分のプロンプトのバージョンを更新可能
CREATE POLICY "Users can update their own prompt versions" ON public.prompt_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = prompt_id AND seller_id = auth.uid()
    )
  );

-- =============================================
-- プロンプトアセットテーブルのポリシー
-- =============================================

-- 公開プロンプトのアセットは誰でも閲覧可能
CREATE POLICY "Public prompt assets are viewable by everyone" ON public.prompt_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompt_versions pv
      JOIN public.prompts p ON p.id = pv.prompt_id
      WHERE pv.id = prompt_version_id 
      AND p.status = 'published' 
      AND p.visibility = 'public'
    )
  );

-- 購入者は購入したプロンプトのアセットを閲覧可能
CREATE POLICY "Buyers can view purchased prompt assets" ON public.prompt_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entitlements e
      WHERE e.buyer_id = auth.uid() 
      AND e.prompt_version_id = prompt_version_id
    )
  );

-- ユーザーは自分のプロンプトのアセットを閲覧可能
CREATE POLICY "Users can view their own prompt assets" ON public.prompt_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompt_versions pv
      JOIN public.prompts p ON p.id = pv.prompt_id
      WHERE pv.id = prompt_version_id AND p.seller_id = auth.uid()
    )
  );

-- 管理者は全プロンプトアセットを閲覧可能
CREATE POLICY "Admins can view all prompt assets" ON public.prompt_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- プロンプトバージョン所有者は自分のバージョンのアセットを作成・更新可能
CREATE POLICY "Users can manage prompt assets for their own versions" ON public.prompt_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.prompt_versions pv
      JOIN public.prompts p ON pv.prompt_id = p.id
      WHERE pv.id = prompt_version_id AND p.seller_id = auth.uid()
    )
  );

-- 管理者は全プロンプトアセットを管理可能
CREATE POLICY "Admins can manage all prompt assets" ON public.prompt_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- カートテーブルのポリシー
-- =============================================

-- ユーザーは自分のカートを閲覧・更新・削除可能
CREATE POLICY "Users can manage their own carts" ON public.carts
  FOR ALL USING (auth.uid() = buyer_id);

-- 未ログインユーザーは一時カートを管理可能（temp_keyベース）
CREATE POLICY "Anonymous users can manage temp carts" ON public.carts
  FOR ALL USING (buyer_id IS NULL AND temp_key IS NOT NULL);

-- =============================================
-- カートアイテムテーブルのポリシー
-- =============================================

-- ユーザーは自分のカートのアイテムを管理可能
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE id = cart_id AND buyer_id = auth.uid()
    )
  );

-- 未ログインユーザーは一時カートのアイテムを管理可能
CREATE POLICY "Anonymous users can manage temp cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE id = cart_id AND buyer_id IS NULL AND temp_key IS NOT NULL
    )
  );

-- =============================================
-- 注文テーブルのポリシー
-- =============================================

-- ユーザーは自分の注文を閲覧可能
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);

-- ユーザーは注文を作成可能
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 管理者は全注文を閲覧可能
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 注文アイテムテーブルのポリシー
-- =============================================

-- ユーザーは自分の注文のアイテムを閲覧可能
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND buyer_id = auth.uid()
    )
  );

-- 管理者は全注文アイテムを閲覧可能
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ユーザーは注文アイテムを作成可能
CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND buyer_id = auth.uid()
    )
  );

-- 管理者は全注文アイテムを管理可能
CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 決済テーブルのポリシー
-- =============================================

-- ユーザーは自分の注文の決済情報を閲覧可能
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND buyer_id = auth.uid()
    )
  );

-- 管理者は全決済情報を閲覧可能
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ユーザーは自分の注文の決済情報を作成可能
CREATE POLICY "Users can create payments for their orders" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND buyer_id = auth.uid()
    )
  );

-- 管理者は全決済情報を管理可能
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 所有権テーブルのポリシー
-- =============================================

-- ユーザーは自分の所有権を閲覧可能
CREATE POLICY "Users can view their own entitlements" ON public.entitlements
  FOR SELECT USING (auth.uid() = buyer_id);

-- 管理者は全所有権を閲覧可能
CREATE POLICY "Admins can view all entitlements" ON public.entitlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 出品者残高テーブルのポリシー
-- =============================================

-- ユーザーは自分の残高を閲覧可能
CREATE POLICY "Users can view their own balance" ON public.seller_balances
  FOR SELECT USING (auth.uid() = seller_id);

-- 管理者は全残高を閲覧可能
CREATE POLICY "Admins can view all balances" ON public.seller_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 台帳エントリーテーブルのポリシー
-- =============================================

-- ユーザーは自分の台帳エントリーを閲覧可能
CREATE POLICY "Users can view their own ledger entries" ON public.ledger_entries
  FOR SELECT USING (auth.uid() = seller_id);

-- 管理者は全台帳エントリーを閲覧可能
CREATE POLICY "Admins can view all ledger entries" ON public.ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 出金テーブルのポリシー
-- =============================================

-- ユーザーは自分の出金を閲覧可能
CREATE POLICY "Users can view their own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = seller_id);

-- ユーザーは出金申請可能
CREATE POLICY "Users can request payouts" ON public.payouts
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- 管理者は全出金を閲覧・更新可能
CREATE POLICY "Admins can manage all payouts" ON public.payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- レビューテーブルのポリシー
-- =============================================

-- 公開レビューは誰でも閲覧可能
CREATE POLICY "Public reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (status = 'visible');

-- ユーザーは自分のレビューを閲覧・更新・削除可能
CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = buyer_id);

-- 管理者は全レビューを閲覧・更新可能
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- モデレーションチェックテーブルのポリシー
-- =============================================

-- 管理者のみモデレーションチェックを閲覧・更新可能
CREATE POLICY "Only admins can manage moderation checks" ON public.moderation_checks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 管理者アクションテーブルのポリシー
-- =============================================

-- 管理者のみ管理者アクションを閲覧・挿入可能
CREATE POLICY "Only admins can manage admin actions" ON public.admin_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- AIジョブテーブルのポリシー
-- =============================================

-- 管理者のみAIジョブを閲覧・管理可能
CREATE POLICY "Only admins can manage AI jobs" ON public.ai_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- プレビューキャッシュテーブルのポリシー
-- =============================================

-- 公開プロンプトのプレビューは誰でも閲覧可能
CREATE POLICY "Public previews are viewable by everyone" ON public.preview_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompt_versions pv
      JOIN public.prompts p ON p.id = pv.prompt_id
      WHERE pv.id = prompt_version_id 
      AND p.status = 'published' 
      AND p.visibility = 'public'
    )
  );

-- =============================================
-- 推薦イベントテーブルのポリシー
-- =============================================

-- 全ユーザーが推薦イベントを挿入可能
CREATE POLICY "Anyone can insert recommendation events" ON public.recommendation_events
  FOR INSERT WITH CHECK (true);

-- ユーザーは自分のいいねを閲覧・削除可能
CREATE POLICY "Users can view their own likes" ON public.recommendation_events
  FOR SELECT USING (auth.uid() = user_id AND event_type = 'like');

-- ユーザーは自分のいいねを削除可能
CREATE POLICY "Users can delete their own likes" ON public.recommendation_events
  FOR DELETE USING (auth.uid() = user_id AND event_type = 'like');

-- 管理者のみ全推薦イベントを閲覧可能
CREATE POLICY "Only admins can view all recommendation events" ON public.recommendation_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 自動タグテーブルのポリシー
-- =============================================

-- 公開プロンプトの自動タグは誰でも閲覧可能
CREATE POLICY "Public auto tags are viewable by everyone" ON public.auto_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = prompt_id 
      AND status = 'published' 
      AND visibility = 'public'
    )
  );

-- =============================================
-- ランキングスナップショットテーブルのポリシー
-- =============================================

-- 全ユーザーがランキングスナップショットを閲覧可能
CREATE POLICY "Ranking snapshots are viewable by everyone" ON public.ranking_snapshots
  FOR SELECT USING (true);

-- 管理者のみランキングスナップショットを挿入可能
CREATE POLICY "Only admins can insert ranking snapshots" ON public.ranking_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 監査ログテーブルのポリシー
-- =============================================

-- 管理者のみ監査ログを閲覧可能
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- サブスクリプションプランテーブルのポリシー
-- =============================================

-- アクティブなサブスクリプションプランは誰でも閲覧可能
CREATE POLICY "Active subscription plans are viewable by everyone" ON public.subscription_plans
  FOR SELECT USING (status = 'active');

-- 管理者のみサブスクリプションプランを管理可能
CREATE POLICY "Only admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- サブスクリプションテーブルのポリシー
-- =============================================

-- ユーザーは自分のサブスクリプションを閲覧・更新可能
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 管理者は全サブスクリプションを閲覧・管理可能
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
