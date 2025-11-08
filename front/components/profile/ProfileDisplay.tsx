'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '../../types/auth';
import LikedPromptsList from './LikedPromptsList';

interface ProfileDisplayProps {
  user: User;
  showEditButton?: boolean;
}

interface Prompt {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  price_jpy: number;
  view_count: number;
  like_count: number;
  created_at: string;
}

export default function ProfileDisplay({ user, showEditButton = true }: ProfileDisplayProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserPrompts = async () => {
      try {
        const response = await fetch('/api/prompts');
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
        } else {
          console.error('Failed to fetch user prompts');
        }
      } catch (error) {
        console.error('Error fetching user prompts:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };

    if (user.role === 'seller' || user.role === 'admin' || user.role === 'user') {
      fetchUserPrompts();
    } else {
      setLoadingPrompts(false);
    }
  }, [user.id, user.role]);

  const handleDeletePrompt = async (slug: string) => {
    if (!confirm('このプロンプトを削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロンプトの削除に失敗しました');
      }

      // プロンプト一覧を再取得
      const updatedPrompts = prompts.filter(prompt => prompt.slug !== slug);
      setPrompts(updatedPrompts);
    } catch (error) {
      console.error('Prompt deletion error:', error);
      alert(error instanceof Error ? error.message : 'プロンプトの削除に失敗しました');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* プロフィール情報 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-6">
          {/* アバター */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img 
                  src={`${user.avatar_url}?t=${new Date(user.updated_at).getTime()}`}
                  alt="アバター" 
                  className="w-full h-full object-cover"
                  key={`avatar-${user.id}-${user.updated_at}`}
                />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
          </div>

          {/* 基本情報 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {user.display_name || '未設定'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/seller"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ダッシュボード
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  購入履歴
                </Link>
              </div>
            </div>
            
            {user.bio && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">自己紹介</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{user.bio}</p>
              </div>
            )}

            {/* 連絡先情報 */}
            {user.contact?.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">連絡先</h3>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href={`mailto:${user.contact.email}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {user.contact.email}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 統計情報（将来の拡張用） */}
      {(user.role === 'seller' || user.role === 'admin' || user.role === 'user') && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">プロンプト統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{prompts.length}</div>
              <div className="text-sm text-gray-500">出品数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-500">売上数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-500">評価平均</div>
            </div>
          </div>
        </div>
      )}

      {/* いいねしたプロンプト一覧 */}
      {(user.role === 'seller' || user.role === 'admin' || user.role === 'user') && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">いいねしたプロンプト</h3>
          <LikedPromptsList />
        </div>
      )}

      {/* プロンプト一覧 */}
      {(user.role === 'seller' || user.role === 'admin' || user.role === 'user') && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">マイプロンプト</h3>
            <Link
              href="/prompts/create"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              新しいプロンプトを作成
            </Link>
          </div>

          {loadingPrompts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">プロンプトがありません</h3>
              <p className="mt-1 text-sm text-gray-500">まだプロンプトを作成していません。最初のプロンプトを作成してみましょう。</p>
              <div className="mt-6">
                <Link
                  href="/prompts/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  プロンプトを作成
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/prompts/${prompt.slug}`)}
                >
                  <div className="p-6">
                    <div className="mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 min-h-[3.5rem]">{prompt.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{prompt.short_description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(prompt.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <span className="text-xs text-gray-500">❤️ {prompt.like_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
