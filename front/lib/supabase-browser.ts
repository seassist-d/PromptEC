import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,  // セッションを永続化
        autoRefreshToken: true,  // トークンの自動更新
        detectSessionInUrl: true,  // URLからセッションを検出
        flowType: 'pkce',  // PKCEフローを使用（より安全）
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              const value = localStorage.getItem(key);
              console.log(`[Supabase Storage] Getting key: ${key}`, value ? 'Found' : 'Not found');
              return value;
            }
            return null;
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, value);
              console.log(`[Supabase Storage] Setting key: ${key}`, 'Success');
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(key);
              console.log(`[Supabase Storage] Removing key: ${key}`, 'Success');
            }
          },
        },
      },
    }
  );
}
