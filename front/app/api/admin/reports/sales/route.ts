import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30days';
    const sellerId = searchParams.get('seller_id');

    const dateRange = getDateRange(period);
    const previousDateRange = getPreviousDateRange(period);

    // 現期間のデータ
    const { data: salesOrders } = await supabase
      .from('orders')
      .select('id, order_number, total_amount_jpy, created_at, buyer_id, status')
      .eq('status', 'paid')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const totalRevenue = salesOrders?.reduce((sum, order) => sum + order.total_amount_jpy, 0) || 0;
    const totalOrders = salesOrders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 前期間のデータ
    const { data: previousSalesOrders } = await supabase
      .from('orders')
      .select('id, order_number, total_amount_jpy, created_at, buyer_id, status')
      .eq('status', 'paid')
      .gte('created_at', previousDateRange.start)
      .lte('created_at', previousDateRange.end);

    const previousTotalRevenue = previousSalesOrders?.reduce((sum, order) => sum + order.total_amount_jpy, 0) || 0;
    const previousTotalOrders = previousSalesOrders?.length || 0;
    const previousAverageOrderValue = previousTotalOrders > 0 ? Math.round(previousTotalRevenue / previousTotalOrders) : 0;

    // 前期間のプラットフォーム手数料
    const { data: previousPlatformFees } = await supabase
      .from('ledger_entries')
      .select('amount_jpy')
      .eq('entry_type', 'platform_fee')
      .gte('created_at', previousDateRange.start)
      .lte('created_at', previousDateRange.end);

    const previousPlatformFee = previousPlatformFees?.reduce((sum, fee) => sum + Math.abs(fee.amount_jpy), 0) || 0;

    // 増減率計算
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('id, entry_type, seller_id, amount_jpy, created_at, order_id, order_item_id, user_profiles!ledger_entries_seller_id_fkey(display_name, user_id)')
      .eq('entry_type', 'seller_net')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const sellerSales = calculateSellerSales(ledgerEntries || [], sellerId);
    const promptSales = await calculatePromptSales(supabase, dateRange, sellerId);
    const trends = calculateTrends(salesOrders || [], period);

    const { data: platformFees } = await supabase
      .from('ledger_entries')
      .select('amount_jpy')
      .eq('entry_type', 'platform_fee')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const totalPlatformFee = platformFees?.reduce((sum, fee) => sum + Math.abs(fee.amount_jpy), 0) || 0;

    const { data: paymentFees } = await supabase
      .from('ledger_entries')
      .select('amount_jpy')
      .eq('entry_type', 'payment_fee')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const totalPaymentFee = paymentFees?.reduce((sum, fee) => sum + Math.abs(fee.amount_jpy), 0) || 0;
    const totalSellerPayout = sellerSales.reduce((sum, seller) => sum + seller.total_revenue, 0);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalPlatformFee,
        totalPaymentFee,
        totalSellerPayout,
        platformRevenue: totalPlatformFee,
        period,
        growthRate: {
          revenue: calculateGrowthRate(totalRevenue, previousTotalRevenue),
          orders: calculateGrowthRate(totalOrders, previousTotalOrders),
          averageOrderValue: calculateGrowthRate(averageOrderValue, previousAverageOrderValue),
          platformRevenue: calculateGrowthRate(totalPlatformFee, previousPlatformFee)
        },
        previousPeriod: {
          totalRevenue: previousTotalRevenue,
          totalOrders: previousTotalOrders,
          averageOrderValue: previousAverageOrderValue,
          platformRevenue: previousPlatformFee
        }
      },
      sellerSales,
      promptSales,
      trends,
      breakdown: {
        totalSales: totalRevenue,
        platformFee: totalPlatformFee,
        paymentFee: totalPaymentFee,
        sellerNet: totalSellerPayout
      }
    });
  } catch (error: any) {
    console.error('Sales report error:', error);
    return NextResponse.json({ error: error.message || '売上レポートの取得に失敗しました' }, { status: 500 });
  }
}

function getDateRange(period: string) {
  const now = new Date();
  let start = new Date();
  switch(period) {
    case '7days': start.setDate(now.getDate() - 7); break;
    case '30days': start.setDate(now.getDate() - 30); break;
    case 'month': start.setMonth(now.getMonth() - 1); break;
    case 'year': start.setFullYear(now.getFullYear() - 1); break;
    default: start.setDate(now.getDate() - 30);
  }
  return { start: start.toISOString(), end: now.toISOString() };
}

