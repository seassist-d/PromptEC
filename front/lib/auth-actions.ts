'use server';

import { supabaseServer, type RegisterData, type RegisterResult, type LoginResult } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { getRedirectUrl } from '@/lib/get-redirect-url';

/**
 * 新規登録用のServer Action（メールアドレスのみ）
 * @param formData フォームデータ
 * @returns RegisterResult
 */
export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    // 環境変数の確認
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return {
        success: false,
        message: 'システム設定エラーです。管理者にお問い合わせください。',
        error: 'Missing Supabase environment variables',
      };
    }

    // フォームデータから値を取得
    const email = formData.get('email') as string;

    // バリデーション
    if (!email) {
      return {
        success: false,
        message: 'メールアドレスは必須です。',
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

    // Supabaseでメールアドレス認証（パスワードレス）
    console.log('Sending OTP email to:', email);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // 動的にポートを検出してリダイレクトURLを生成
    const redirectUrl = getRedirectUrl();
    console.log('Redirect URL:', redirectUrl);
    
    // Supabaseクライアントの接続テスト
    try {
      const { data: healthCheck, error: healthError } = await supabaseServer
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (healthError) {
        console.error('Supabase connection test failed:', healthError);
      } else {
        console.log('Supabase connection test successful');
      }
    } catch (healthError) {
      console.error('Supabase health check error:', healthError);
    }
    
    // まず、Supabaseの認証設定を確認
    console.log('Attempting OTP sign-in with email:', email);
    console.log('Redirect URL:', redirectUrl);
    
    const { data, error } = await supabaseServer.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true, // ユーザーが存在しない場合は作成
      },
    });

    console.log('OTP response data:', JSON.stringify(data, null, 2));
    console.log('OTP response error:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      
      // エラーメッセージの日本語化
      let errorMessage = '登録に失敗しました。';
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています。';
      } else if (error.message.includes('invalid email')) {
        errorMessage = '無効なメールアドレスです。';
      } else if (error.message.includes('rate limit')) {
        errorMessage = '送信回数が上限に達しました。しばらく時間をおいて再度お試しください。';
      } else if (error.message.includes('Supabase環境変数が未設定')) {
        errorMessage = 'システム設定エラーです。管理者にお問い合わせください。';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'メールアドレスが確認されていません。メール内のリンクをクリックして確認してください。';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = '無効なメールアドレスです。';
      } else if (error.message.includes('Signup is disabled')) {
        errorMessage = '新規登録が無効になっています。管理者にお問い合わせください。';
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'メール送信回数が上限に達しました。しばらく時間をおいて再度お試しください。';
      } else if (error.message.includes('Database error saving new user')) {
        errorMessage = 'データベースエラーが発生しました。Supabaseの認証設定を確認してください。';
      } else if (error.message.includes('unexpected_failure')) {
        errorMessage = '予期しないエラーが発生しました。Supabaseの設定を確認してください。';
      } else if (error.message.includes('Signup is disabled')) {
        errorMessage = '新規登録が無効になっています。Supabaseダッシュボードで設定を確認してください。';
      } else if (error.message.includes('Email confirmations are disabled')) {
        errorMessage = 'メール認証が無効になっています。Supabaseダッシュボードで設定を確認してください。';
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
      message: '認証メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。',
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
