'use server';

import { createClient } from './supabase-server';

export interface PromptFileUploadResult {
  success: boolean;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  assetData?: Array<{
    url: string;
    path: string;
    size: number;
    kind: string;
  }>;
  error?: string;
}

export interface CreatePromptData {
  title: string;
  description: string;
  content: string;
  category_id: number;
  price: number;
  tags?: string[];
  thumbnailFile?: File;
}

/**
 * プロンプトのファイルアップロード処理
 */
export async function uploadPromptFiles(
  userId: string,
  thumbnailFile?: File,
  assetFiles?: File[]
): Promise<PromptFileUploadResult> {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '認証が必要です' };
    }

    // サムネイル画像のアップロード
    const thumbnailUrl = thumbnailFile
      ? await uploadThumbnail(supabase, thumbnailFile, userId)
      : undefined;

    // 添付ファイルのアップロード
    const assetData = assetFiles && assetFiles.length > 0
      ? await uploadAssets(supabase, assetFiles, userId)
      : undefined;

    return {
      success: true,
      thumbnailUrl,
      thumbnailPath: thumbnailUrl ? extractFilePath(thumbnailUrl) : undefined,
      assetData
    };
  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, error: 'ファイルのアップロードに失敗しました' };
  }
}

/**
 * サムネイル画像をアップロード
 */
async function uploadThumbnail(
  supabase: any,
  file: File,
  userId: string
): Promise<string> {
  // ファイルバリデーション
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選択してください');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('ファイルサイズは5MB以下にしてください');
  }

  // ファイル名を生成
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `thumbnails/${fileName}`;

  // アップロード
  const { error } = await supabase.storage
    .from('prompts-thumbnails')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  // 公開URLを取得
  const { data } = supabase.storage
    .from('prompts-thumbnails')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 添付ファイルをアップロード
 */
async function uploadAssets(
  supabase: any,
  files: File[],
  userId: string
): Promise<Array<{ url: string; path: string; size: number; kind: string }>> {
  const results: Array<{ url: string; path: string; size: number; kind: string }> = [];
  
  for (const file of files) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      // ファイルタイプに基づいてパスを決定
      const kind = file.type.startsWith('image/') ? 'images' : 'attachments';
      const filePath = `${kind}/${fileName}`;

      // アップロード
      const { error } = await supabase.storage
        .from('prompt-assets')
        .upload(filePath, file);

      if (!error) {
        const { data } = supabase.storage
          .from('prompt-assets')
          .getPublicUrl(filePath);

        results.push({
          url: data.publicUrl,
          path: filePath,
          size: file.size,
          kind: file.type.startsWith('image/') ? 'image' : 'attachment'
        });
      }
    } catch (error) {
      console.error('Individual file upload error:', error);
    }
  }

  return results;
}

/**
 * URLからファイルパスを抽出
 */
function extractFilePath(url: string): string {
  const match = url.match(/prompts-thumbnails\/(.+)$/);
  return match ? match[1] : '';
}

/**
 * プロンプトを作成（サーバーアクション）
 */
export async function createPromptWithFiles(
  data: CreatePromptData
): Promise<{ success: boolean; promptId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '認証が必要です' };
    }

    // サムネイル画像のアップロード
    let thumbnailUrl = '';
    if (data.thumbnailFile) {
      const thumbnailResult = await uploadThumbnail(supabase, data.thumbnailFile, user.id);
      thumbnailUrl = thumbnailResult;
    }

    // スラッグを生成
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // プロンプトを作成
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        title: data.title,
        short_description: data.description,
        long_description: data.content,
        category_id: data.category_id,
        price_jpy: data.price,
        seller_id: user.id,
        thumbnail_url: thumbnailUrl,
        slug: `${slug}-${Date.now()}`,
        status: 'published',
        visibility: 'public'
      })
      .select()
      .single();

    if (promptError) {
      console.error('Prompt creation error:', promptError);
      return { success: false, error: promptError.message };
    }

    // タグの処理
    if (data.tags && data.tags.length > 0) {
      // TODO: タグの処理を実装
    }

    return { success: true, promptId: prompt.id };
  } catch (error) {
    console.error('Create prompt error:', error);
    return { success: false, error: 'プロンプトの作成に失敗しました' };
  }
}

