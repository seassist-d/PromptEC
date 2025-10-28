'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { clearAuthStorage, handleAuthError } from '@/lib/auth-utils';

export default function EmailAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const routeAfterAuth = async (userId: string) => {
      console.log('[Email Auth Callback] Checking user profile for userId:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single();

      console.log('[Email Auth Callback] profileData:', profileData);
      console.log('[Email Auth Callback] profileError:', profileError);

      // profileDataがnullの場合やエラーが発生した場合、新規ユーザーとして扱う
      let isNewUser = false;
      
      if (profileError) {
        // レコードが見つからない場合は新規ユーザー
        if (profileError.code === 'PGRST116') {
          console.log('[Email Auth Callback] Profile not found - new user');
          isNewUser = true;
        } else {
          console.error('[Email Auth Callback] Profile error:', profileError);
          // エラーが発生した場合も、一旦新規ユーザーとして扱う
          isNewUser = true;
        }
      } else if (!profileData) {
        console.log('[Email Auth Callback] No profile data - new user');
        isNewUser = true;
      } else if (profileData.onboarding_completed === false || !profileData.onboarding_completed) {
        console.log('[Email Auth Callback] Onboarding not completed - new user');
        isNewUser = true;
      } else {
        console.log('[Email Auth Callback] Onboarding completed - existing user');
        isNewUser = false;
      }

      if (isNewUser) {
        console.log('[Email Auth Callback] New user -> /profile/setup');
        router.push('/profile/setup');
      } else {
        console.log('[Email Auth Callback] Existing user -> /');
        router.push('/');
      }
    };

    const handleAuthCallback = async () => {
      try {
        console.log('=== EMAIL AUTH CALLBACK ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        
        // メール認証のコードパラメータをチェック
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log('Email auth params:', { code, error, errorDescription });
        
        // エラーチェック
        if (error) {
          console.error('Email auth callback error:', error);
          router.push(`/auth/login?error=${encodeURIComponent(errorDescription || '認証に失敗しました')}`);
          return;
        }
        
        // セッションを取得
        console.log('Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Email auth session error:', sessionError);
          clearAuthStorage();
          router.push('/auth/login?error=認証に失敗しました');
          return;
        }
        
        if (!session || !session.user) {
          console.log('No session found for email auth, but code exists - auth likely successful');
          clearAuthStorage();
          // codeパラメータがある場合はメール認証は成功しているとみなす
          if (code) {
            router.push('/auth/login?message=認証成功です。ログイン画面からログインしてください。');
          } else {
            router.push('/auth/login?error=認証情報が見つかりません');
          }
          return;
        }
        
        console.log('Email auth successful:', session.user.email);
        await routeAfterAuth(session.user.id);
      } catch (error) {
        console.error('Unexpected error in email auth callback:', error);
        handleAuthError(error, router, '予期しないエラーが発生しました');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">メール認証を処理中...</p>
      </div>
    </div>
  );
}

