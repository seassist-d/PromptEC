import { createClient } from '@supabase/supabase-js';

// Server Action用のSupabaseクライアント
// サーバーサイドで使用するため、環境変数から直接取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Server Action用のSupabaseクライアント（Service Role Key使用）
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 新規登録用の型定義
export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}
