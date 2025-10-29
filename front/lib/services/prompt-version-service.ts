import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

/**
 * プロンプトバージョン関連のサービス
 * 
 * フェーズ2: サービスファイルを作成（まだ使用しない）
 * フェーズ1で作成した関数を在小グジュアルとして分離
 */

export interface PromptVersion {
  id: string;
  version: number;
}

/**
 * Service Role Keyを使用してRLSをバイパスするSupabaseクライアントを作成
 */
function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * プロンプトの最新バージョンを取得する
 * バージョンが存在しない場合は、自動的にバージョン1を作成します。
 * @param supabase Supabaseクライアント
 * @param promptId プロンプトID
 * @returns 最新のプロンプトバージョン
 * @throws プロンプトが存在しない、またはpublished状態でない場合にエラー
 */
export async function getLatestPromptVersion(
  supabase: SupabaseClient,
  promptId: string
): Promise<PromptVersion> {
  console.log('処理中のプロンプトID:', promptId);
  
  // Service Role Keyクライアントを作成（確実にバージョンを検索・作成するため）
  const supabaseAdmin = createServiceRoleClient();
  
  // まずバージョンを取得（Service Role Keyを使用）
  const { data: promptVersions, error: versionError } = await supabaseAdmin
    .from('prompt_versions')
    .select('id, version')
    .eq('prompt_id', promptId)
    .order('version', { ascending: false })
    .limit(1);

  console.log('バージョン取得結果:', { promptVersions, versionError });

  // バージョンが存在する場合は返す
  if (!versionError && promptVersions && promptVersions.length > 0) {
    const promptVersion = promptVersions[0];
    console.log('使用するバージョン:', promptVersion);
    return promptVersion;
  }

  // バージョンが存在しない場合、プロンプト情報を取得してバージョン1を作成
  console.log('バージョンが見つかりません。プロンプト情報を確認してバージョン1を作成します...');
  
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('id, title, short_description, long_description, status, created_at')
    .eq('id', promptId)
    .single();

  if (promptError || !prompt) {
    console.error('プロンプト取得エラー:', promptError);
    throw new Error(`プロンプトID ${promptId} が見つかりません`);
  }

  // プロンプトがpublished状態でない場合はエラー
  if (prompt.status !== 'published') {
    throw new Error(`プロンプトID ${promptId} は公開されていません（ステータス: ${prompt.status}）`);
  }

  // バージョン1を作成（Service Role Keyを使用してRLSをバイパス）
  console.log('バージョン1を作成中（Service Role Key使用）...');
  
  // 作成前に再度確認（競合状態を避けるため）
  const { data: existingVersions, error: checkError } = await supabaseAdmin
    .from('prompt_versions')
    .select('id, version')
    .eq('prompt_id', promptId)
    .order('version', { ascending: false })
    .limit(1);

  if (!checkError && existingVersions && existingVersions.length > 0) {
    console.log('バージョンが既に存在していました（競合回避）:', existingVersions[0]);
    return existingVersions[0];
  }

  // Service Role Keyでバージョンを作成
  const { data: newVersion, error: createError } = await supabaseAdmin
    .from('prompt_versions')
    .insert({
      prompt_id: prompt.id,
      version: 1,
      title_snapshot: prompt.title,
      description_snapshot: prompt.short_description || '',
      sample_output_snapshot: prompt.long_description || '',
      content_type: 'text',
      published_at: prompt.created_at || new Date().toISOString()
    })
    .select('id, version')
    .single();

  if (createError) {
    // UNIQUE制約違反の場合、再取得を試みる
    if (createError.code === '23505' || createError.message?.includes('duplicate key') || createError.message?.includes('UNIQUE')) {
      console.log('UNIQUE制約違反を検出。バージョンを再取得します...');
      const { data: retryVersions, error: retryError } = await supabaseAdmin
        .from('prompt_versions')
        .select('id, version')
        .eq('prompt_id', promptId)
        .order('version', { ascending: false })
        .limit(1);
      
      if (!retryError && retryVersions && retryVersions.length > 0) {
        console.log('バージョンを再取得しました:', retryVersions[0]);
        return retryVersions[0];
      }
    }
    
    console.error('バージョン作成エラー（詳細）:', {
      error: createError,
      code: createError.code,
      message: createError.message,
      details: createError.details,
      hint: createError.hint
    });
    throw new Error(`プロンプトID ${promptId} のバージョン作成に失敗しました: ${createError.message || '不明なエラー'}`);
  }

  if (!newVersion) {
    console.error('バージョン作成レスポンスが空です');
    throw new Error(`プロンプトID ${promptId} のバージョン作成に失敗しました: レスポンスが空です`);
  }

  console.log('バージョン1を作成しました:', newVersion);
  return newVersion;
}

/**
 * プロンプトバージョンが存在することを確認し、存在しない場合はエラーをスローする
 * @param supabase Supabaseクライアント
 * @param promptId プロンプトID
 * @returns 最新のプロンプトバージョン
 * @throws バージョンが見つからない場合にエラー
 */
export async function ensureVersionExists(
  supabase: SupabaseClient,
  promptId: string
): Promise<PromptVersion> {
  return getLatestPromptVersion(supabase, promptId);
}
