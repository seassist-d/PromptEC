'use client';

import { clearAuthState } from '@/lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';

interface UseGoogleAuthReturn {
  signIn: () => Promise<{ success: boolean; error?: string }>;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const signIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Google認証を開始します...');

      // 認証状態をクリアしてからGoogle認証
      await clearAuthState();

      // 現在のページ（登録/ログイン）を判定
      const isRegisterPage = window.location.pathname.includes('/register');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?source=${isRegisterPage ? 'register' : 'login'}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Google認証エラー:', error);
        return {
          success: false,
          error: `Google認証に失敗しました: ${error.message}`
        };
      }

      console.log('Google認証リダイレクト開始:', data);
      return { success: true };
    } catch (error) {
      console.error('Google認証で予期しないエラー:', error);
      return {
        success: false,
        error: 'Google認証でエラーが発生しました'
      };
    }
  };

  return { signIn };
}

