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
      console.log('Current origin:', window.location.origin);
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);

      // 認証状態をクリアしてからMicrosoft認証
      await clearAuthState();

      // 現在のページ（登録/ログイン）を判定
      const isRegisterPage = window.location.pathname.includes('/register');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?source=${isRegisterPage ? 'register' : 'login'}`,
          scopes: 'openid profile email offline_access',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            response_type: 'code'
          }
        }
      });

      console.log('OAuth response:', { data, error });

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

