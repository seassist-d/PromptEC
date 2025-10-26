import { supabase } from './supabaseClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
}

/**
 * ファイルバリデーション
 */
function validateFile(file: File, maxSize: number, allowedTypes: string[]): string | null {
  // ファイルサイズチェック
  if (file.size > maxSize) {
    return `ファイルサイズは${(maxSize / 1024 / 1024).toFixed(0)}MB以下にしてください`;
  }

  // ファイルタイプチェック
  if (!allowedTypes.some(type => file.type.startsWith(type))) {
    return 'サポートされていないファイル形式です';
  }

  return null;
}

/**
 * プロンプトのサムネイル画像をアップロード
 */
export async function uploadPromptThumbnail(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // バリデーション
    const validationError = validateFile(
      file,
      5 * 1024 * 1024, // 5MB
      ['image/']
    );
    
    if (validationError) {
      return { success: false, error: validationError };
    }

    // ファイル名を生成（ユニークなファイル名）
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const fileName = `${userId}-${timestamp}-${random}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabase.storage
      .from('prompts-thumbnails')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('prompts-thumbnails')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      size: file.size
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: 'アップロードに失敗しました' };
  }
}

/**
 * プロンプトの添付ファイルをアップロード
 * @param file アップロードするファイル
 * @param userId ユーザーID
 * @param assetKind アセットの種類
 */
export async function uploadPromptAsset(
  file: File,
  userId: string,
  assetKind: 'attachment' | 'image' | 'text'
): Promise<UploadResult> {
  try {
    // ファイルサイズとタイプの設定
    const config = {
      attachment: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['application/', 'text/', 'image/']
      },
      image: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/']
      },
      text: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['text/']
      }
    };

    const { maxSize, allowedTypes } = config[assetKind];

    // バリデーション
    const validationError = validateFile(file, maxSize, allowedTypes);
    
    if (validationError) {
      return { success: false, error: validationError };
    }

    // ファイル名を生成
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const fileName = `${userId}-${timestamp}-${random}.${fileExt}`;
    const filePath = `${assetKind}s/${fileName}`;

    // Supabase Storageにアップロード
    const bucketName = 'prompt-assets';
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // URLを取得（非公開バケットなのでsigned URL）
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      size: file.size
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: 'アップロードに失敗しました' };
  }
}

/**
 * 複数のファイルをアップロード
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  assetKind: 'attachment' | 'image' | 'text'
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadPromptAsset(file, userId, assetKind))
  );
  return results;
}

/**
 * ファイルを削除
 */
export async function deletePromptFile(
  bucketName: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'ファイルの削除に失敗しました' };
  }
}

/**
 * チェックサムを計算（改ざん検知用）
 */
export async function calculateChecksum(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Checksum calculation error:', error);
    return '';
  }
}

/**
 * プレビュー画像を生成（FileReaderを使用）
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

