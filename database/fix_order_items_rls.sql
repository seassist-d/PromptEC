-- =============================================
-- order_itemsテーブルのRLSポリシー修正
-- =============================================

-- order_itemsテーブルに対する挿入ポリシーを追加
CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND buyer_id = auth.uid()
    )
  );

-- 管理者は注文アイテムを作成・更新可能
CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

