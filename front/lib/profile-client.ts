'use client';

import { supabase } from './supabaseClient';
import type { ProfileFormData, User } from '../types/auth';

export async function updateProfileClient(formData: ProfileFormData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // 現在のユーザーを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return {
        success: false,
        error: '認証が必要です'
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
          error: '画像のアップロードに失敗しました'
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
      console.error('Profile update error:', profileError);
      
      // プロフィールが存在しない場合は新規作成
      if (profileError.code === 'PGRST116') {
        console.log('Profile not found, creating new profile...');
        
        const { data: newProfileData, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authUser.id,
            display_name: formData.display_name,
            avatar_url: avatarUrl || null,
            bio: formData.bio,
            contact: formData.contact,
            role: 'user',
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          return {
            success: false,
            error: 'プロフィールの作成に失敗しました'
          };
        }

        const updatedUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          display_name: newProfileData.display_name,
          avatar_url: newProfileData.avatar_url,
          bio: newProfileData.bio,
          contact: newProfileData.contact,
          role: newProfileData.role || 'user',
          is_banned: newProfileData.is_banned || false,
          created_at: newProfileData.created_at,
          updated_at: newProfileData.updated_at
        };

        return {
          success: true,
          user: updatedUser
        };
      }
      
      return {
        success: false,
        error: `プロフィールの更新に失敗しました: ${profileError.message}`
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
      user: updatedUser
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    };
  }
}

export async function getProfileClient(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth user:', authUser);
    console.log('Auth error:', authError);
    
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
      console.error('Profile fetch error:', profileError);
      
      // プロフィールが存在しない場合は新規作成
      if (profileError.code === 'PGRST116') {
        console.log('Profile not found, creating new profile...');
        
        const { data: newProfileData, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authUser.id,
            display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'ユーザー',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            bio: null,
            contact: {},
            role: 'user',
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          return {
            success: false,
            error: 'プロフィールの作成に失敗しました'
          };
        }

        const user: User = {
          id: authUser.id,
          email: authUser.email || '',
          display_name: newProfileData.display_name,
          avatar_url: newProfileData.avatar_url,
          bio: newProfileData.bio,
          contact: newProfileData.contact,
          role: newProfileData.role || 'user',
          is_banned: newProfileData.is_banned || false,
          created_at: newProfileData.created_at,
          updated_at: newProfileData.updated_at
        };

        return {
          success: true,
          user
        };
      }
      
      // その他のエラーの場合、認証情報からプロフィールを構築
      console.log('Using fallback profile from auth data');
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'ユーザー',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        bio: null,
        contact: {},
        role: 'user',
        is_banned: false,
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        success: true,
        user: fallbackUser
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
