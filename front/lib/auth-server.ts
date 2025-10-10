import { createClient } from '@supabase/supabase-js';

// Server Action用のSupabaseクライアント
// サーバーサイドで使用するため、環境変数から直接取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[auth-server] Supabase環境変数が未設定です。開発用のデフォルト値を使用します。'
  );
}

// Server Action用のSupabaseクライアント（Service Role Key使用）
export const supabaseServer = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseServiceKey ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// 新規登録用の型定義（メールアドレスのみ）
export interface RegisterData {
  email: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}
