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
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !profileLoading) {
        setProfileLoading(true);
        try {
          const result = await getProfileClient();
          if (result.success && result.user) setProfileUser(result.user);
        } catch (e) {
          console.error('Failed to fetch profile:', e);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleFocus = async () => {
      if (user) {
        try {
          const result = await getProfileClient();
          if (result.success && result.user) setProfileUser(result.user);
        } catch (e) {
          console.error('Failed to fetch profile on focus:', e);
        }
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayName = () => {
    if (profileUser?.display_name) return profileUser.display_name;
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name;
    if (user?.email) return user.email.split('@')[0];
    return 'ユーザー';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-16">
          
          {/* ========== ロゴ ========== */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-400 transition-all">
                Prompt Assist
              </span>
            </Link>
          </div>

          {/* ========== 検索欄 ========== */}
          <div className="hidden md:flex justify-center mx-6">
            <form action="/search" method="GET" className="relative w-full max-w-[640px]">
              <input
                type="text"
                name="q"
                placeholder="プロンプトやカテゴリを検索"
                className="
                  w-full h-11 ps-4 pe-12
                  rounded-full border border-indigo-100
                  bg-gradient-to-r from-indigo-50/70 to-sky-50/70
                  text-neutral-800 placeholder-zinc-500
                  focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400
                  transition-all
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]
                "
              />
              <button
                type="submit"
                aria-label="検索"
                className="
                  absolute right-1.5 top-1/2 -translate-y-1/2
                  inline-flex items-center justify-center
                  h-8 w-8 rounded-full
                  text-indigo-500 hover:text-indigo-700 hover:bg-white
                  transition-all border border-transparent hover:border-indigo-200
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.8-4.8M16.2 10.5a5.7 5.7 0 11-11.4 0 5.7 5.7 0 0111.4 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* ========== 右ナビ ========== */}
          <div className="flex items-center justify-end gap-2">
            
            {/* カート */}
            <Link
              href="/cart"
              className="relative p-2 rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
              aria-label="カート"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6l-1-12z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* ユーザー */}
            {loading || profileLoading ? (
              <div className="animate-pulse"><div className="h-4 w-20 bg-indigo-100 rounded" /></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-sm font-medium text-neutral-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden ring-1 ring-indigo-200">
                    {(profileUser?.avatar_url || user.user_metadata?.avatar_url) ? (
                      <img src={profileUser?.avatar_url || user.user_metadata?.avatar_url} alt="アバター" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 m-1.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <span className="hidden sm:inline max-w-[12rem] truncate">{getDisplayName()}</span>
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl ring-1 ring-indigo-50 z-50 overflow-hidden" role="menu">
                    <div className="py-1">
                      <Link href="/profile" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                        プロフィール
                      </Link>
                      <Link href="/profile/edit" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                        プロフィール編集
                      </Link>
                      {profileUser?.role === 'admin' && (
                        <>
                          <div className="my-1 h-px bg-indigo-50" />
                          <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                            🛡️ 管理者ダッシュボード
                          </Link>
                        </>
                      )}
                      <div className="my-1 h-px bg-indigo-50" />
                      <button onClick={() => { setIsDropdownOpen(false); signOut(); }} className="block w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" role="menuitem">
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors">
                  ログイン
                </Link>
                <Link href="/auth/register" className="px-4 py-2 rounded-xl text-sm font-semibold text-indigo-50 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 shadow-sm transition-colors">
                  新規登録
                </Link>
              </>
            )}

            {/* 販売ボタン */}
            <Link href="/prompts/create" className="ms-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1E4ED8] shadow-sm transition-colors">
              販売
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
