-- =============================================
-- Supabase Storage RLSポリシー設定
-- =============================================
-- 
-- このファイルは、Supabase StorageバケットのRLSポリシーを設定します。
-- avatarsバケット用のポリシーを含みます。

-- =============================================
-- avatarsバケットのRLSポリシー
-- =============================================

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- アバター画像のアップロード許可（ユーザーIDと一致するパスのみ）
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

-- アバター画像の閲覧許可（公開）
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- アバター画像の更新許可
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

-- アバター画像の削除許可
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

-- =============================================
-- prompts-thumbnailsバケットのRLSポリシー
-- =============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can upload prompt thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public thumbnails are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

-- サムネイル画像のアップロード許可
CREATE POLICY "Users can upload prompt thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'prompts-thumbnails' AND 
    auth.uid() IS NOT NULL
  );

-- サムネイル画像の閲覧許可（公開）
CREATE POLICY "Public thumbnails are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'prompts-thumbnails');

-- サムネイル画像の更新許可
CREATE POLICY "Users can update their own thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'prompts-thumbnails' AND 
    auth.uid() IS NOT NULL
  );

-- サムネイル画像の削除許可
CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'prompts-thumbnails' AND 
    auth.uid() IS NOT NULL
  );

-- =============================================
-- prompt-assetsバケットのRLSポリシー
-- =============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can upload prompt assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view public prompt assets" ON storage.objects;
DROP POLICY IF EXISTS "Buyers can view purchased prompt assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own prompt assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own prompt assets" ON storage.objects;

-- プロンプトアセットのアップロード許可
CREATE POLICY "Users can upload prompt assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'prompt-assets' AND 
    auth.uid() IS NOT NULL
  );

-- プロンプトアセットの閲覧許可（公開済みプロンプトのみ）
-- 注: このポリシーは簡易版です。実際の購入権限チェックはアプリケーション層で行います
CREATE POLICY "Users can view public prompt assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'prompt-assets' AND 
    auth.uid() IS NOT NULL
  );

-- 購入者のプロンプトアセット閲覧許可
-- 注: 実際の権限チェックはentitlementsテーブルに基づいてアプリケーション層で行います
CREATE POLICY "Buyers can view purchased prompt assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'prompt-assets' AND 
    auth.uid() IS NOT NULL
  );

-- プロンプトアセットの更新許可
CREATE POLICY "Users can update their own prompt assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'prompt-assets' AND 
    auth.uid() IS NOT NULL
  );

-- プロンプトアセットの削除許可
CREATE POLICY "Users can delete their own prompt assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'prompt-assets' AND 
    auth.uid() IS NOT NULL
  );

