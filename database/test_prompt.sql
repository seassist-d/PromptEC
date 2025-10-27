-- テストプロンプトデータ作成用
-- Supabase SQL Editorで実行してください

-- 1. ユーザープロフィールを確認
SELECT id, email FROM auth.users LIMIT 5;

-- 2. プロンプトが存在するか確認
SELECT COUNT(*) as total_prompts FROM public.prompts;
SELECT id, title, status, created_at FROM public.prompts LIMIT 10;

-- 3. テストプロンプトを作成（既存のユーザーIDを使用）
-- 以下の[USER_ID]を実際のユーザーIDに置き換えてください
/*
INSERT INTO public.prompts (
  seller_id,
  title,
  slug,
  short_description,
  long_description,
  price_jpy,
  status,
  visibility
) VALUES (
  '[USER_ID]',  -- 実際のユーザーIDに置き換え
  'テストプロンプト',
  'test-prompt-' || gen_random_uuid()::text,
  'これはテストプロンプトです',
  'このプロンプトは管理者ダッシュボードのテスト用です。',
  1000,
  'published',
  'public'
);
*/

