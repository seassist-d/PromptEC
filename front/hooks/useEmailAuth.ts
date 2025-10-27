'use client';

import { useState } from 'react';
import { supabase, clearAuthState } from '@/lib/supabaseClient';

interface UseEmailAuthReturn {
  signUp: (email: string, password: string, source: 'register' | 'login') => Promise<{ success: boolean; error?: string }>;
  resendEmail: (email: string, source: 'register' | 'login') => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

export function useEmailAuth(): UseEmailAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signUp = async (
    email: string,
    password: string,
    source: 'register' | 'login'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setErrors({});

    try {
      // メール認証の場合、クリアは不要（新しいユーザーの登録なので）
      // 念のため、エラーが発生しても続行するようにtry-catchで囲む
      try {
        await clearAuthState();
      } catch (clearError) {
        console.log('認証状態クリアをスキップ:', clearError);
        // クリアに失敗しても続行
      }

      // Supabaseで新規登録を試行
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?source=${source}`
        }
      });

      if (error) {
        console.error('メール認証エラー:', error);
        
        // エラーメッセージの判定
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already registered') ||
          error.message.includes('Email address already registered') ||
          error.message.includes('duplicate key value') ||
          error.message.includes('email already exists') ||
          error.message.includes('For security purposes, you can only request this after') ||
          error.status === 429
        ) {
          return {
            success: false,
            error: 'このメールアドレスは既に登録されています。'
          };
        } else if (error.message.includes('Password should be at least')) {
          return {
            success: false,
            error: 'パスワードは6文字以上で入力してください。'
          };
        } else if (error.message.includes('Invalid email')) {
          return {
            success: false,
            error: '正しいメールアドレスを入力してください。'
          };
        } else {
          return {
            success: false,
            error: '新規登録に失敗しました'
          };
        }
      }

      // 成功
      if (data?.user) {
        return { success: true };
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('メール認証で予期しないエラー:', error);
      return {
        success: false,
        error: '新規登録に失敗しました'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmail = async (
    email: string,
    source: 'register' | 'login'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?source=${source}`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message ?? '再送に失敗しました。時間をおいてお試しください。';
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    resendEmail,
    isLoading,
    errors,
    setErrors
  };
}

