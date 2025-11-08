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

    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const error = urlParams.get('error');

    if (message) setInfoMessage(message);
    if (error) {
      const japaneseError = translateErrorMessage(error);
      setErrorMessage(japaneseError);
    }
  }, []);

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
    return decodedError;
  };

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  if (!mounted) {
    return (
      <AuthPageLayout title="ログイン" subtitle="PromptAssistアカウントにログイン">
        {/* Skeleton: シックなトーン＆角丸強め */}
        <div className="bg-white/70 backdrop-blur-sm py-8 px-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)] border border-zinc-200/70 sm:rounded-2xl sm:px-10 animate-pulse">
          <div className="space-y-3 sm:space-y-4">
            <div className="h-10 bg-zinc-200 rounded-xl"></div>
            <div className="h-10 bg-zinc-200 rounded-xl"></div>
            <div className="h-10 bg-zinc-200 rounded-xl"></div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="ログイン" subtitle="PromptAssistアカウントにログイン">
      {/* カード: 余白を広めに・陰影控えめ・ボーダー淡く */}
      <div className="bg-white/80 backdrop-blur-sm py-8 px-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)] border border-zinc-200/70 sm:rounded-2xl sm:px-10">
        {successMessage && mounted && <SuccessMessage message={successMessage} className="mb-6" />}
        {errorMessage && mounted && <ErrorMessage message={errorMessage} className="mb-6" />}
        {infoMessage && mounted && <InfoMessage message={infoMessage} className="mb-6" />}

        <SocialLoginButtons onSuccess={handleSuccess} onError={handleError} />

        {/* 区切り線：文字は小さめ・彩度抑えめ */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-2 bg-white/80 text-zinc-500">または</span>
          </div>
        </div>

        <LoginForm onSuccess={handleSuccess} onError={handleError} />
      </div>

      {/* 新規登録リンク：下線＋彩度低いアクセント */}
      <div className="text-center">
        <p className="text-sm text-zinc-600">
          アカウントをお持ちでない方は{' '}
          <a
            href="/auth/register"
            className="font-medium underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-700 text-zinc-800 transition-colors"
          >
            新規登録
          </a>
        </p>
      </div>
    </AuthPageLayout>
  );
}
