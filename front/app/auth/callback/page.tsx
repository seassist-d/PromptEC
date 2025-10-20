'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);
        
        // URLパラメータから認証情報を取得
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
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
        
        if (finalAccessToken && finalRefreshToken) {
          // トークンからセッションを設定
          console.log('Setting session with tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken,
          });
          
          if (sessionError) {
            console.error('Session setting error:', sessionError);
            router.push('/auth/login?error=セッションの設定に失敗しました');
            return;
          }
          
          console.log('Session setting result:', data);
          
          if (data.session) {
            console.log('Session set successfully:', data.session.user.email);
            console.log('User email confirmed:', data.session.user.email_confirmed_at);
            console.log('Redirecting to profile...');
            
            // ソーシャルログイン成功 - プロフィールページにリダイレクト
            router.push('/profile');
            return;
          } else {
            console.log('No session found after setting tokens');
          }
        }
        
        // 既存のセッションを確認
        console.log('Checking existing session...');
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession();
        
        if (sessionCheckError) {
          console.error('Session check error:', sessionCheckError);
          router.push('/auth/login?error=認証に失敗しました');
          return;
        }
        
        console.log('Existing session check result:', session);
        
        if (session) {
          console.log('Existing session found:', session.user.email);
          console.log('Redirecting to profile from existing session...');
          // 既存セッション - プロフィールページにリダイレクト
          router.push('/profile');
        } else {
          console.log('No session found, redirecting to login...');
          // セッションが見つからない場合
          router.push('/auth/login?error=認証情報が見つかりません');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/login?error=予期しないエラーが発生しました');
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
