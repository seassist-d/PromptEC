'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    // 3秒後にログインページにリダイレクト
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントを作成してPromptECを始めましょう
          </p>
        </div>

        {successMessage && (
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

        {errorMessage && (
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

        <RegisterForm onSuccess={handleSuccess} onError={handleError} />

        <div className="text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちですか？{' '}
            <a
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              ログイン
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
