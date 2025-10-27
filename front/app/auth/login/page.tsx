'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    
    // URLパラメータからメッセージを取得
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const error = urlParams.get('error');
    
    if (message) {
      setInfoMessage(message);
    }
    if (error) {
      // エラーメッセージを日本語化
      const japaneseError = translateErrorMessage(error);
      setErrorMessage(japaneseError);
    }
  }, []);

  // エラーメッセージを日本語に変換する関数
  const translateErrorMessage = (error: string): string => {
    const decodedError = decodeURIComponent(error);
    
    if (decodedError.includes('Email link is invalid or has expired')) {
      return 'このリンクは1時間で無効になります。再度登録してください。';
    }
    if (decodedError.includes('Invalid login credentials')) {
      return 'メールアドレスまたはパスワードが正しくありません。';
    }
    if (decodedError.includes('Email not confirmed')) {
      return 'メールアドレスが確認されていません。確認メールをチェックしてください。';
    }
    if (decodedError.includes('Too many requests')) {
      return 'リクエストが多すぎます。しばらく待ってから再度お試しください。';
    }
    
    // その他のエラーは元のメッセージを返す
    return decodedError;
  };

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    
    // 成功メッセージ表示後、トップページにリダイレクト
    setTimeout(() => {
      router.push('/');
    }, 2000); // 2秒後にリダイレクト
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-200 py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded mb-3 sm:mb-4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mb-6 sm:mb-8"></div>
            <div className="bg-white/80 backdrop-blur-lg py-6 px-4 sm:py-8 sm:px-6 lg:px-10 shadow-2xl border border-gray-200 rounded-2xl" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
              <div className="space-y-3 sm:space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-200 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* 外部連携ボタンとフォーム */}
        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
          {/* ヘッダー */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              ログイン
            </h2>
            <p className="text-gray-600 font-medium">
              PromptECアカウントにログイン
            </p>
          </div>

          {/* 成功メッセージ */}
          {successMessage && mounted && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {errorMessage && mounted && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* 情報メッセージ */}
          {infoMessage && mounted && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg shadow-sm mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{infoMessage}</p>
                </div>
              </div>
            </div>
          )}
          <SocialLoginButtons onSuccess={handleSuccess} onError={handleError} />
          
          {/* 区切り線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          <LoginForm onSuccess={handleSuccess} onError={handleError} />
        </div>

        {/* 新規登録リンク */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              新規登録
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
