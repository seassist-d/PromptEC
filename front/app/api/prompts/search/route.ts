import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータを取得
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const supabase = await createClient();
    
    // データベースのsearch_prompts関数を使用
    const { data, error } = await supabase.rpc('search_prompts', {
      search_query: query,
      category_filter: category ? parseInt(category) : null,
      min_price: minPrice ? parseInt(minPrice) : null,
      max_price: maxPrice ? parseInt(maxPrice) : null,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit_count: limit,
      offset_count: (page - 1) * limit,
    });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: '検索に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    // 総件数を取得（別クエリ）
    let countQuery = supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (query) {
      countQuery = countQuery.or(
        `title.ilike.%${query}%,short_description.ilike.%${query}%,long_description.ilike.%${query}%`
      );
    }
    if (category) {
      countQuery = countQuery.eq('category_id', parseInt(category));
    }
    if (minPrice) {
      countQuery = countQuery.gte('price_jpy', parseInt(minPrice));
    }
    if (maxPrice) {
      countQuery = countQuery.lte('price_jpy', parseInt(maxPrice));
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      prompts: data || [],
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
