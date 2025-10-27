import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const actionFilter = searchParams.get('action');
    const actorFilter = searchParams.get('actor');
    const targetFilter = searchParams.get('target');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const offset = (page - 1) * limit;

    // ベースクエリ
    let query = supabase
      .from('admin_actions')
      .select(`
        id,
        actor_id,
        action,
        target_type,
        target_id,
        reason,
        metadata,
        created_at,
        actor:user_profiles!admin_actions_actor_id_fkey(
          user_id,
          display_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // フィルター適用
    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }

    if (actorFilter) {
      query = query.eq('actor_id', actorFilter);
    }

    if (targetFilter) {
      query = query.eq('target_id', targetFilter);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('アクション履歴取得エラー:', error);
      return NextResponse.json({ error: 'アクション履歴の取得に失敗しました' }, { status: 500 });
    }

    // アクションの日本語ラベルを付与
    const actionLabels: { [key: string]: string } = {
      'user_ban': 'ユーザーBAN',
      'user_unban': 'ユーザーBAN解除',
      'user_role_change': 'ロール変更',
      'prompt_approve': 'プロンプト承認',
      'prompt_reject': 'プロンプト却下',
      'prompt_suspend': 'プロンプト停止',
      'role_change': 'ロール変更',
    };

    const logs = (data || []).map(log => ({
      ...log,
      action_label: actionLabels[log.action] || log.action,
    }));

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error: any) {
    console.error('アクション履歴取得エラー:', error);
    return NextResponse.json(
      { error: 'アクション履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

