import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // カテゴリデータを取得
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Categories fetch error:', error);
      return NextResponse.json(
        { error: 'カテゴリの取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

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
