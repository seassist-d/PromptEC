'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import SuccessMessage from '@/components/auth/messages/SuccessMessage';
import ErrorMessage from '@/components/auth/messages/ErrorMessage';
import InfoMessage from '@/components/auth/messages/InfoMessage';

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
      <AuthPageLayout title="ログイン" subtitle="PromptECアカウントにログイン">
        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10 animate-pulse" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
          <div className="space-y-3 sm:space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="ログイン" subtitle="PromptECアカウントにログイン">
      {/* 外部連携ボタンとフォーム */}
      <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
        {/* 成功メッセージ */}
        {successMessage && mounted && (
          <SuccessMessage message={successMessage} className="mb-6" />
        )}

        {/* エラーメッセージ */}
        {errorMessage && mounted && (
          <ErrorMessage message={errorMessage} className="mb-6" />
        )}

        {/* 情報メッセージ */}
        {infoMessage && mounted && (
          <InfoMessage message={infoMessage} className="mb-6" />
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
    </AuthPageLayout>
  );
}
