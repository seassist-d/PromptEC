import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Categories API] Starting categories fetch...');
    const supabase = await createClient();
    console.log('[Categories API] Supabase client created');
    
    // カテゴリデータを取得
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true });

    console.log('[Categories API] Query result:', { categories, error });

    if (error) {
      console.error('Categories fetch error:', error);
      return NextResponse.json(
        { error: 'カテゴリの取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Categories API] Returning categories:', categories?.length || 0);
    return NextResponse.json({
      categories: categories || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
