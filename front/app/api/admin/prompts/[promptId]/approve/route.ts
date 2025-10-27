import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * PUT: プロンプト承認/拒否/停止（管理者用）
 * Body: { action: 'approve' | 'reject' | 'suspend', reason?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const supabase = await createClient();
    const { promptId } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: 'approve', 'reject', 'suspend'

    // 認証・管理者チェック
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // アクションに応じたステータス決定
    let newStatus: string;
    let adminAction: string;

    switch (action) {
      case 'approve':
        newStatus = 'published';
        adminAction = 'prompt_approve';
        break;
      case 'reject':
        newStatus = 'deleted';
        adminAction = 'prompt_remove';
        break;
      case 'suspend':
        newStatus = 'suspended';
        adminAction = 'prompt_suspend';
        break;
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

    // プロンプトの存在確認
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, title, status, seller_id')
      .eq('id', promptId)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // ステータス更新
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', promptId)
      .select()
      .single();

    if (updateError) {
      console.error('プロンプト更新エラー:', updateError);
      throw updateError;
    }

    // 管理者アクションログ記録
    try {
      await supabase.from('admin_actions').insert({
        actor_id: user.id,
        action: adminAction,
        target_type: 'prompt',
        target_id: promptId,
        reason: reason || null
      });
    } catch (logError) {
      console.error('ログ記録エラー:', logError);
      // ログ記録の失敗は致命エラーとしない
    }

    return NextResponse.json({
      message: action === 'approve' ? 'プロンプトを承認しました' 
               : action === 'suspend' ? 'プロンプトを停止しました' 
               : 'プロンプトを削除しました',
      prompt: updatedPrompt
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'エラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

