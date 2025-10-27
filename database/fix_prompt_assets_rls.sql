-- =============================================
-- prompt_assetsテーブルのRLSポリシー修正
-- =============================================

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

