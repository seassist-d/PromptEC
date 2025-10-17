'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    
    // Supabaseの認証状態を確認
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setErrors({ general: '認証情報が無効です。再度メール認証を行ってください。' });
          return;
        }
        
        if (!session) {
          // URLパラメータから認証情報を確認（フォールバック）
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Session setting error:', sessionError);
              setErrors({ general: '認証情報が無効です。再度メール認証を行ってください。' });
            }
          } else {
            setErrors({ general: '認証情報が無効です。再度メール認証を行ってください。' });
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setErrors({ general: '認証情報が無効です。再度メール認証を行ってください。' });
      }
    };
    
    checkAuth();
  }, [searchParams]);

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認は必須です';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
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
      // 現在のユーザーを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('認証情報が無効です。再度メール認証を行ってください。');
      }

      // パスワードを設定（OTP認証後の初回パスワード設定）
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        console.error('Password update error:', error);
        
        let errorMessage = 'パスワードの設定に失敗しました。';
        if (error.message.includes('Password should be at least')) {
          errorMessage = 'パスワードは6文字以上で入力してください。';
        } else if (error.message.includes('same as the old password')) {
          errorMessage = '新しいパスワードを入力してください。';
        }

        setErrors({ general: errorMessage });
      } else {
        // パスワード設定成功後、プロフィール作成処理を実行
        try {
          console.log('Creating user profile...');
          
          // プロフィール作成処理
          const { data: profileResult, error: profileError } = await supabase
            .rpc('update_user_profile', {
              p_user_id: user.id,
              p_display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'ユーザー',
              p_bio: null,
              p_contact: {},
              p_avatar_url: user.user_metadata?.avatar_url || null
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // プロフィール作成に失敗してもパスワード設定は成功しているので、警告のみ表示
            setSuccessMessage('パスワードが正常に設定されました。プロフィールの作成に失敗しましたが、後で設定できます。');
          } else {
            console.log('Profile created successfully:', profileResult);
            setSuccessMessage('パスワードが正常に設定され、プロフィールが作成されました。');
          }
        } catch (profileError) {
          console.error('Unexpected error during profile creation:', profileError);
          // プロフィール作成に失敗してもパスワード設定は成功しているので、警告のみ表示
          setSuccessMessage('パスワードが正常に設定されました。プロフィールの作成に失敗しましたが、後で設定できます。');
        }
        
        // 成功後、トップ画面にリダイレクト
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected error during password setup:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : '予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。'
      });
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
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワード設定
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            メール認証が完了しました。アカウントのパスワードを設定してください
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {errors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="パスワードを入力してください（6文字以上）"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード確認
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="パスワードを再入力してください"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '設定中...' : 'パスワードを設定'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
