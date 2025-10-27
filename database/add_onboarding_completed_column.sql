-- user_profilesテーブルにonboarding_completedカラムを追加
-- オンボーディング完了フラグ（false=未完了、true=完了）

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 既存データの場合は全てfalseのまま（既存ユーザーも再オンボーディングさせる）
-- 必要に応じて以下をコメントアウトして既存ユーザーをtrueに設定：
-- UPDATE public.user_profiles SET onboarding_completed = true;

-- RLSポリシーは既存の"Users can update their own profile"で
-- onboarding_completedカラムの更新も許可されるため追加不要

