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
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const source = urlParams.get('source'); // 認証の出発点（register/login）
        
        console.log('Auth source:', source);
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
            
            // 既存ユーザーかどうかを判定
            try {
              console.log('=== USER CHECK START ===');
              console.log('Source:', source);
              console.log('User ID:', data.session.user.id);
              console.log('User email:', data.session.user.email);
              console.log('User created_at:', data.session.user.created_at);
              
              // プロファイルの存在を確認
              const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('created_at, user_id')
                .eq('user_id', data.session.user.id)
                .single();

              console.log('Profile check result:', { 
                profileData, 
                profileError,
                profileErrorCode: profileError?.code,
                profileErrorMessage: profileError?.message 
              });

              if (source === 'register') {
                console.log('=== REGISTER PAGE CHECK ===');
                console.log('Entering register branch');
                // 新規登録ページから来た場合
                if (profileData) {
                  // プロファイルが存在する = 既存ユーザーが新規登録を試みた
                  console.log('=== EXISTING USER TRIED TO REGISTER (profile exists) ===');
                  console.log('Redirecting to top page...');
                  router.push('/');
                  return;
                } else {
                  // プロファイルが存在しない = 新規ユーザー
                  console.log('=== NEW USER DETECTED (no profile found) ===');
                  console.log('Redirecting to profile setup...');
                  router.push('/profile/setup');
                  return;
                }
              } else {
                // ログインページから来た場合 = 既存ユーザー
                console.log('=== LOGIN PAGE CHECK ===');
                console.log('Entering login branch, source:', source);
                console.log('Redirecting to top page...');
                router.push('/');
                return;
              }
              
            } catch (profileCheckError) {
              console.error('Profile check failed:', profileCheckError);
              // エラーの場合もトップページへ（認証は成功しているため）
              router.push('/');
              return;
            }
          } else {
            console.log('No session found after setting tokens');
          }
        } else {
          console.log('No tokens found in URL parameters or hash');
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
          
          // 既存セッションでも、source=registerの場合は既存ユーザーチェックを実行
          if (source === 'register') {
            console.log('=== EXISTING SESSION WITH REGISTER SOURCE ===');
            console.log('Entering existing session register branch');
            try {
              // プロファイルの存在を確認
              const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('created_at, user_id')
                .eq('user_id', session.user.id)
                .single();

              console.log('Profile check result:', { 
                profileData, 
                profileError,
                profileErrorCode: profileError?.code,
                profileErrorMessage: profileError?.message 
              });

              if (profileData) {
                // プロファイルが存在する = 既存ユーザーが新規登録を試みた
                console.log('=== EXISTING USER TRIED TO REGISTER (from existing session, profile exists) ===');
                console.log('Redirecting to top page...');
                router.push('/');
                return;
              } else {
                // プロファイルが存在しない = 新規ユーザー
                console.log('=== NEW USER DETECTED (from existing session, no profile found) ===');
                console.log('Redirecting to profile setup...');
                router.push('/profile/setup');
                return;
              }
            } catch (profileCheckError) {
              console.error('Profile check failed:', profileCheckError);
              // エラーの場合もトップページへ
              router.push('/');
              return;
            }
          } else {
            // ログインページから来た場合 = 既存ユーザー
            console.log('=== LOGIN PAGE CHECK (from existing session) ===');
            console.log('Entering existing session login branch, source:', source);
            console.log('Redirecting to top page...');
            router.push('/');
            return;
          }
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
