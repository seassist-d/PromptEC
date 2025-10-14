-- =============================================
-- インデックス作成
-- =============================================

-- カテゴリテーブルのインデックス
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- タグテーブルのインデックス
CREATE INDEX idx_tags_slug ON public.tags(slug);

-- ユーザープロフィールテーブルのインデックス
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_is_banned ON public.user_profiles(is_banned);

-- 出品者出金アカウントテーブルのインデックス
CREATE INDEX idx_seller_payout_accounts_seller_id ON public.seller_payout_accounts(seller_id);
CREATE INDEX idx_seller_payout_accounts_provider ON public.seller_payout_accounts(provider);

-- プロンプトテーブルのインデックス
CREATE INDEX idx_prompts_seller_id ON public.prompts(seller_id);
CREATE INDEX idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX idx_prompts_status_visibility ON public.prompts(status, visibility);
CREATE INDEX idx_prompts_price_jpy ON public.prompts(price_jpy);
CREATE INDEX idx_prompts_created_at ON public.prompts(created_at);
CREATE INDEX idx_prompts_avg_rating ON public.prompts(avg_rating DESC);
CREATE INDEX idx_prompts_ratings_count ON public.prompts(ratings_count DESC);

-- プロンプト全文検索用GINインデックス（日本語対応）
-- 注意: 日本語テキスト検索設定が存在しない場合は、以下のコメントアウトを解除して実行してください
-- CREATE TEXT SEARCH CONFIGURATION japanese (COPY = simple);
-- ALTER TEXT SEARCH CONFIGURATION japanese ALTER MAPPING FOR hword, hword_part, word WITH japanese_stem;

-- 日本語設定が利用できない場合は、simple設定を使用
CREATE INDEX idx_prompts_search ON public.prompts 
USING GIN (to_tsvector('simple', title || ' ' || COALESCE(short_description, '') || ' ' || COALESCE(long_description, '')));

-- プロンプトタグ関連テーブルのインデックス
CREATE INDEX idx_prompt_tags_tag_id ON public.prompt_tags(tag_id);

-- プロンプトバージョンテーブルのインデックス
CREATE INDEX idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_published_at ON public.prompt_versions(published_at);

-- プロンプトアセットテーブルのインデックス
CREATE INDEX idx_prompt_assets_prompt_version_id ON public.prompt_assets(prompt_version_id);
CREATE INDEX idx_prompt_assets_kind ON public.prompt_assets(kind);

-- プロンプトローカライゼーションテーブルのインデックス
CREATE INDEX idx_prompt_localizations_prompt_id ON public.prompt_localizations(prompt_id);
CREATE INDEX idx_prompt_localizations_locale ON public.prompt_localizations(locale);

-- カートテーブルのインデックス
CREATE INDEX idx_carts_buyer_id ON public.carts(buyer_id);
CREATE INDEX idx_carts_temp_key ON public.carts(temp_key);

-- カートアイテムテーブルのインデックス
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_prompt_id ON public.cart_items(prompt_id);

-- 注文テーブルのインデックス
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);

-- 注文アイテムテーブルのインデックス
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_prompt_id ON public.order_items(prompt_id);
CREATE INDEX idx_order_items_prompt_version_id ON public.order_items(prompt_version_id);

-- 決済プロバイダーテーブルのインデックス
CREATE INDEX idx_payment_providers_code ON public.payment_providers(code);

-- 決済テーブルのインデックス
CREATE INDEX idx_payments_provider_id ON public.payments(provider_id);
CREATE INDEX idx_payments_provider_txn_id ON public.payments(provider_txn_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- 所有権テーブルのインデックス
CREATE INDEX idx_entitlements_buyer_id ON public.entitlements(buyer_id);
CREATE INDEX idx_entitlements_prompt_version_id ON public.entitlements(prompt_version_id);

-- 台帳エントリーテーブルのインデックス
CREATE INDEX idx_ledger_entries_seller_id ON public.ledger_entries(seller_id);
CREATE INDEX idx_ledger_entries_order_id ON public.ledger_entries(order_id);
CREATE INDEX idx_ledger_entries_entry_type ON public.ledger_entries(entry_type);
CREATE INDEX idx_ledger_entries_created_at ON public.ledger_entries(created_at);

-- 出金テーブルのインデックス
CREATE INDEX idx_payouts_seller_id ON public.payouts(seller_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_requested_at ON public.payouts(requested_at);

-- レビューテーブルのインデックス
CREATE INDEX idx_reviews_prompt_id ON public.reviews(prompt_id);
CREATE INDEX idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- モデレーションチェックテーブルのインデックス
CREATE INDEX idx_moderation_checks_target ON public.moderation_checks(target_type, target_id);
CREATE INDEX idx_moderation_checks_result ON public.moderation_checks(result);
CREATE INDEX idx_moderation_checks_created_at ON public.moderation_checks(created_at);

-- 管理者アクションテーブルのインデックス
CREATE INDEX idx_admin_actions_actor_id ON public.admin_actions(actor_id);
CREATE INDEX idx_admin_actions_target ON public.admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);

-- AIジョブテーブルのインデックス
CREATE INDEX idx_ai_jobs_type_status ON public.ai_jobs(job_type, status);
CREATE INDEX idx_ai_jobs_created_at ON public.ai_jobs(created_at);

-- プレビューキャッシュテーブルのインデックス
CREATE INDEX idx_preview_cache_prompt_version_id ON public.preview_cache(prompt_version_id);
CREATE INDEX idx_preview_cache_preview_type ON public.preview_cache(preview_type);

-- 推薦イベントテーブルのインデックス
CREATE INDEX idx_recommendation_events_user_time ON public.recommendation_events(user_id, event_time);
CREATE INDEX idx_recommendation_events_prompt_time ON public.recommendation_events(prompt_id, event_time);
CREATE INDEX idx_recommendation_events_event_type ON public.recommendation_events(event_type);

-- 自動タグテーブルのインデックス
CREATE INDEX idx_auto_tags_prompt_id ON public.auto_tags(prompt_id);
CREATE INDEX idx_auto_tags_search ON public.auto_tags 
USING GIN (to_tsvector('simple', tag_text));

-- ランキングスナップショットテーブルのインデックス
CREATE INDEX idx_ranking_snapshots_type_period ON public.ranking_snapshots(rank_type, period);
CREATE INDEX idx_ranking_snapshots_dates ON public.ranking_snapshots(from_date, to_date);

-- 監査ログテーブルのインデックス
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- サブスクリプションプランテーブルのインデックス
CREATE INDEX idx_subscription_plans_status ON public.subscription_plans(status);

-- サブスクリプションテーブルのインデックス
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period ON public.subscriptions(current_period_start, current_period_end);
