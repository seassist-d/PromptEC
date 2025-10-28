'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { clearAuthStorage, validateToken, handleAuthError } from '@/lib/auth-utils';

export default function SocialAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const routeAfterAuth = async (userId: string) => {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single();

      console.log('[Social Auth Callback] profileData:', profileData, 'profileError:', profileError);

      const isNewUser = !profileData || profileData.onboarding_completed === false;

      if (isNewUser) {
        console.log('[Social Auth Callback] New user -> /profile/setup');
        router.push('/profile/setup');
      } else {
        console.log('[Social Auth Callback] Existing user -> /');
        router.push('/');
      }
    };

    const handleAuthCallback = async () => {
      try {
        console.log('=== SOCIAL AUTH CALLBACK ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);
        
        // URLパラメータからOAuth認証情報を取得
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        const error = hashParams.get('error') || urlParams.get('error');
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');
        
        console.log('Social auth params:', { accessToken, refreshToken, error, errorDescription });
        
        // エラーチェック
        if (error) {
          console.error('Social auth callback error:', error);
          
          // server_error の場合、セッションをクリアしてリトライを促す
          if (error === 'server_error') {
            clearAuthStorage();
            router.push('/auth/login?error=認証サーバーでエラーが発生しました。再度お試しください。');
            return;
          }
          
          router.push(`/auth/login?error=${encodeURIComponent(errorDescription || '認証に失敗しました')}`);
          return;
        }
        
        // トークンがある場合
        if (accessToken && refreshToken) {
          console.log('Validating token before setting session...');
          const tokenValidation = await validateToken(supabase, accessToken);
          
          if (!tokenValidation.valid) {
            console.error('Token validation failed:', tokenValidation.error);
            handleAuthError(tokenValidation.error, router, '認証情報が無効です');
            return;
          }
          
          console.log('Token validation successful, setting session...');
          
          // トークンからセッションを設定
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('Session setting error:', sessionError);
            handleAuthError(sessionError, router, 'セッションの設定に失敗しました');
            return;
          }
          
          console.log('Session setting result:', data);
          
          if (data.session) {
            console.log('Social auth successful:', data.session.user.email);
            await routeAfterAuth(data.session.user.id);
            return;
          } else {
            console.log('No session found after setting tokens');
          }
        }
        
        // トークンがない場合、既存のセッションをチェック
        console.log('No tokens found, checking existing session...');
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession();
        
        if (sessionCheckError) {
          console.error('Session check error:', sessionCheckError);
          handleAuthError(sessionCheckError, router, '認証に失敗しました');
          return;
        }
        
        console.log('Existing session check result:', session);
        
        if (session && session.user) {
          console.log('Existing session found:', session.user.email);
          await routeAfterAuth(session.user.id);
        } else {
          console.log('No session found, clearing storage and redirecting to login...');
          clearAuthStorage();
          router.push('/auth/login?error=認証情報が見つかりません');
        }
      } catch (error) {
        console.error('Unexpected error in social auth callback:', error);
        handleAuthError(error, router, '予期しないエラーが発生しました');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">認証を処理中...</p>
      </div>
    </div>
  );
}

