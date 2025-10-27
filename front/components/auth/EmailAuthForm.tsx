'use client';

import { useState, useEffect } from 'react';
import { useEmailAuth } from '@/hooks/useEmailAuth';

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
  
  // カスタムフックを使用
  const { signUp, resendEmail, isLoading, errors, setErrors } = useEmailAuth();

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

  // パスワード続行ボタンの処理
  const handlePasswordContinue = async () => {
    if (validatePassword()) {
      setErrors({});

      // カスタムフックを使用してメール認証
      const result = await signUp(email, password, 'register');

      if (result.success) {
        setEmailSent(true);
        onSuccess?.('確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。');
      } else {
        onError?.(result.error || '新規登録に失敗しました');
        // errors.generalの表示は削除（register/page.tsxのerrorMessageのみ表示）
        setErrors({ 
          showLoginButton: result.error?.includes('既に登録されています') ? 'true' : undefined
        });
      }
    }
  };

  // 確認メール再送機能
  const handleResendEmail = async () => {
    if (isLoading) return; // 既に処理中の場合は何もしない
    setErrors({});

    // カスタムフックを使用してメール再送
    const result = await resendEmail(email, 'register');

    if (result.success) {
      onSuccess?.('確認メールを再送しました。届かない場合は迷惑メールも確認してください。');
    } else {
      const errorMessage = result.error ?? '再送に失敗しました。時間をおいてお試しください。';
      onError?.(errorMessage);
      setErrors({ general: errorMessage });
    }
  };

  // 入力値変更時のリアルタイムバリデーション
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // エラーをクリア
    if (errors.email) {
      setErrors({});
    }
    
    // リアルタイムバリデーション（入力中でも簡易チェック）
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors({ email: '正しいメールアドレスを入力してください' });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // エラーをクリア
    if (errors.password) {
      setErrors({});
    }
    
    // リアルタイムバリデーション
    if (value && value.length < 6) {
      setErrors({ password: 'パスワードは6文字以上で入力してください' });
    }
    
    // 確認パスワードと比較
    if (confirmPassword && value !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'パスワードが一致しません' }));
    } else if (confirmPassword && value === confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // エラーをクリア
    if (errors.confirmPassword) {
      setErrors({});
    }
    
    // リアルタイムバリデーション
    if (password && value !== password) {
      setErrors({ confirmPassword: 'パスワードが一致しません' });
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
      <div className="text-center space-y-2">
        {/* 成功メッセージはregister/page.tsxで表示されるため、ここには表示しない */}
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
      {/* メールアドレス入力欄 */}
      <div>
        <label htmlFor="email" className="sr-only">
          メールアドレス
        </label>
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
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-required="true"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
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
            aria-busy={isLoading}
            aria-label="メールアドレス入力の続行"
          >
            {isLoading ? '処理中...' : '続行'}
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
            <label htmlFor="password" className="sr-only">
              パスワード
            </label>
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
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-required="true"
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              パスワード確認
            </label>
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
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              aria-required="true"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert">{errors.confirmPassword}</p>
            )}
          </div>

          {/* パスワード続行ボタン */}
          <button
            type="button"
            onClick={handlePasswordContinue}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-busy={isLoading}
            aria-label="パスワード入力の続行"
          >
            {isLoading ? '処理中...' : '続行'}
          </button>

          {/* 戻るボタン */}
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="前の画面に戻る"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
}
