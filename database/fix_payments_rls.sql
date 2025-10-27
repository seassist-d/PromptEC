-- =============================================
-- paymentsテーブルのRLSポリシー修正
-- =============================================

-- paymentsテーブルに対する挿入ポリシーを追加
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

