'use client';

import { clearAuthState } from '@/lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';

interface UseMicrosoftAuthReturn {
  signIn: () => Promise<{ success: boolean; error?: string }>;
}

export function useMicrosoftAuth(): UseMicrosoftAuthReturn {
  const signIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Microsoft認証を開始します...');

      // 認証状態をクリアしてからMicrosoft認証
      await clearAuthState();

      // 既存セッションがないことを確認
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('既存セッションをクリアします');
        await supabase.auth.signOut();
        await clearAuthState();
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback/social`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error('Microsoft認証エラー:', error);
        return {
          success: false,
          error: `Microsoft認証に失敗しました: ${error.message}`
        };
      }

      console.log('Microsoft認証リダイレクト開始:', data);
      return { success: true };
    } catch (error) {
      console.error('Microsoft認証で予期しないエラー:', error);
      return {
        success: false,
        error: 'Microsoft認証でエラーが発生しました'
      };
    }
  };

  return { signIn };
}

