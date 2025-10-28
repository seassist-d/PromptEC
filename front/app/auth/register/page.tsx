'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import EmailAuthForm from '@/components/auth/EmailAuthForm';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import SuccessMessage from '@/components/auth/messages/SuccessMessage';
import ErrorMessage from '@/components/auth/messages/ErrorMessage';

export default function RegisterPage() {
  const router = useRouter();
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

  const handleNavigateToLogin = () => {
    router.push('/auth/login');
  };

  if (!mounted) {
    return (
      <AuthPageLayout title="新規登録" subtitle="PromptECアカウントを作成">
        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10 animate-pulse" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
          <div className="space-y-4 mb-8">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="新規登録" subtitle="PromptECアカウントを作成">
      {/* 認証フォーム */}
      <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
        {/* 成功メッセージ */}
        {successMessage && mounted && (
          <SuccessMessage message={successMessage} className="mb-6" />
        )}

        {/* エラーメッセージ */}
        {errorMessage && mounted && (
          <ErrorMessage message={errorMessage} className="mb-6" />
        )}

        {/* ソーシャルログイン */}
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

        {/* メール認証フォーム */}
        <EmailAuthForm 
          onSuccess={handleSuccess} 
          onError={handleError}
          onNavigateToLogin={handleNavigateToLogin}
        />
      </div>

      {/* ログインリンク */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            ログイン
          </a>
        </p>
      </div>
    </AuthPageLayout>
  );
}
