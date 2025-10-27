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

    // 過去30日のデータを取得
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ユーザー数推移（日別）
    const { data: userTrends } = await supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // 注文推移（日別）
    const { data: orderTrends } = await supabase
      .from('orders')
      .select('created_at, total_amount_jpy')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // 前週との比較用データ
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { count: usersThisWeek } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    const { count: usersLastWeek } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', oneWeekAgo.toISOString());

    // 売上前週比
    const { data: revenueThisWeek } = await supabase
      .from('orders')
      .select('total_amount_jpy')
      .gte('created_at', oneWeekAgo.toISOString())
      .eq('status', 'paid');

    const { data: revenueLastWeek } = await supabase
      .from('orders')
      .select('total_amount_jpy')
      .gte('created_at', new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', oneWeekAgo.toISOString())
      .eq('status', 'paid');

    const revenueThisWeekTotal = revenueThisWeek?.reduce((sum, o) => sum + o.total_amount_jpy, 0) || 0;
    const revenueLastWeekTotal = revenueLastWeek?.reduce((sum, o) => sum + o.total_amount_jpy, 0) || 0;

    // 日別にデータを集計
    const userCountsByDate = new Map<string, number>();
    const revenueByDate = new Map<string, number>();

    // 過去30日分の日付を初期化
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      userCountsByDate.set(dateStr, 0);
      revenueByDate.set(dateStr, 0);
    }

    // ユーザー数集計（日別の新規登録数）
    userTrends?.forEach(user => {
      const dateStr = new Date(user.created_at).toISOString().split('T')[0];
      const currentCount = userCountsByDate.get(dateStr) || 0;
      userCountsByDate.set(dateStr, currentCount + 1);
    });

    // 売上集計
    orderTrends?.forEach(order => {
      const dateStr = new Date(order.created_at).toISOString().split('T')[0];
      const current = revenueByDate.get(dateStr) || 0;
      revenueByDate.set(dateStr, current + order.total_amount_jpy);
    });

    const userTrendData = Array.from(userCountsByDate.entries()).map(([date, count]) => ({
      date,
      count
    }));

    const revenueTrendData = Array.from(revenueByDate.entries()).map(([date, amount]) => ({
      date,
      amount
    }));

    // 前週比計算
    const usersWeekOverWeek = usersLastWeek && usersLastWeek > 0 
      ? ((usersThisWeek || 0) - usersLastWeek) / usersLastWeek * 100 
      : 0;

    const revenueWeekOverWeek = revenueLastWeekTotal > 0
      ? ((revenueThisWeekTotal - revenueLastWeekTotal) / revenueLastWeekTotal) * 100
      : 0;

    // トッププロンプト（売上順）
    const { data: topPrompts } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        view_count
      `)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5);

    // トップ出品者（売上順）
    const { data: topSellers } = await supabase
      .from('orders')
      .select(`
        order_items!inner(
          prompt_id,
          prompts!inner(
            seller_id,
            user_profiles!inner(
              display_name
            )
          )
        )
      `)
      .eq('status', 'paid');

    // 出品者別売上集計
    const sellerRevenue = new Map<string, { name: string; revenue: number }>();
    topSellers?.forEach(order => {
      const sellerId = order.order_items[0]?.prompts?.seller_id;
      const sellerName = order.order_items[0]?.prompts?.user_profiles?.display_name || '不明';
      if (sellerId) {
        const current = sellerRevenue.get(sellerId) || { name: sellerName, revenue: 0 };
        sellerRevenue.set(sellerId, { ...current, revenue: current.revenue + 1 }); // 売上数で簡易集計
      }
    });

    const topSellersData = Array.from(sellerRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      trends: {
        users: userTrendData,
        revenue: revenueTrendData
      },
      comparisons: {
        usersWeekOverWeek: Math.round(usersWeekOverWeek * 10) / 10,
        revenueWeekOverWeek: Math.round(revenueWeekOverWeek * 10) / 10
      },
      rankings: {
        topPrompts: topPrompts?.map((p, idx) => ({
          id: p.id,
          title: p.title,
          sales: p.view_count // 仮の売上データ（実際の購入数が必要）
        })) || [],
        topSellers: topSellersData
      }
    });

  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error.message || '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

