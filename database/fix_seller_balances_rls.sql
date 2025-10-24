-- =============================================
-- seller_balancesテーブルのRLSポリシー修正
-- =============================================
-- 
-- 問題: user_profilesテーブルにレコードが挿入されると、
-- auto_create_seller_balance()トリガーが実行されて
-- seller_balancesテーブルにレコードを挿入しようとするが、
-- INSERT用のRLSポリシーが設定されていないためエラーが発生する
--
-- 解決策: seller_balancesテーブルにINSERT用のRLSポリシーを追加

-- 既存のINSERT用ポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can insert their own balance" ON public.seller_balances;
DROP POLICY IF EXISTS "Admins can insert all balances" ON public.seller_balances;
DROP POLICY IF EXISTS "System can create balance records" ON public.seller_balances;

-- ユーザーは自分の残高レコードを挿入可能
CREATE POLICY "Users can insert their own balance" ON public.seller_balances
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- 管理者は全残高レコードを挿入可能
CREATE POLICY "Admins can insert all balances" ON public.seller_balances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- システム関数（トリガー）による残高レコード作成を許可
-- このポリシーにより、auto_create_seller_balance()トリガーからのINSERTが許可される
CREATE POLICY "System can create balance records" ON public.seller_balances
  FOR INSERT WITH CHECK (true);

-- 確認用クエリ
-- 現在のseller_balancesテーブルのポリシーを確認
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
WHERE tablename = 'seller_balances'
ORDER BY policyname;
