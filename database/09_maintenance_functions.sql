-- =============================================
-- メンテナンス・管理用関数（破壊的操作を含む）（修正版 - 既存の関数を安全に削除してから再作成）
-- =============================================
-- 
-- このファイルには破壊的な操作（DELETE、DROP等）を含む関数が定義されています。
-- 実行前にデータのバックアップを取ることを強く推奨します。
-- 
-- 注意: これらの関数は本番環境では慎重に実行してください。

-- 既存のメンテナンス関数を安全に削除
DROP FUNCTION IF EXISTS check_database_health();
DROP FUNCTION IF EXISTS rebuild_indexes();
DROP FUNCTION IF EXISTS update_database_statistics();
DROP FUNCTION IF EXISTS run_maintenance_cleanup();
DROP FUNCTION IF EXISTS cleanup_old_auto_tags();
DROP FUNCTION IF EXISTS cleanup_old_ranking_snapshots();
DROP FUNCTION IF EXISTS cleanup_old_recommendation_events();
DROP FUNCTION IF EXISTS cleanup_old_preview_cache();
DROP FUNCTION IF EXISTS cleanup_old_ai_jobs();
DROP FUNCTION IF EXISTS cleanup_expired_sessions();

-- 期限切れセッションクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- 30日以上古い一時カートを削除
    DELETE FROM public.carts 
    WHERE buyer_id IS NULL 
    AND temp_key IS NOT NULL 
    AND created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- 90日以上古い完了済み注文の詳細をアーカイブ（必要に応じて）
    -- ここでは削除せず、アーカイブテーブルへの移動を想定
    
    -- 古い監査ログのクリーンアップ（1年以上）
    DELETE FROM public.audit_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
    
    RAISE NOTICE '期限切れセッションのクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- 古いAIジョブのクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_ai_jobs()
RETURNS void AS $$
BEGIN
    -- 30日以上古い完了済みAIジョブを削除
    DELETE FROM public.ai_jobs 
    WHERE status IN ('succeeded', 'failed')
    AND created_at < CURRENT_DATE - INTERVAL '30 days';
    
    RAISE NOTICE '古いAIジョブのクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- 古いプレビューキャッシュのクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_preview_cache()
RETURNS void AS $$
BEGIN
    -- 7日以上古いプレビューキャッシュを削除
    DELETE FROM public.preview_cache 
    WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
    
    RAISE NOTICE '古いプレビューキャッシュのクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- 古い推薦イベントのクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_recommendation_events()
RETURNS void AS $$
BEGIN
    -- 90日以上古い推薦イベントを削除
    DELETE FROM public.recommendation_events 
    WHERE event_time < CURRENT_DATE - INTERVAL '90 days';
    
    RAISE NOTICE '古い推薦イベントのクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- 古いランキングスナップショットのクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_ranking_snapshots()
RETURNS void AS $$
BEGIN
    -- 1年以上古いランキングスナップショットを削除
    DELETE FROM public.ranking_snapshots 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
    
    RAISE NOTICE '古いランキングスナップショットのクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- 古い自動タグのクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_auto_tags()
RETURNS void AS $$
BEGIN
    -- 30日以上古い自動タグを削除
    DELETE FROM public.auto_tags 
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    RAISE NOTICE '古い自動タグのクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- 全体的なメンテナンス実行関数
CREATE OR REPLACE FUNCTION run_maintenance_cleanup()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'メンテナンスクリーンアップを開始します...';
    
    -- 各クリーンアップ関数を実行
    PERFORM cleanup_expired_sessions();
    PERFORM cleanup_old_ai_jobs();
    PERFORM cleanup_old_preview_cache();
    PERFORM cleanup_old_recommendation_events();
    PERFORM cleanup_old_ranking_snapshots();
    PERFORM cleanup_old_auto_tags();
    
    RAISE NOTICE 'メンテナンスクリーンアップが完了しました';
END;
$$ LANGUAGE plpgsql;

-- データベース統計情報の更新関数
CREATE OR REPLACE FUNCTION update_database_statistics()
RETURNS void AS $$
BEGIN
    -- 全テーブルの統計情報を更新
    ANALYZE public.user_profiles;
    ANALYZE public.prompts;
    ANALYZE public.prompt_versions;
    ANALYZE public.prompt_assets;
    ANALYZE public.orders;
    ANALYZE public.order_items;
    ANALYZE public.payments;
    ANALYZE public.reviews;
    ANALYZE public.seller_balances;
    ANALYZE public.ledger_entries;
    ANALYZE public.payouts;
    ANALYZE public.moderation_checks;
    ANALYZE public.admin_actions;
    ANALYZE public.ai_jobs;
    ANALYZE public.preview_cache;
    ANALYZE public.recommendation_events;
    ANALYZE public.auto_tags;
    ANALYZE public.ranking_snapshots;
    ANALYZE public.audit_logs;
    ANALYZE public.subscription_plans;
    ANALYZE public.subscriptions;
    ANALYZE public.carts;
    ANALYZE public.cart_items;
    ANALYZE public.seller_payout_accounts;
    ANALYZE public.payment_providers;
    ANALYZE public.prompt_localizations;
    ANALYZE public.categories;
    ANALYZE public.tags;
    ANALYZE public.prompt_tags;
    ANALYZE public.entitlements;
    
    RAISE NOTICE 'データベース統計情報の更新が完了しました';
END;
$$ LANGUAGE plpgsql;

-- インデックスの再構築関数（パフォーマンス改善用）
CREATE OR REPLACE FUNCTION rebuild_indexes()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'インデックスの再構築を開始します...';
    
    -- 主要なインデックスを再構築
    REINDEX INDEX CONCURRENTLY idx_prompts_search;
    REINDEX INDEX CONCURRENTLY idx_prompts_seller_id;
    REINDEX INDEX CONCURRENTLY idx_prompts_status_visibility;
    REINDEX INDEX CONCURRENTLY idx_orders_buyer_id;
    REINDEX INDEX CONCURRENTLY idx_orders_status;
    REINDEX INDEX CONCURRENTLY idx_reviews_prompt_id;
    REINDEX INDEX CONCURRENTLY idx_ledger_entries_seller_id;
    REINDEX INDEX CONCURRENTLY idx_entitlements_buyer_id;
    
    RAISE NOTICE 'インデックスの再構築が完了しました';
END;
$$ LANGUAGE plpgsql;

-- データベースの健全性チェック関数
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text,
    last_analyze timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        last_analyze
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;
