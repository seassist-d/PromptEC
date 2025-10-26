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
    
    // プロンプトとカテゴリ情報を一緒に取得
    let supabaseQuery = supabase
      .from('prompts')
      .select(`
        id,
        title,
        slug,
        seller_id,
        category_id,
        thumbnail_url,
        price_jpy,
        short_description,
        avg_rating,
        ratings_count,
        view_count,
        created_at,
        categories(id, name, slug)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public');

    // 検索クエリの適用
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,short_description.ilike.%${query}%,long_description.ilike.%${query}%`
      );
    }

    // カテゴリフィルター
    if (category) {
      supabaseQuery = supabaseQuery.eq('category_id', parseInt(category));
    }

    // 価格フィルター
    if (minPrice) {
      supabaseQuery = supabaseQuery.gte('price_jpy', parseInt(minPrice));
    }
    if (maxPrice) {
      supabaseQuery = supabaseQuery.lte('price_jpy', parseInt(maxPrice));
    }

    // ソート
    switch (sortBy) {
      case 'price':
        supabaseQuery = supabaseQuery.order('price_jpy', { ascending: sortOrder === 'ASC' });
        break;
      case 'rating':
        supabaseQuery = supabaseQuery.order('avg_rating', { ascending: sortOrder === 'ASC' });
        break;
      case 'views':
        supabaseQuery = supabaseQuery.order('view_count', { ascending: sortOrder === 'ASC' });
        break;
      default:
        supabaseQuery = supabaseQuery.order('created_at', { ascending: sortOrder === 'ASC' });
    }

    // ページネーション
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    // 検索実行
    const { data, error } = await supabaseQuery;

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

    // レスポンス形式を統一（カテゴリ情報を含む）
    const formattedResults = (data || []).map(prompt => {
      // categories が配列の場合は最初の要素を取得、そうでなければそのまま使用
      const category = Array.isArray(prompt.categories) 
        ? prompt.categories[0] 
        : prompt.categories;
      
      return {
        id: prompt.id,
        title: prompt.title,
        slug: prompt.slug,
        seller_id: prompt.seller_id,
        category_id: prompt.category_id,
        category_name: category?.name || '未分類',
        category_slug: category?.slug || '',
        thumbnail_url: prompt.thumbnail_url,
        price_jpy: prompt.price_jpy,
        short_description: prompt.short_description,
        avg_rating: prompt.avg_rating,
        ratings_count: prompt.ratings_count || 0,
        view_count: prompt.view_count || 0,
        created_at: prompt.created_at,
        rank: 0 // 基本検索ではランクは0
      };
    });

    return NextResponse.json({
      prompts: formattedResults,
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
