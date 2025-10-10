'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/useAuth';
import { getProfileClient } from '../../../lib/profile-client';
import ProfileEditForm from '../../../components/profile/ProfileEditForm';
import ProfileDisplay from '../../../components/profile/ProfileDisplay';
import type { User } from '../../../types/auth';

export default function ProfileEditPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;

      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      try {
        const result = await getProfileClient();
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          setError(result.error || 'プロフィールの取得に失敗しました');
        }
      } catch {
        setError('予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authUser, authLoading, router]);

  const handleSuccess = (updatedUser: User) => {
    setUser(updatedUser);
    // 成功メッセージを表示（必要に応じて）
    alert('プロフィールを更新しました');
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/profile')}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            プロフィールに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ユーザー情報が見つかりません</p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            プロフィールに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* プレビュー表示 */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">プレビュー</h2>
            <ProfileDisplay user={user} showEditButton={false} />
          </div>
          
          {/* 編集フォーム */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">編集</h2>
            <ProfileEditForm
              user={user}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
