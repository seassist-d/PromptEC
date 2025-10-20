'use server';

import { supabaseServer, type LoginResult } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

/**
 * ログイン用のServer Action
 * @param formData フォームデータ
 * @returns LoginResult
 */
export async function loginUser(formData: FormData): Promise<LoginResult> {
  try {
    // フォームデータから値を取得
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // バリデーション
    if (!email) {
      return {
        success: false,
        message: 'メールアドレスは必須です。',
      };
    }

    if (!password) {
      return {
        success: false,
        message: 'パスワードは必須です。',
      };
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: '正しいメールアドレスを入力してください。',
      };
    }

    // Supabaseでログイン
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      
      // エラーメッセージの日本語化
      let errorMessage = 'ログインに失敗しました。';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'メールアドレスが確認されていません。メール内のリンクをクリックして確認してください。';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'ログイン試行回数が上限に達しました。しばらく時間をおいて再度お試しください。';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }

    // ログイン成功
    return {
      success: true,
      message: 'ログインに成功しました。',
      user: data.user,
    };

  } catch (error) {
    console.error('Unexpected error during login:', error);
    return {
      success: false,
      message: '予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 登録成功後のリダイレクト用Server Action
 * @param redirectPath リダイレクト先のパス
 */
export async function redirectAfterRegistration(redirectPath: string = '/auth/login') {
  redirect(redirectPath);
}
