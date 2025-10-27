-- =============================================
-- seller_payout_accountsテーブルのRLSポリシー
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

