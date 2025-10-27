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

    // BAN解除
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_banned: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', params.userId);

    if (error) throw error;

    // 管理者アクションを記録
    await supabase.from('admin_actions').insert({
      actor_id: user.id,
      action: 'user_unban',
      target_type: 'user',
      target_id: params.userId,
      reason: reason || '管理者によるBAN解除',
      metadata: {
        unbanned_at: new Date().toISOString()
      }
    });

    return NextResponse.json({ message: 'BANを解除しました' });

  } catch (error: any) {
    console.error('Unban user error:', error);
    return NextResponse.json(
      { error: error.message || 'BAN解除に失敗しました' },
      { status: 500 }
    );
  }
}
