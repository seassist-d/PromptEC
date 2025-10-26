-- =============================================
-- payment_providersテーブルのRLSポリシー設定
-- =============================================

-- payment_providersテーブルは参照用なので、全員が閲覧可能にする
CREATE POLICY "Payment providers are viewable by everyone" ON public.payment_providers
  FOR SELECT USING (true);

