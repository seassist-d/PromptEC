import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
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
    
    // 販売中のプロンプトを持つプロンプターを取得
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from('prompts')
      .select('seller_id, like_count, ratings_count, created_at, categories(id, name)')
      .eq('status', 'published')
      .eq('visibility', 'public');
    
    if (promptsError) {
      console.error('Error fetching prompts:', promptsError);
      return NextResponse.json(
        { message: 'プロンプトの取得に失敗しました', details: promptsError.message },
        { status: 500 }
      );
    }
    
    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ prompters: [] });
    }
    
    // 販売中のプロンプトを持つプロンプターのIDを取得
    const sellerIds = [...new Set(prompts.map(p => p.seller_id))];
    
    // 各プロンプターの購入回数を取得（order_itemsから集計、status='paid'の注文のみ）
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        prompt_id,
        prompts!order_items_prompt_id_fkey(
          seller_id,
          status,
          visibility
        ),
        orders!order_items_order_id_fkey(
          status
        )
      `)
      .eq('orders.status', 'paid')
      .in('prompts.seller_id', sellerIds);
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return NextResponse.json(
        { message: '購入情報の取得に失敗しました', details: orderItemsError.message },
        { status: 500 }
      );
    }
    
    // プロンプターごとに集計
    const bySeller: Record<string, {
      seller_id: string;
      totalLikes: number;
      totalReviews: number;
      totalPurchases: number;
      latestDate: string;
      categories: Record<string, number>;
    }> = {};
    
    // プロンプト情報から集計
    for (const p of prompts) {
      const s = p.seller_id;
      if (!bySeller[s]) {
        bySeller[s] = {
          seller_id: s,
          totalLikes: 0,
          totalReviews: 0,
          totalPurchases: 0,
          latestDate: p.created_at,
          categories: {}
        };
      }
      bySeller[s].totalLikes += p.like_count || 0;
      bySeller[s].totalReviews += p.ratings_count || 0;
      if (new Date(p.created_at) > new Date(bySeller[s].latestDate)) {
        bySeller[s].latestDate = p.created_at;
      }
      const catName = (p.categories as any)?.name || '未分類';
      bySeller[s].categories[catName] = (bySeller[s].categories[catName] || 0) + 1;
    }
    
    // 購入回数を集計（販売中のプロンプトのみカウント）
    if (orderItems) {
      for (const item of orderItems) {
        const prompts = item.prompts as any;
        const sellerId = prompts?.seller_id;
        const status = prompts?.status;
        const visibility = prompts?.visibility;
        
        // 販売中のプロンプトのみカウント
        if (sellerId && bySeller[sellerId] && status === 'published' && visibility === 'public') {
          bySeller[sellerId].totalPurchases += 1;
        }
      }
    }
    
    // 最終確認：各プロンプターが実際に販売中のプロンプトを持っているか確認
    const sellerIdsToCheck = Object.keys(bySeller);
    const { data: activePrompts, error: activePromptsError } = await supabaseAdmin
      .from('prompts')
      .select('seller_id')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .in('seller_id', sellerIdsToCheck);
    
    if (activePromptsError) {
      console.error('Error checking active prompts:', activePromptsError);
      // エラーが発生しても、既存のデータを返す
    }
    
    // 販売中のプロンプトを持つプロンプターのIDセットを作成
    const activeSellerIds = new Set(activePrompts?.map(p => p.seller_id) || []);
    
    // 販売中のプロンプトを持つプロンプターのみをフィルタリング
    const validSellers = Object.values(bySeller).filter(s => activeSellerIds.has(s.seller_id));
    
    // ソート順：購入回数 > いいね数 > 新着順
    const sellers = validSellers
      .sort((a, b) => {
        // 1. 購入回数でソート
        if (b.totalPurchases !== a.totalPurchases) {
          return b.totalPurchases - a.totalPurchases;
        }
        // 2. いいね数でソート
        if (b.totalLikes !== a.totalLikes) {
          return b.totalLikes - a.totalLikes;
        }
        // 3. 新着順でソート
        return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
      })
      .slice(0, 3)
      .map(s => ({
        seller_id: s.seller_id,
        display_name: `プロンプター ${s.seller_id.slice(0, 6)}`,
        totalLikes: s.totalLikes,
        totalReviews: s.totalReviews,
        totalPurchases: s.totalPurchases,
        latestDate: s.latestDate,
        specialty: Object.entries(s.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '未分類',
      }));
    
    return NextResponse.json({ prompters: sellers });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

