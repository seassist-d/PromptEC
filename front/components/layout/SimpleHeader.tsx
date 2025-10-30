'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { getProfileClient } from '@/lib/profile-client';
import { useCart } from '@/hooks/useCart';
import type { User } from '@/types/auth';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const { itemCount } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // プロフィール情報を取得（ページ読み込み時と定期的に更新）
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !profileLoading) {
        setProfileLoading(true);
        try {
          const result = await getProfileClient();
          if (result.success && result.user) {
            setProfileUser(result.user);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
    
    // 定期的にプロフィールを再取得（30秒ごと）
    const interval = setInterval(fetchProfile, 30000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  // フォーカスが戻ったときにプロフィールを再取得
  useEffect(() => {
    const handleFocus = async () => {
      if (user) {
        try {
          const result = await getProfileClient();
          if (result.success && result.user) {
            setProfileUser(result.user);
          }
        } catch (error) {
          console.error('Failed to fetch profile on focus:', error);
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 表示名を決定する関数
  const getDisplayName = () => {
    if (profileUser?.display_name) {
      return profileUser.display_name;
    }
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'ユーザー';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-14 sm:h-16">
          {/* ロゴ */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                PromptEC
              </span>
            </Link>
          </div>
          
          {/* 中央: 検索バー（デスクトップのみ表示） */}
          <div className="hidden md:flex justify-center items-center mx-4">
            <form action="/search" method="GET" className="relative w-full max-w-lg">
              <input
                type="text"
                name="q"
                placeholder="キーワードで検索する"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          
          {/* 右: ナビメニュー */}
          <div className="flex items-center justify-end space-x-4">
            {/* カートアイコン */}
            <Link href="/cart" className="relative text-gray-700 hover:text-blue-600 p-2 transition-colors rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6l-1-12z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-bounce">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            
            {loading || profileLoading ? (
              // ローディング中
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              // ログイン済み: ユーザードロップダウンメニュー
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* ユーザーアバター */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {(profileUser?.avatar_url || user.user_metadata?.avatar_url) ? (
                      <img 
                        src={profileUser?.avatar_url || user.user_metadata?.avatar_url} 
                        alt="アバター" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <span className="hidden sm:inline">{getDisplayName()}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* ドロップダウンメニュー */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        プロフィール
                      </Link>
                      <Link
                        href="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        プロフィール編集
                      </Link>
                      {profileUser?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100"></div>
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 font-semibold"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            🛡️ 管理者ダッシュボード
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 未ログイン: ログイン・新規登録ボタン（デスクトップ）
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors hover:bg-gray-100">
                  ログイン
                </Link>
                <Link href="/auth/register" className="bg-blue-600 text-white px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-bold hover:bg-blue-700 shadow-lg transition-all hover:scale-105">
                  新規登録
                </Link>
              </>
            )}
            
            {/* 販売ボタン */}
            <Link 
              href="/prompts/create" 
              className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
            >
              販売
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
