'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface EmailAuthFormProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onNavigateToLogin?: () => void;
}

export default function EmailAuthForm({ onSuccess, onError, onNavigateToLogin }: EmailAuthFormProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // メールアドレスのバリデーション
  const validateEmail = (): boolean => {
    if (!email) {
      setErrors({ email: 'メールアドレスは必須です' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: '正しいメールアドレスを入力してください' });
      return false;
    }
    setErrors({});
    return true;
  };

  // パスワードのバリデーション
  const validatePassword = (): boolean => {
    if (!password) {
      setErrors({ password: 'パスワードは必須です' });
      return false;
    }
    if (password.length < 6) {
      setErrors({ password: 'パスワードは6文字以上で入力してください' });
      return false;
    }
    if (!confirmPassword) {
      setErrors({ confirmPassword: 'パスワードの確認は必須です' });
      return false;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'パスワードが一致しません' });
      return false;
    }
    setErrors({});
    return true;
  };

  // メールアドレス続行ボタンの処理
  const handleEmailContinue = () => {
    if (validateEmail()) {
      setShowPassword(true);
      setErrors({});
    }
  };

  // パスワード続行ボタンの処理（SupabaseのsignUpを使用）
  const handlePasswordContinue = async () => {
    if (validatePassword()) {
      setIsLoading(true);
      setErrors({});

      try {
        // Supabaseで新規登録を試行
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?source=register`
          }
        });

      if (error) {
        console.error('Registration error:', error);
        console.log('Error message:', error.message);
        console.log('Error status:', error.status);
        
        // 既存ユーザーのエラーメッセージをチェック
        if (error.message.includes('User already registered') || 
            error.message.includes('already registered') ||
            error.message.includes('Email address already registered') ||
            error.message.includes('duplicate key value') ||
            error.message.includes('email already exists') ||
            error.message.includes('For security purposes, you can only request this after') ||
            error.status === 429) {
          // 既存ユーザー
          const errorMessage = 'このメールアドレスは既に登録されています。';
          onError?.(errorMessage);
          setErrors({ 
            general: errorMessage,
            showLoginButton: 'true'
          });
        } else if (error.message.includes('Password should be at least')) {
          const errorMessage = 'パスワードは6文字以上で入力してください。';
          onError?.(errorMessage);
          setErrors({ general: errorMessage });
        } else if (error.message.includes('Invalid email')) {
          const errorMessage = '正しいメールアドレスを入力してください。';
          onError?.(errorMessage);
          setErrors({ general: errorMessage });
        } else {
          // その他のエラー（デバッグ用にエラーメッセージを表示）
          const errorMessage = `新規登録に失敗しました: ${error.message}`;
          onError?.(errorMessage);
          setErrors({ general: errorMessage });
        }
      } else if (data?.user) {
        // エラーがなく、ユーザーが作成された場合 = 新規ユーザー
        setEmailSent(true);
        onSuccess?.('確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。');
      } else {
        // その他の場合
        setEmailSent(true);
        onSuccess?.('確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。');
      }
      } catch (error) {
        const errorMessage = '新規登録に失敗しました';
        onError?.(errorMessage);
        setErrors({ general: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 確認メール再送機能
  const handleResendEmail = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?source=register`,
        },
      });

      if (error) {
        throw error;
      }

      onSuccess?.('確認メールを再送しました。届かない場合は迷惑メールも確認してください。');
    } catch (error: any) {
      const errorMessage = error?.message ?? '再送に失敗しました。時間をおいてお試しください。';
      onError?.(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // 入力値変更時のエラークリア
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors({});
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors({});
    }
  };

  // 戻るボタンの処理
  const handleBack = () => {
    setShowPassword(false);
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  // 別のメールアドレスで再試行
  const handleRetryWithNewEmail = () => {
    setEmailSent(false);
    setShowPassword(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // 確認メール送信後の表示
  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                確認メールを送信しました
              </p>
              <p className="text-sm mt-1">
                {email} に送信されたメール内のリンクをクリックしてアカウントを有効化してください。
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleResendEmail}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? '送信中...' : '確認メールを再送する'}
          </button>
          
          <button
            onClick={handleRetryWithNewEmail}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            別のメールアドレスで再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* エラーメッセージ */}
      {errors.general && mounted && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span>{errors.general}</span>
            {errors.showLoginButton && onNavigateToLogin && (
              <button
                onClick={onNavigateToLogin}
                className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500 underline transition-colors"
              >
                ログイン画面へ
              </button>
            )}
          </div>
        </div>
      )}

      {/* メールアドレス入力欄 */}
      <div>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={handleEmailChange}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors ${
            errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="メールアドレスを入力"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* メールアドレス続行ボタン */}
      {!showPassword && (
        <>
          <button
            type="button"
            onClick={handleEmailContinue}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            続行
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            続行することで、<a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">利用規約</a>及び<a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">プライバシーポリシー</a>に<br />
            同意するものとみなされます
          </p>
        </>
      )}

      {/* パスワード入力欄（メールアドレス入力後に表示） */}
      {showPassword && (
        <div className="space-y-4">
          <div>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="パスワードを入力"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="パスワードを再入力"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* パスワード続行ボタン */}
          <button
            type="button"
            onClick={handlePasswordContinue}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? '処理中...' : '続行'}
          </button>

          {/* 戻るボタン */}
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
}
