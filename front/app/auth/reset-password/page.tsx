'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import SuccessMessage from '@/components/auth/messages/SuccessMessage';
import ErrorMessage from '@/components/auth/messages/ErrorMessage';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) {
      return 'パスワードを入力してください';
    }
    if (pwd.length < 6) {
      return 'パスワードは6文字以上で入力してください';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        let errorMessage = 'パスワードの更新に失敗しました';
        if (error.message.includes('New password should be different')) {
          errorMessage = '新しいパスワードは古いパスワードと異なる必要があります';
        }
        setError(errorMessage);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login?message=パスワードを更新しました。ログインしてください。');
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('パスワードの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <AuthPageLayout title="新しいパスワード" subtitle="新しいパスワードを設定してください">
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
    <AuthPageLayout title="新しいパスワード" subtitle="新しいパスワードを設定してください">
      {/* 成功メッセージ */}
      {success && mounted && (
        <SuccessMessage 
          message="パスワードを更新しました。ログイン画面に移動します..." 
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors"
              placeholder="6文字以上"
              disabled={isLoading || success}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード確認
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors"
              placeholder="同じパスワードをもう一度"
              disabled={isLoading || success}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? '更新中...' : success ? '更新完了' : 'パスワードを更新'}
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
