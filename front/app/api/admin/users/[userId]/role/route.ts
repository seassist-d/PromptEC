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

    const { newRole, reason } = await request.json();

    if (!newRole || !['user', 'seller', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: '無効なロールです' }, { status: 400 });
    }

    // 現在のロールを取得
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', params.userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // ロール変更
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', params.userId);

    if (updateError) throw updateError;

    // 管理者アクションを記録
    await supabase.from('admin_actions').insert({
      actor_id: user.id,
      action: 'role_change',
      target_type: 'user',
      target_id: params.userId,
      reason: reason || '管理者によるロール変更',
      metadata: {
        from_role: targetUser.role,
        to_role: newRole,
        changed_at: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      message: 'ロールを変更しました',
      newRole 
    });

  } catch (error: any) {
    console.error('Role change error:', error);
    return NextResponse.json(
      { error: error.message || 'ロール変更に失敗しました' },
      { status: 500 }
    );
  }
}
