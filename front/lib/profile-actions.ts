'use server';

import { createClient } from './supabase-server';
import type { ProfileFormData, ProfileUpdateResult, User } from '../types/auth';

export async function updateProfile(formData: ProfileFormData): Promise<ProfileUpdateResult> {
  try {
    const supabase = createClient();
    
    // 現在のユーザーを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return {
        success: false,
        message: '認証が必要です',
        error: 'Authentication required'
      };
    }

    // アバター画像のアップロード処理
    let avatarUrl = '';
    if (formData.avatar) {
      const fileExt = formData.avatar.name.split('.').pop();
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData.avatar);

      if (uploadError) {
        return {
          success: false,
          message: '画像のアップロードに失敗しました',
          error: uploadError.message
        };
      }

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      avatarUrl = urlData.publicUrl;
    }

    // プロフィール情報を更新
    const updateData: Record<string, unknown> = {
      display_name: formData.display_name,
      bio: formData.bio,
      contact: formData.contact,
      updated_at: new Date().toISOString()
    };

    // アバターがアップロードされた場合のみ更新
    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', authUser.id)
      .select()
      .single();

    if (profileError) {
      return {
        success: false,
        message: 'プロフィールの更新に失敗しました',
        error: profileError.message
      };
    }

    // 更新されたユーザー情報を返す
    const updatedUser: User = {
      id: authUser.id,
      email: authUser.email || '',
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      bio: profileData.bio,
      contact: profileData.contact,
      role: profileData.role || 'user',
      is_banned: profileData.is_banned || false,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at
    };

    return {
      success: true,
      message: 'プロフィールを更新しました',
      data: updatedUser,
      user: updatedUser
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      message: '予期しないエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const supabase = createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'プロフィールの取得に失敗しました'
      };
    }

    const user: User = {
      id: authUser.id,
      email: authUser.email || '',
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      bio: profileData.bio,
      contact: profileData.contact,
      role: profileData.role || 'user',
      is_banned: profileData.is_banned || false,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at
    };

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    };
  }
}
