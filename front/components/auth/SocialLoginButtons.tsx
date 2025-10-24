'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SocialLoginButtonsProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function SocialLoginButtons({ onError }: SocialLoginButtonsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      console.log('Google認証を開始します...');
      
      // 現在のページ（登録/ログイン）を判定
      const isRegisterPage = window.location.pathname.includes('/register');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?source=${isRegisterPage ? 'register' : 'login'}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Google認証エラー:', error);
        onError?.(`Google認証に失敗しました: ${error.message}`);
      } else {
        console.log('Google認証リダイレクト開始:', data);
        // リダイレクトが開始されるので、ここでは成功メッセージは表示しない
      }
    } catch (error) {
      console.error('Google認証で予期しないエラー:', error);
      onError?.(`Google認証でエラーが発生しました`);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      console.log('Microsoft認証を開始します...');
      console.log('Current origin:', window.location.origin);
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
      
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
        onError?.(`Microsoft認証に失敗しました: ${error.message}`);
      } else {
        console.log('Microsoft認証リダイレクト開始:', data);
      }
    } catch (error) {
      console.error('Microsoft認証で予期しないエラー:', error);
      onError?.(`Microsoft認証でエラーが発生しました`);
    }
  };


  if (!mounted) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="ml-2">Google で続行</span>
        </button>

        {/* Microsoft */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#00A4EF" d="M13 1h10v10H13z" />
            <path fill="#7FBA00" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
          </svg>
          <span className="ml-2">Microsoft で続行</span>
        </button>
      </div>
    </div>
  );
}
