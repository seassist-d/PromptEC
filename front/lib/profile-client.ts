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

    // アバターがアップロードされた場合のみ更新
    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    // データベース関数を使用してプロフィールを更新
    const { data: functionResult, error: functionError } = await supabase
      .rpc('update_user_profile', {
        p_user_id: authUser.id,
        p_display_name: formData.display_name,
        p_bio: formData.bio,
        p_contact: formData.contact,
        p_avatar_url: avatarUrl || null
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
    
    console.log('Profile query result:', { 
      profileData, 
      profileError,
      profileDataKeys: profileData ? Object.keys(profileData) : null,
      profileErrorKeys: profileError ? Object.keys(profileError) : null
    });

    if (profileError) {
      // デバッグ: エラーの詳細を一度だけ確認（この後削除予定）
      console.log('[DEBUG] profileError type:', typeof profileError);
      console.log('[DEBUG] profileError keys:', Object.keys(profileError));
      console.log('[DEBUG] profileError values:', Object.values(profileError));
      console.log('[DEBUG] profileError JSON:', JSON.stringify(profileError));
      console.log('[DEBUG] profileError.code:', profileError.code);
      console.log('[DEBUG] profileError.message:', profileError.message);
      console.log('[DEBUG] profileError.details:', profileError.details);
      
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
      
      console.log('Created fallback user:', fallbackUser);
      
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
