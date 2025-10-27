'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { clearAuthStorage, validateToken, handleAuthError } from '@/lib/auth-utils';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 遷移先決定の共通関数
    const routeAfterAuth = async (userId: string) => {
      // user_profiles から onboarding_completed を見る
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single();

      console.log('[routeAfterAuth] profileData:', profileData, 'profileError:', profileError);

      const isNewUser = !profileData || profileData.onboarding_completed === false;

      if (isNewUser) {
        console.log('[routeAfterAuth] New user -> /profile/setup');
        router.push('/profile/setup');
      } else {
        console.log('[routeAfterAuth] Existing user -> /');
        router.push('/');
      }
    };

    const handleAuthCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);
        
        // URLパラメータから認証情報を取得
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const source = urlParams.get('source'); // 認証の出発点（register/login）
        const code = urlParams.get('code'); // メール認証用のcode
        
        console.log('Auth source:', source);
        console.log('Code:', code);
        console.log('Source type check:', typeof source);
        console.log('Source === "register":', source === 'register');
        console.log('Source !== "register":', source !== 'register');
        
        // 既存のSupabase OAuth処理（Google、Microsoft用）
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        // ハッシュフラグメントからも認証情報を取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');
        
        console.log('Search params:', { accessToken, refreshToken, error, errorDescription });
        console.log('Hash params:', { hashAccessToken, hashRefreshToken, hashError, hashErrorDescription });
        
        // ハッシュフラグメントの値を優先
        const finalAccessToken = hashAccessToken || accessToken;
        const finalRefreshToken = hashRefreshToken || refreshToken;
        const finalError = hashError || error;
        const finalErrorDescription = hashErrorDescription || errorDescription;
        
        console.log('Final params:', { finalAccessToken, finalRefreshToken, finalError, finalErrorDescription });
        
        if (finalError) {
          console.error('Auth callback error:', finalError, finalErrorDescription);
          router.push(`/auth/login?error=${encodeURIComponent(finalErrorDescription || '認証に失敗しました')}`);
          return;
        }
        
        // 1) codeだけで戻ってきたとき（メール認証）
        if (code) {
          console.log('Auth callback with code. Checking session...');
          const { data: { session } } = await supabase.auth.getSession();

          if (!session || !session.user) {
            console.log('No session yet, treat as new user');
            router.push('/profile/setup');
            return;
          }

          await routeAfterAuth(session.user.id);
          return;
        }
        
        // 2) access_token / refresh_token が付いてくるケース (OAuthでtokens返ってきた場合)
        if (finalAccessToken && finalRefreshToken) {
          // トークンの有効性を確認
          console.log('Validating token before setting session...');
          const tokenValidation = await validateToken(supabase, finalAccessToken);
          
          if (!tokenValidation.valid) {
            console.error('Token validation failed:', tokenValidation.error);
            handleAuthError(tokenValidation.error, router, '認証情報が無効です');
            return;
          }
          
          console.log('Token validation successful, setting session...');
          
          // トークンからセッションを設定
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken,
          });
          
          if (sessionError) {
            console.error('Session setting error:', sessionError);
            handleAuthError(sessionError, router, 'セッションの設定に失敗しました');
            return;
          }
          
          console.log('Session setting result:', data);
          
          if (data.session) {
            console.log('Session set successfully:', data.session.user.email);
            console.log('User email confirmed:', data.session.user.email_confirmed_at);
            
            // セットした session からユーザーIDを取り出して判定
            await routeAfterAuth(data.session.user.id);
            return;
          } else {
            console.log('No session found after setting tokens');
          }
        } else {
          console.log('No tokens found in URL parameters or hash');
        }
        
        // 3) 既にサインイン済みの状態で callback に来た場合（リロードなど）
        console.log('Checking existing session...');
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
          return;
        } else {
          console.log('No session found, clearing storage and redirecting to login...');
          // セッションが見つからない場合、ストレージをクリアしてログインページへ
          clearAuthStorage();
          router.push('/auth/login?error=認証情報が見つかりません');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
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

