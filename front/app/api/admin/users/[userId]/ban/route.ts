import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    const { reason } = await request.json();

    // ユーザーをBAN
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_banned: true })
      .eq('user_id', params.userId);

    if (error) throw error;

    // 管理者アクションを記録
    await supabase.from('admin_actions').insert({
      actor_id: user.id,
      action: 'user_ban',
      target_type: 'user',
      target_id: params.userId,
      reason
    });

    return NextResponse.json({ message: 'ユーザーをBANしました' });

  } catch (error: any) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: error.message || 'ユーザーBANに失敗しました' },
      { status: 500 }
    );
  }
}

