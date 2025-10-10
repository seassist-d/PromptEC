'use client';

import { supabase } from './supabaseClient';

export async function debugAuth() {
  try {
    console.log('=== Auth Debug ===');
    
    // セッション情報を取得
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session error:', sessionError);
    
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('User error:', userError);
    
    // テーブルが存在するかチェック
    const { data: tables, error: tablesError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    console.log('Tables check:', tables);
    console.log('Tables error:', tablesError);
    
    return { session, user, tables, sessionError, userError, tablesError };
  } catch (error) {
    console.error('Debug auth error:', error);
    return { error };
  }
}
