'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, clearAuthState } from '@/lib/supabaseClient';

interface LoginFormProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // 認証状態をクリアしてからログイン（念のため）
      try {
        await clearAuthState();
      } catch (clearError) {
        console.log('認証状態クリアをスキップ:', clearError);
        // クリアに失敗しても続行
      }

      // Supabaseでログイン処理
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // console.error('Login error:', error); // コンソールエラーを非表示
        
        // エラーメッセージの日本語化
        let errorMessage = 'ログインに失敗しました。';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスが確認されていません。メール内のリンクをクリックして確認してください。';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'ログイン試行回数が上限に達しました。しばらく時間をおいて再度お試しください。';
        }

        onError?.(errorMessage);
        // errors.generalの表示は削除（login/page.tsxのerrorMessageのみ表示）
      } else {
        onSuccess?.('ログインに成功しました');
        
        // ログイン成功後、トップページにリダイレクト
        setTimeout(() => {
          router.push('/');
        }, 1500); // 成功メッセージを表示してからリダイレクト
      }
    } catch (error) {
      const errorMessage = 'ログインに失敗しました';
      onError?.(errorMessage);
      // errors.generalの表示は削除（login/page.tsxのerrorMessageのみ表示）
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // リアルタイムバリデーション
    const newErrors: Record<string, string> = {};
    
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }
    
    if (name === 'password' && value && value.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }
    
    // エラーがあれば設定
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="sr-only">
          メールアドレス
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors ${
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

      <div>
        <label htmlFor="password" className="sr-only">
          パスワード
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white transition-colors ${
            errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="パスワードを入力してください"
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-required="true"
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            ログイン状態を保持する
          </label>
        </div>

        <div className="text-sm">
          <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            パスワードを忘れた方
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        aria-busy={isLoading}
        aria-label="ログイン"
      >
        {isLoading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}
