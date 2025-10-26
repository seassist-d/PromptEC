-- =============================================
-- categories テーブルのRLS設定
-- =============================================
-- 
-- 注意: カート機能実装後、categoriesテーブルが空の配列を返す
-- 問題が発生した場合の修正スクリプトです。
-- 
-- Supabaseのダッシュボード > SQL Editor で実行してください。
-- =============================================

-- まず、categoriesテーブルの現在のRLS状態を確認
SELECT tablename, 
       rowsecurity as rls_enabled,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories') as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'categories';

-- RLSが無効の場合は有効化
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（ある場合）
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

-- 誰でもカテゴリを閲覧可能なポリシーを作成
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

-- タグテーブルも同様に設定
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（ある場合）
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;

-- 誰でもタグを閲覧可能なポリシーを作成
CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

-- 設定完了を確認
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories') as categories_policy_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tags') as tags_policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('categories', 'tags');

