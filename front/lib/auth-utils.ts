/**
 * 認証関連のユーティリティ関数
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * ブラウザストレージからSupabase関連のデータを完全にクリア
 */
export const clearAuthStorage = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    console.log('[Auth Utils] Starting storage cleanup...');
    
    // ローカルストレージからSupabase関連のキーをクリア
    const localStorageKeys = Object.keys(localStorage);
    const supabaseLocalKeys = localStorageKeys.filter(key => key.startsWith('sb-'));
    
    supabaseLocalKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('[Auth Utils] Removed localStorage key:', key);
    });
    
    // セッションストレージからSupabase関連のキーをクリア
    const sessionStorageKeys = Object.keys(sessionStorage);
    const supabaseSessionKeys = sessionStorageKeys.filter(key => key.startsWith('sb-'));
    
    supabaseSessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('[Auth Utils] Removed sessionStorage key:', key);
    });
    
    console.log('[Auth Utils] Storage cleanup completed:', {
      localStorageKeysRemoved: supabaseLocalKeys.length,
      sessionStorageKeysRemoved: supabaseSessionKeys.length
    });
  } catch (error) {
    console.error('[Auth Utils] Error clearing auth storage:', error);
  }
};

/**
 * 現在の認証状態をデバッグ出力
 */
export const debugAuthState = (supabase: SupabaseClient): void => {
  if (typeof window === 'undefined') {
    return;
  }

  console.log('[Auth Debug] === Current Auth State ===');
  
  // Local Storageの確認
  const localStorageKeys = Object.keys(localStorage);
  const supabaseLocalKeys = localStorageKeys.filter(key => key.startsWith('sb-'));
  console.log('[Auth Debug] Local Storage keys:', supabaseLocalKeys);
  
  // Session Storageの確認
  const sessionStorageKeys = Object.keys(sessionStorage);
  const supabaseSessionKeys = sessionStorageKeys.filter(key => key.startsWith('sb-'));
  console.log('[Auth Debug] Session Storage keys:', supabaseSessionKeys);
  
  // Cookieの確認
  const cookies = document.cookie.split(';').map(c => c.trim());
  const supabaseCookies = cookies.filter(cookie => cookie.includes('sb-'));
  console.log('[Auth Debug] Cookies:', supabaseCookies);
  
  console.log('[Auth Debug] === End Auth State ===');
};

/**
 * トークンの有効性を確認
 */
export const validateToken = async (
  supabase: SupabaseClient, 
  accessToken: string
): Promise<{ valid: boolean; user?: User; error?: Error }> => {
  try {
    console.log('[Auth Utils] Validating token...');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.error('[Auth Utils] Token validation error:', error);
      return { valid: false, error };
    }
    
    if (!user) {
      console.error('[Auth Utils] No user found for token');
      return { valid: false };
    }
    
    console.log('[Auth Utils] Token validation successful:', user.email);
    return { valid: true, user };
  } catch (error) {
    console.error('[Auth Utils] Unexpected error during token validation:', error);
    return { valid: false, error: error as Error };
  }
};

/**
 * 認証エラー時の処理
 */
export const handleAuthError = (
  error: Error | unknown, 
  router: AppRouterInstance, 
  message: string = '認証に失敗しました'
) => {
  console.error('[Auth Utils] Auth error occurred:', error);
  clearAuthStorage();
  router.push(`/auth/login?error=${encodeURIComponent(message)}`);
};
