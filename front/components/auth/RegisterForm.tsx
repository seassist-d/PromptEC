'use client';

import { useState, useEffect } from 'react';
import { registerUser } from '@/lib/auth-actions';
import type { RegisterFormData, RegisterServerResult } from '@/types/auth';

interface RegisterFormProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
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
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);

      const result: RegisterServerResult = await registerUser(formDataToSend);

      if (result.success) {
        onSuccess?.(result.message);
        // フォームをリセット
        setFormData({
          email: '',
        });
      } else {
        onError?.(result.message);
        setErrors({ general: result.message });
      }
    } catch (error) {
      const errorMessage = '予期しないエラーが発生しました';
      onError?.(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && mounted && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      <div>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="メールアドレスを入力してください"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>


      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '認証メール送信中...' : '認証メールを送信'}
      </button>

      <div className="mt-4">
        <p className="text-sm text-gray-600 text-center">
          認証メール送信により、
          <a href="/terms" className="text-blue-600 hover:text-blue-500">
            利用規約
          </a>
          および
          <a href="/privacy" className="text-blue-600 hover:text-blue-500">
            プライバシーポリシー
          </a>
          に同意したことになります。
        </p>
      </div>
    </form>
  );
}
