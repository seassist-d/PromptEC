import { supabase } from './supabaseClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
}

export interface UploadProgress {
  progress: number; // 0-100
  status: 'uploading' | 'complete' | 'error';
  message?: string;
}

/**
 * プロンプトのサムネイル画像をアップロード（プログレスバー付き）
 */
export async function uploadPromptThumbnailWithProgress(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // バリデーション
    if (!file.type.startsWith('image/')) {
      return { success: false, error: '画像ファイルを選択してください' };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'ファイルサイズは5MB以下にしてください' };
    }

    // ファイル名を生成
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const fileName = `${userId}-${timestamp}-${random}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    // 進捗コールバックの設定（Simulated進捗）
    let progress = 0;
    const progressInterval = onProgress ? setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 90) progress = 90;
      onProgress({
        progress,
        status: 'uploading',
        message: `アップロード中... ${Math.round(progress)}%`,
      });
    }, 200) : null;

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabase.storage
      .from('prompts-thumbnails')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    // 進捗コールバックをクリア
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // 完了状態を通知
    if (onProgress) {
      if (uploadError) {
        onProgress({
          progress: 100,
          status: 'error',
          message: 'アップロードに失敗しました',
        });
      } else {
        onProgress({
          progress: 100,
          status: 'complete',
          message: 'アップロード完了',
        });
      }
    }

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
    if (onProgress) {
      onProgress({
        progress: 100,
        status: 'error',
        message: 'アップロードに失敗しました',
      });
    }
    return { success: false, error: 'アップロードに失敗しました' };
  }
}

