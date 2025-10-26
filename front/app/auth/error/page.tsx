'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const getErrorMessage = () => {
    if (error === 'access_denied' || 
        errorDescription?.includes('expired') || 
        errorDescription?.includes('invalid') ||
        errorDescription?.includes('Email link is invalid or has expired')) {
      return {
        title: 'リンクの有効期限が切れました',
        message: 'このリンクは1時間で無効になります。',
        action: '再度登録してください。'
      };
    }
    
    return {
      title: '認証エラーが発生しました',
      message: '認証処理中にエラーが発生しました。',
      action: '再度お試しください。'
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorInfo.message}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {errorInfo.action}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/auth/register"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            新規登録に戻る
          </Link>
          
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ログイン画面へ
          </Link>
        </div>
      </div>
    </div>
  );
}