function getPreviousDateRange(period: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  
  switch(period) {
    case '7days':
      // 前7日間: 14日前から7日前まで
      start.setDate(now.getDate() - 14);
      end.setDate(now.getDate() - 7);
      break;
    case '30days':
      // 前30日間: 60日前から30日前まで
      start.setDate(now.getDate() - 60);
      end.setDate(now.getDate() - 30);
      break;
    case 'month':
      // 前月: 2ヶ月前から1ヶ月前まで
      start.setMonth(now.getMonth() - 2);
      end.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      // 前年: 2年前から1年前まで
      start.setFullYear(now.getFullYear() - 2);
      end.setFullYear(now.getFullYear() - 1);
      break;
    default:
      // デフォルトは前30日間
      start.setDate(now.getDate() - 60);
      end.setDate(now.getDate() - 30);
  }
  
  return { start: start.toISOString(), end: end.toISOString() };
}

function calculateSellerSales(ledgerEntries: any[], sellerId?: string | null) {
  const salesBySeller = new Map<string, { display_name: string; user_id: string; total_revenue: number; order_count: number; }>();
  ledgerEntries.forEach(entry => {
    if (sellerId && entry.seller_id !== sellerId) return;
    const sellerIdKey = entry.seller_id;
    if (!sellerIdKey) return;
    const current = salesBySeller.get(sellerIdKey) || {
      display_name: entry.user_profiles?.display_name || '不明',
      user_id: entry.seller_id,
      total_revenue: 0,
      order_count: 0
    };
    salesBySeller.set(sellerIdKey, {
      ...current,
      total_revenue: current.total_revenue + entry.amount_jpy,
      order_count: current.order_count + 1
    });
  });
  return Array.from(salesBySeller.values())
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .map((seller, index) => ({ ...seller, rank: index + 1 }));
}

async function calculatePromptSales(supabase: any, dateRange: { start: string; end: string }, sellerId?: string | null) {
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('prompt_id, unit_price_jpy, quantity, created_at, prompts!order_items_prompt_id_fkey(id, title, price_jpy, seller_id), orders!order_items_order_id_fkey(status)')
    .eq('orders.status', 'paid')
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  const salesByPrompt = new Map<string, { prompt_id: string; title: string; total_sales: number; order_count: number; average_price: number; }>();
  orderItems?.forEach(item => {
    if (sellerId && item.prompts?.seller_id !== sellerId) return;
    const promptId = item.prompt_id;
    if (!promptId) return;
    const current = salesByPrompt.get(promptId) || {
      prompt_id: promptId,
      title: item.prompts?.title || '不明',
      total_sales: 0,
      order_count: 0,
      average_price: 0
    };
    const itemRevenue = item.unit_price_jpy * item.quantity;
    salesByPrompt.set(promptId, {
      ...current,
      total_sales: current.total_sales + itemRevenue,
      order_count: current.order_count + 1
    });
  });
  salesByPrompt.forEach((query) => { query.average_price = Math.round(query.total_sales / query.order_count); });
  return Array.from(salesByPrompt.values())
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 50)
    .map((prompt, index) => ({ ...prompt, rank: index + 1 }));
}

function calculateTrends(orders: any[], period: string) {
  if (orders.length === 0) return [];
  let groupByFunction: (date: Date) => string;
  let dateFormatFunction: (date: string) => string;
  if (period === 'year') {
    groupByFunction = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    dateFormatFunction = (dateStr: string) => {
      const [year, month] = dateStr.split('-');
      return `${year}年${month}月`;
    };
  } else if (period === 'month') {
    groupByFunction = (date: Date) => {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    };
    dateFormatFunction = (dateStr: string) => `${dateStr}週`;
  } else {
    groupByFunction = (date: Date) => date.toISOString().split('T')[0];
    dateFormatFunction = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
  }
  const revenueByDate = new Map<string, number>();
  orders.forEach(order => {
    const dateStr = groupByFunction(new Date(order.created_at));
    const current = revenueByDate.get(dateStr) || 0;
    revenueByDate.set(dateStr, current + order.total_amount_jpy);
  });
  return Array.from(revenueByDate.entries())
    .map(([dateKey, revenue]) => ({ date: dateFormatFunction(dateKey), revenue, dateKey }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
