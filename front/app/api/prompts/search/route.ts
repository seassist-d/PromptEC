import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータを取得
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'like_count';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Service Role Keyを使用してRLSをバイパス
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
    
    // プロンプトとカテゴリ情報を一緒に取得
    let supabaseQuery = supabaseAdmin
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
        like_count,
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
    let categoryId: number | null = null;
    if (category) {
      // カテゴリーパラメータが数値か文字列かを判定
      const parsedCategoryId = parseInt(category);
      if (!isNaN(parsedCategoryId)) {
        // 数値の場合はそのまま使用
        categoryId = parsedCategoryId;
      } else {
        // カテゴリー名のマッピング（UIで使用される名前 → データベースの名前）
        const categoryNameMap: Record<string, string> = {
          'ライター・編集者': 'ライティング',
          '営業・カスタマーサポート': 'ビジネス',
          'デザイナー・クリエイター': 'デザイン',
          'プログラマー・開発者': 'プログラミング',
          '人事・採用担当': 'ビジネス',
          '経営者・マネージャー': 'ビジネス',
          '金融・会計': 'ビジネス',
          'マーケティング・広告': 'ビジネス',
          '医療・ヘルスケア': 'その他',
          '研究・開発': '分析',
        };
        
        // マッピングされたカテゴリー名を取得
        const mappedCategoryName = categoryNameMap[category] || category;
        
        // まず、完全一致で検索（マッピングされた名前）
        let { data: categoryData, error: categoryError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('name', mappedCategoryName)
          .single();
        
        // 完全一致が見つからない場合、部分一致で検索（マッピングされた名前）
        if (categoryError || !categoryData) {
          const { data: partialMatch } = await supabaseAdmin
            .from('categories')
            .select('id, name')
            .ilike('name', `%${mappedCategoryName}%`)
            .limit(1);
          
          if (partialMatch && partialMatch.length > 0) {
            categoryData = partialMatch[0];
            categoryError = null;
          }
        }
        
        // まだ見つからない場合、元の名前で完全一致検索
        if (categoryError || !categoryData) {
          const { data: directCategoryData } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('name', category)
            .single();
          
          if (directCategoryData) {
            categoryData = directCategoryData;
            categoryError = null;
          }
        }
        
        // まだ見つからない場合、元の名前で部分一致検索
        if (categoryError || !categoryData) {
          const { data: partialDirectMatch } = await supabaseAdmin
            .from('categories')
            .select('id, name')
            .ilike('name', `%${category}%`)
            .limit(1);
          
          if (partialDirectMatch && partialDirectMatch.length > 0) {
            categoryData = partialDirectMatch[0];
            categoryError = null;
          }
        }
        
        if (categoryError && !categoryData) {
          console.error('Category lookup error:', categoryError);
          console.log('Looking for category name:', mappedCategoryName, 'or', category);
        }
        
        if (categoryData) {
          categoryId = categoryData.id;
          console.log('Found category ID:', categoryId, 'for name:', category);
        } else {
          console.warn('Category ID not found for:', category);
        }
      }
      
      if (categoryId !== null) {
        supabaseQuery = supabaseQuery.eq('category_id', categoryId);
      } else {
        console.warn('Category ID not found for:', category, '- filtering will not be applied');
      }
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
      case 'likes':
      case 'like_count':
        supabaseQuery = supabaseQuery.order('like_count', { ascending: sortOrder === 'ASC' });
        break;
      case 'created_at':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: sortOrder === 'ASC' });
        break;
      default:
        // デフォルトはいいね数順
        supabaseQuery = supabaseQuery.order('like_count', { ascending: sortOrder === 'ASC' });
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
    let countQuery = supabaseAdmin
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (query) {
      countQuery = countQuery.or(
        `title.ilike.%${query}%,short_description.ilike.%${query}%,long_description.ilike.%${query}%`
      );
    }
    if (categoryId !== null) {
      countQuery = countQuery.eq('category_id', categoryId);
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
    // カテゴリーIDからUIカテゴリー名へのマッピング（SearchFilters.tsxの固定リストと一致）
    const categoryIdToUiNameMap: Record<number, string> = {
      1: 'ライター・編集者',
      2: '営業・カスタマーサポート',
      3: 'デザイナー・クリエイター',
      4: 'プログラマー・開発者',
      5: '人事・採用担当',
      6: '経営者・マネージャー',
      7: '金融・会計',
      8: 'マーケティング・広告',
      9: '医療・ヘルスケア',
      10: '研究・開発',
    };
    
    const formattedResults = (data || []).map(prompt => {
      // categories が配列の場合は最初の要素を取得、そうでなければそのまま使用
      const category = Array.isArray(prompt.categories) 
        ? prompt.categories[0] 
        : prompt.categories;
      
      // category_idに基づいてUIカテゴリー名を取得
      // マッピングにない場合は、データベースのカテゴリー名をそのまま使用
      const uiCategoryName = categoryIdToUiNameMap[prompt.category_id] || category?.name || '未分類';
      
      return {
        id: prompt.id,
        title: prompt.title,
        slug: prompt.slug,
        seller_id: prompt.seller_id,
        category_id: prompt.category_id,
        category_name: uiCategoryName,
        category_slug: category?.slug || '',
        thumbnail_url: prompt.thumbnail_url,
        price_jpy: prompt.price_jpy,
        short_description: prompt.short_description,
        avg_rating: prompt.avg_rating,
        ratings_count: prompt.ratings_count || 0,
        view_count: prompt.view_count || 0,
        like_count: prompt.like_count || 0,
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
