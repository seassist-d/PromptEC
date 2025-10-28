'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import SuccessMessage from '@/components/auth/messages/SuccessMessage';
import ErrorMessage from '@/components/auth/messages/ErrorMessage';

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(email)) {
      setError('正しいメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // エラーメッセージの日本語化
        let errorMessage = 'パスワードリセットメールの送信に失敗しました';
        if (error.message.includes('rate limit')) {
          errorMessage = 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。';
        }
        
        setError(errorMessage);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('パスワードリセットメールの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <AuthPageLayout title="パスワードリセット" subtitle="パスワードリセット用のメールを送信します">
        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10 animate-pulse" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="パスワードリセット" subtitle="パスワードリセット用のメールを送信します">
      {/* 成功メッセージ */}
      {success && mounted && (
        <SuccessMessage 
          message="パスワードリセット用のメールを送信しました。メール内のリンクをクリックしてパスワードをリセットしてください。" 
          className="mb-6" 
        />
      )}

      {/* エラーメッセージ */}
      {error && !success && mounted && (
        <ErrorMessage message={error} className="mb-6" />
      )}

      {/* フォーム */}
      <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl border border-gray-200 sm:rounded-2xl sm:px-10" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'}}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors"
              placeholder="メールアドレスを入力"
              disabled={isLoading || success}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? '送信中...' : success ? '送信完了' : 'リセットメールを送信'}
          </button>

          <div className="text-center">
            <a href="/auth/login" className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
              ログインに戻る
            </a>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
}
