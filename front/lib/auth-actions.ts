'use server';

import { supabaseServer, type RegisterData, type RegisterResult } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

/**
 * 新規登録用のServer Action
 * @param formData フォームデータ
 * @returns RegisterResult
 */
export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    // フォームデータから値を取得
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    // バリデーション
    if (!email || !password) {
      return {
        success: false,
        message: 'メールアドレスとパスワードは必須です。',
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'パスワードは6文字以上で入力してください。',
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

    // Supabaseでユーザー登録
    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || '',
        },
      },
    });

    if (error) {
      console.error('Registration error:', error);
      
      // エラーメッセージの日本語化
      let errorMessage = '登録に失敗しました。';
      if (error.message.includes('already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています。';
      } else if (error.message.includes('invalid email')) {
        errorMessage = '無効なメールアドレスです。';
      } else if (error.message.includes('password')) {
        errorMessage = 'パスワードが弱すぎます。より強力なパスワードを設定してください。';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }

    // 登録成功
    return {
      success: true,
      message: '登録が完了しました。確認メールを送信しましたので、メール内のリンクをクリックしてアカウントを有効化してください。',
      user: data.user,
    };

  } catch (error) {
    console.error('Unexpected error during registration:', error);
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
