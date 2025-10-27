import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(
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

    const userId = params.userId;

    // ユーザープロフィール取得
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // メールアドレス取得
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    // 統計情報を並列取得
    const [promptsCount, ordersCount, revenue] = await Promise.all([
      // 作成したプロンプト数
      supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', userId),
      
      // 購入数
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', userId),
      
      // 売上（出品者の場合）
      supabase
        .from('ledger_entries')
        .select('amount_jpy')
        .eq('seller_id', userId)
        .eq('entry_type', 'seller_net')
    ]);

    // 売上合計を計算
    const totalRevenue = revenue.data?.reduce((sum, entry) => sum + entry.amount_jpy, 0) || 0;

    // 最近の管理アクション取得
    const { data: recentActions } = await supabase
      .from('admin_actions')
      .select('*')
      .eq('target_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile: userProfile,
      email: authUser?.user?.email,
      stats: {
        promptsCount: promptsCount.count || 0,
        ordersCount: ordersCount.count || 0,
        revenue: totalRevenue
      },
      recentActions: recentActions || []
    });

  } catch (error: any) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { error: error.message || 'ユーザー詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}
