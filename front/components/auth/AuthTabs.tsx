'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SocialLoginButtons from './SocialLoginButtons';

export default function AuthTabs() {
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8" style={{background: 'linear-gradient(to bottom right, #f3f4f6, #f9fafb, #e5e7eb)'}}>
        <div className="max-w-md w-full space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="bg-white py-8 px-4 shadow-2xl border-2 border-gray-300 sm:rounded-xl sm:px-10" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
              <div className="space-y-4">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            PromptECへようこそ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            PromptECアカウントにログイン
          </p>
        </div>


        {/* 成功メッセージ */}
        {successMessage && mounted && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{successMessage}</p>
                <p className="text-sm mt-1">3秒後にログインページに移動します...</p>
              </div>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {errorMessage && mounted && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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

        {/* 外部連携ボタンとフォーム */}
        <div className="bg-white py-8 px-4 shadow-2xl border-2 border-gray-300 sm:rounded-xl sm:px-10" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
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

        {/* ログインリンク */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              新規登録
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
