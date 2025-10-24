'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    display_name: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      // 既存のプロファイル情報を取得
      setFormData(prev => ({
        ...prev,
        display_name: user.user_metadata?.display_name || ''
      }));
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('Form data:', formData);
    console.log('User:', user);
    console.log('Supabase client:', supabase);

    try {
      if (!user) {
        throw new Error('ユーザー情報が見つかりません');
      }

      // Supabaseの認証状態を確認
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', authUser);
      console.log('Auth error:', authError);

      if (authError || !authUser) {
        throw new Error(`認証エラー: ${authError?.message || 'ユーザー情報が取得できません'}`);
      }

      // プロファイルを更新
      console.log('Attempting to upsert profile with data:', {
        user_id: user.id,
        display_name: formData.display_name,
        bio: formData.bio || null,
        contact: {},
        updated_at: new Date().toISOString()
      });

      const { data: upsertData, error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: formData.display_name,
          bio: formData.bio || null,
          contact: {},
          updated_at: new Date().toISOString()
        })
        .select();

      console.log('Upsert result:', { upsertData, updateError });

      if (updateError) {
        console.error('Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw updateError;
      }

      // プロフィール設定完了後、トップページにリダイレクト
      router.push('/');
    } catch (error) {
      console.error('Profile setup error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      
      // より詳細なエラー情報を表示
      let errorMessage = 'プロフィールの設定に失敗しました。もう一度お試しください。';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Supabaseエラーの場合
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        } else if ('details' in error) {
          errorMessage = (error as { details: string }).details || errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              プロフィール設定
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              アカウントの基本情報を設定してください。後から変更することもできます。
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="display_name"
                    id="display_name"
                    required
                    value={formData.display_name}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                    placeholder="名前を入力してください"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  自己紹介
                </label>
                <div className="mt-1">
                  <textarea
                    name="bio"
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                    placeholder="自己紹介を入力してください（任意）"
                  />
                </div>
              </div>


              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? '設定中...' : 'プロフィールを設定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
