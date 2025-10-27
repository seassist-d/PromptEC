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
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-b border-blue-500/20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* ロゴ */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">
                PromptEC
              </span>
              <span className="ml-1 sm:ml-2 text-white text-lg sm:text-xl lg:text-2xl animate-bounce">✨</span>
            </Link>
          </div>
          
          {/* 中央: 検索バー（デスクトップのみ表示） */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="プロンプトを検索..."
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all shadow-lg"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-200 transition-colors animate-pulse-glow"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          
          {/* 右: ナビメニュー */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10">
              ホーム
            </Link>
            <Link href="/prompts/create" className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10">
              プロンプトを登録
            </Link>
            
            {/* カートアイコン */}
            <Link href="/cart" className="relative text-white/90 hover:text-white p-2 transition-colors rounded-lg hover:bg-white/10">
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
                  className="flex items-center space-x-1 sm:space-x-2 text-white/90 hover:text-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
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
                <Link href="/auth/login" className="text-white/90 hover:text-white px-2 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors hover:bg-white/10">
                  ログイン
                </Link>
                <Link href="/auth/register" className="bg-white text-blue-600 px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-bold hover:bg-blue-50 shadow-lg transition-all hover:scale-105">
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
