'use client';

import { supabase } from './supabaseClient';
import type { User } from '../types/auth';

export async function getProfileFromAuth(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    // 認証情報から直接プロフィールを構築
    const user: User = {
      id: authUser.id,
      email: authUser.email || '',
      display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'ユーザー',
      avatar_url: authUser.user_metadata?.avatar_url || null,
      bio: undefined,
      contact: {},
      role: 'user',
      is_banned: false,
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Get profile from auth error:', error);
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    };
  }
}
