'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">PromptEC</span>
            </Link>
          </div>
          
          {/* 中央: 検索バー */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="プロンプトを検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 右: ナビメニュー */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              ホーム
            </Link>
            <Link href="/prompts" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              プロンプト検索
            </Link>
            
            {loading ? (
              // ローディング中
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              // ログイン済み: ユーザー名とログアウトボタン
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm font-medium">
                  こんにちは、{user.email?.split('@')[0] || 'ユーザー'}さん
                </span>
                <button
                  onClick={signOut}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              // 未ログイン: ログイン・新規登録ボタン
              <>
                <Link href="/auth/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  ログイン
                </Link>
                <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
