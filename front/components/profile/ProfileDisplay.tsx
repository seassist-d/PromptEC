'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '../../types/auth';

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
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
          {showEditButton && (
            <Link
              href="/profile/edit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              編集
            </Link>
          )}
        </div>
      </div>

      {/* プロフィール情報 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-6">
          {/* アバター */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="アバター" 
                  className="w-full h-full object-cover"
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
                {(user.role === 'seller' || user.role === 'admin') && (
                  <Link
                    href="/seller"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    ダッシュボード
                  </Link>
                )}
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
            {user.contact && Object.values(user.contact).some(value => value) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">連絡先</h3>
                <div className="space-y-1">
                  {user.contact.email && (
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
                  )}
                  
                  {user.contact.url && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <a 
                        href={user.contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {user.contact.url}
                      </a>
                    </div>
                  )}
                  
                  {user.contact.twitter && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <a 
                        href={`https://twitter.com/${user.contact.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {user.contact.twitter}
                      </a>
                    </div>
                  )}
                  
                  {user.contact.github && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <a 
                        href={`https://github.com/${user.contact.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {user.contact.github}
                      </a>
                    </div>
                  )}
                  
                  {user.contact.linkedin && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <a 
                        href={`https://linkedin.com/in/${user.contact.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {user.contact.linkedin}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* アカウント情報 */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">アカウント情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">ユーザーID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ロール</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.role === 'admin' && '管理者'}
                {user.role === 'seller' && '出品者'}
                {user.role === 'user' && '一般ユーザー'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">登録日</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">最終更新</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.updated_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
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
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{prompt.title}</h4>
                      <div className="flex space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/prompts/${prompt.slug}`}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                          title="表示"
                          onClick={(e) => e.stopPropagation()}
                        >
                          👁️
                        </Link>
                        <Link
                          href={`/prompts/${prompt.slug}/edit`}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                          title="編集"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.slug);
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{prompt.short_description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">¥{prompt.price_jpy.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(prompt.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>👀 {prompt.view_count}</span>
                        <span>❤️ {prompt.like_count}</span>
                      </div>
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
