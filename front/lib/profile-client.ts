'use client';

import { supabase } from './supabaseClient';
import type { ProfileFormData, User } from '../types/auth';

export async function deleteAvatarClient(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // ユーザーの既存アバターファイルを取得
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(`${userId}/`);

    if (listError) {
      console.error('Failed to list avatar files:', listError);
      return {
        success: false,
        error: 'アバター画像の削除に失敗しました'
      };
    }

    // 全てのアバターファイルを削除
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filePaths);

      if (deleteError) {
        console.error('Failed to delete avatar files:', deleteError);
        return {
          success: false,
          error: 'アバター画像の削除に失敗しました'
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Delete avatar error:', error);
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    };
  }
}

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

    // アバター削除が指定されている場合
    let avatarUrl: string | null = null;
    if (formData.avatar === null) {
      // 削除を指定された場合
      await deleteAvatarClient(authUser.id);
      avatarUrl = null;
    } else if (formData.avatar && formData.avatar instanceof File) {
      // 新しい画像をアップロードする場合
      // 既存のアバターを削除
      await deleteAvatarClient(authUser.id);
      
      const fileExt = formData.avatar.name.split('.').pop();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const fileName = `${authUser.id}-${timestamp}-${random}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData.avatar, {
          cacheControl: '3600',
          upsert: true  // 既存ファイルを上書き
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return {
          success: false,
          error: uploadError.message || '画像のアップロードに失敗しました'
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

    // avatarUrlが明示的に指定された場合のみ更新（削除の場合はnullを設定）
    if (formData.avatar === null || formData.avatar instanceof File) {
      updateData.avatar_url = avatarUrl;
    }

    // データベース関数を使用してプロフィールを更新
    // avatarUrlがnullの場合（削除）は明示的にnullを渡す
    // avatarUrlが文字列の場合（アップロード）は文字列を渡す
    // avatarUrlがnullでもundefinedでもない場合（未変更）は'NOT_SET'を渡す
    const avatarUrlParam = formData.avatar === null ? null : 
                          avatarUrl !== null ? avatarUrl : 'NOT_SET';
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('update_user_profile', {
        p_user_id: authUser.id,
        p_display_name: formData.display_name,
        p_bio: formData.bio,
        p_contact: formData.contact,
        p_avatar_url: avatarUrlParam
      });

    if (functionError) {
      console.error('Profile update function error:', {
        message: functionError.message || 'No message',
        code: functionError.code || 'No code',
        details: functionError.details || 'No details',
        hint: functionError.hint || 'No hint',
        fullError: functionError,
        errorType: typeof functionError,
        errorKeys: Object.keys(functionError || {}),
        errorStringified: JSON.stringify(functionError, null, 2)
      });
      
      return {
        success: false,
        error: `プロフィールの更新に失敗しました: ${functionError.message}`
      };
    }

    // 関数の結果をチェック
    if (!functionResult || functionResult.length === 0) {
      return {
        success: false,
        error: 'プロフィールの更新に失敗しました'
      };
    }

    const result = functionResult[0];
    if (!result.success) {
      return {
        success: false,
        error: result.message || 'プロフィールの更新に失敗しました'
      };
    }

    const profileData = result.profile_data;

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
    console.error('Profile update error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    };
  }
}

export async function getProfileClient(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    console.log('Starting getProfileClient...');
    console.log('Supabase client:', !!supabase);
    
    // 環境変数の確認
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    });
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth user:', authUser);
    console.log('Auth error:', authError);
    
    if (authError || !authUser) {
      console.error('Authentication failed:', {
        authError: authError ? {
          message: authError.message || 'No message',
          code: authError.code || 'No code',
          fullError: authError,
          errorType: typeof authError,
          errorKeys: Object.keys(authError || {}),
          errorStringified: JSON.stringify(authError, null, 2)
        } : null,
        hasUser: !!authUser,
        authUserType: typeof authUser
      });
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    console.log('Querying user_profiles table for user_id:', authUser.id);
    
    // データベース接続のテスト
    try {
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      console.log('Database connection test:', { testData, testError });
    } catch (testErr) {
      console.error('Database connection test failed:', testErr);
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (profileError) {
      // プロフィールが存在しない場合やエラーが発生した場合は認証情報からフォールバック
      console.log('Using fallback profile from auth data');
      
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        display_name: authUser.user_metadata?.display_name || 
                     authUser.user_metadata?.full_name || 
                     authUser.email?.split('@')[0] || 'ユーザー',
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
    console.error('Get profile error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    };
  }
}
