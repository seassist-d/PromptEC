'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { clearAuthStorage } from './auth-utils';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[useAuth] Session error:', error);
        }
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('[useAuth] Error getting session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Supabaseからログアウト
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[useAuth] Sign out error:', error);
      }
      
      // ブラウザストレージを完全にクリア
      clearAuthStorage();
      
      // ユーザー状態をリセット
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('[useAuth] Error signing out:', error);
      // エラーが発生してもストレージはクリア
      clearAuthStorage();
      setUser(null);
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signOut,
  };
}
