import { createClient } from './supabase-browser';

// 開発時に設定漏れを早期検知
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] 環境変数が未設定です。front/.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
  );
}

const supabase = createClient();

// 認証状態をクリアするヘルパー関数
export const clearAuthState = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    console.log('✅ 認証状態をクリアしました');
  } catch (error) {
    console.error('認証状態のクリアエラー:', error);
    // エラーが発生しても処理を続行する（既に未ログイン状態の場合など）
  }
};

export { supabase };

