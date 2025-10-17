-- =============================================
-- Supabase SQL Editor 実行用メインファイル
-- =============================================
-- 
-- このファイルは、SupabaseのSQL Editorで実行するための
-- メインファイルです。以下の順序で実行してください：
--
-- 【重要】既存のuser_profilesテーブルがある場合のクリーンアップ
-- 既にfront/create_user_profiles_table.sqlでテーブルを作成済みの場合は、
-- 以下のクリーンアップを先に実行してください：
--
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP FUNCTION IF EXISTS create_profile_for_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
--
-- 1. 01_enums_fixed.sql - Enum型の定義
-- 2. 02_tables.sql - テーブルの作成
-- 3. 03_indexes.sql - インデックスの作成
-- 4. 04_rls_policies.sql - RLSポリシーの設定
-- 5. 05_functions.sql - PostgreSQL関数の定義（安全な関数のみ）
-- 6. 06_triggers.sql - トリガーの設定
-- 7. 07_seed_data.sql - 初期データの投入
-- 8. 08_japanese_search_optional.sql - 日本語検索の高度な設定（オプション）
-- 9. 09_maintenance_functions.sql - メンテナンス用関数（破壊的操作を含む・オプション）
--
-- 注意事項：
-- - 各ファイルは順番に実行してください
-- - エラーが発生した場合は、前のファイルが正常に実行されているか確認してください
-- - 本番環境では、バックアップを取ってから実行してください
--
-- =============================================

-- 実行状況の確認用クエリ
-- 以下のクエリで各ステップの実行状況を確認できます

-- 1. Enum型の確認
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
    'user_role', 'visibility', 'prompt_status', 'order_status', 
    'payment_status', 'review_status', 'payout_status', 'payout_provider',
    'content_type', 'asset_kind', 'ledger_entry_type', 'ai_job_type',
    'ai_job_status', 'model_provider', 'moderation_result', 'moderation_method',
    'admin_action', 'preview_type', 'recommendation_event_type', 'ranking_type',
    'ranking_period', 'subscription_status', 'subscription_period', 
    'subscription_plan_status', 'target_type'
)
ORDER BY t.typname, e.enumsortorder;

-- 2. テーブルの確認
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'prompts', 'prompt_versions', 'prompt_assets',
    'categories', 'tags', 'prompt_tags', 'orders', 'order_items',
    'payments', 'entitlements', 'reviews', 'seller_balances',
    'ledger_entries', 'payouts', 'moderation_checks', 'admin_actions',
    'ai_jobs', 'preview_cache', 'recommendation_events', 'auto_tags',
    'ranking_snapshots', 'audit_logs', 'subscription_plans', 'subscriptions',
    'carts', 'cart_items', 'seller_payout_accounts', 'payment_providers',
    'prompt_localizations'
)
ORDER BY tablename;

-- 3. インデックスの確認
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'prompts', 'prompt_versions', 'prompt_assets',
    'categories', 'tags', 'prompt_tags', 'orders', 'order_items',
    'payments', 'entitlements', 'reviews', 'seller_balances',
    'ledger_entries', 'payouts', 'moderation_checks', 'admin_actions',
    'ai_jobs', 'preview_cache', 'recommendation_events', 'auto_tags',
    'ranking_snapshots', 'audit_logs', 'subscription_plans', 'subscriptions',
    'carts', 'cart_items', 'seller_payout_accounts', 'payment_providers',
    'prompt_localizations'
)
ORDER BY tablename, indexname;

-- 4. RLSポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. 関数の確認
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_order_number', 'update_prompt_stats', 'calculate_seller_balance',
    'update_seller_balance', 'generate_prompt_slug', 'search_prompts',
    'check_download_permission', 'get_sales_statistics',
    'update_prompt_popularity', 'get_admin_dashboard_stats',
    'create_profile_for_new_user', 'auto_create_seller_balance',
    'auto_generate_prompt_slug', 'auto_generate_order_number',
    'auto_generate_version_number', 'set_published_timestamp',
    'auto_grant_entitlements', 'audit_trigger_function'
)
ORDER BY p.proname;

-- 6. トリガーの確認
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND t.tgname IN (
    'trigger_update_prompt_stats', 'trigger_update_seller_balance',
    'trigger_update_prompt_popularity', 'trigger_auto_generate_prompt_slug',
    'trigger_auto_generate_order_number', 'audit_trigger_prompts',
    'audit_trigger_orders', 'audit_trigger_payments', 'audit_trigger_user_profiles',
    'trigger_auto_generate_version_number', 'trigger_set_published_timestamp',
    'trigger_auto_grant_entitlements', 'trigger_auto_create_seller_balance',
    'on_auth_user_created'
)
ORDER BY c.relname, t.tgname;

-- 7. 初期データの確認
SELECT 'payment_providers' as table_name, COUNT(*) as record_count FROM public.payment_providers
UNION ALL
SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL
SELECT 'tags', COUNT(*) FROM public.tags
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM public.subscription_plans;

-- =============================================
-- 実行完了後の確認クエリ
-- =============================================

-- データベース全体の統計情報
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- テーブルサイズの確認
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 実行完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'データベースセットアップが完了しました！';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '以下の機能が利用可能です：';
    RAISE NOTICE '- ユーザー認証・プロフィール管理';
    RAISE NOTICE '- プロンプトの作成・管理・検索';
    RAISE NOTICE '- 注文・決済システム';
    RAISE NOTICE '- レビュー・評価システム';
    RAISE NOTICE '- 出品者売上管理';
    RAISE NOTICE '- 管理者機能';
    RAISE NOTICE '- AI SDK統合準備';
    RAISE NOTICE '=============================================';
END $$;
