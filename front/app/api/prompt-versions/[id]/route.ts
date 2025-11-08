import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;

    // Service Role Keyを使用してRLSをバイパス
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // プロンプトバージョンを取得（Service Role Keyを使用）
    const { data: promptVersion, error: versionError } = await supabaseAdmin
      .from('prompt_versions')
      .select(`
        id,
        version,
        title_snapshot,
        prompts (
          id,
          title,
          slug,
          thumbnail_url,
          short_description
        )
      `)
      .eq('id', id)
      .single();

    if (versionError) {
      console.error('プロンプトバージョン取得エラー:', versionError);
      return NextResponse.json(
        { error: 'プロンプトバージョンが見つかりません', details: versionError.message },
        { status: 404 }
      );
    }

    if (!promptVersion) {
      return NextResponse.json(
        { error: 'プロンプトバージョンが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(promptVersion);

  } catch (error) {
    console.error('プロンプトバージョン取得エラー:', error);
    return NextResponse.json(
      { error: 'プロンプトバージョンの取得に失敗しました' },
      { status: 500 }
    );
  }
}

