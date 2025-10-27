import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * DELETE /api/reviews/[id]
 * レビューを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // レビューを取得して所有者か確認
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, buyer_id, prompt_id')
      .eq('id', id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'レビューが見つかりません' },
        { status: 404 }
      );
    }

    if (review.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'このレビューを削除する権限がありません' },
        { status: 403 }
      );
    }

    // レビューを削除（論理削除: statusを'removed'に更新）
    const { error: deleteError } = await supabase
      .from('reviews')
      .update({
        status: 'removed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('レビュー削除エラー:', deleteError);
      return NextResponse.json(
        { error: 'レビューの削除に失敗しました' },
        { status: 500 }
      );
    }

    // プロンプトの平均評価を更新
    const { data: ratingStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('prompt_id', review.prompt_id)
      .eq('status', 'visible');

    if (ratingStats) {
      const avgRating = ratingStats.reduce((sum, r) => sum + r.rating, 0) / ratingStats.length;
      const ratingsCount = ratingStats.length;

      await supabase
        .from('prompts')
        .update({
          avg_rating: Math.round(avgRating * 100) / 100,
          ratings_count: ratingsCount
        })
        .eq('id', review.prompt_id);
    }

    return NextResponse.json({
      success: true,
      message: 'レビューを削除しました'
    });

  } catch (error) {
    console.error('レビュー削除エラー:', error);
    return NextResponse.json(
      { error: 'レビューの削除に失敗しました' },
      { status: 500 }
    );
  }
}

