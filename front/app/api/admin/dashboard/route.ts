import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーロール確認
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限がありません' },
        { status: 403 }
      );
    }

    // ダッシュボード統計を取得
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

    if (error) throw error;

    // 追加の統計情報を取得
    const [recentOrders, recentUsers, recentPrompts] = await Promise.all([
      // 最近の注文
      supabase
        .from('orders')
        .select('id, order_number, total_amount_jpy, created_at, buyer_id, status')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // 最近のユーザー
      supabase
        .from('user_profiles')
        .select('user_id, display_name, created_at, role')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // 審査待ちプロンプト
      supabase
        .from('prompts')
        .select('id, title, seller_id, status, created_at')
        .in('status', ['draft', 'suspended'])
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return NextResponse.json({
      stats: data,
      recentOrders: recentOrders.data || [],
      recentUsers: recentUsers.data || [],
      recentPrompts: recentPrompts.data || []
    });

  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: error.message || '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
