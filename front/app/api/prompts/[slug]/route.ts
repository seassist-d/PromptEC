import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // プロンプト詳細を取得（カテゴリと出品者情報を含む）
    let query = supabase
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
        long_description,
        sample_output,
        avg_rating,
        ratings_count,
        view_count,
        like_count,
        created_at,
        updated_at,
        status,
        visibility,
        categories!inner(id, name, slug),
        user_profiles!prompts_seller_id_fkey(
          user_id,
          display_name,
          avatar_url
        )
      `)
      .eq('slug', slug);

    // ログインしている場合は自分のプロンプトも取得可能、そうでなければ公開プロンプトのみ
    if (user) {
      // ログインユーザーの場合：自分のプロンプトまたは公開プロンプト
      query = query.or(`seller_id.eq.${user.id},and(status.eq.published,visibility.eq.public)`);
    } else {
      // 未ログインの場合：公開プロンプトのみ
      query = query.eq('status', 'published').eq('visibility', 'public');
    }

    const { data: prompt, error } = await query.single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // レビュー情報を取得
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user_profiles!reviews_user_id_fkey(
          display_name,
          avatar_url
        )
      `)
      .eq('prompt_id', prompt.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // 関連プロンプトを取得（同じカテゴリの他のプロンプト）
    const { data: relatedPrompts, error: relatedError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        slug,
        thumbnail_url,
        price_jpy,
        avg_rating,
        ratings_count,
        created_at,
        categories!inner(name)
      `)
      .eq('category_id', prompt.category_id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .neq('id', prompt.id)
      .order('avg_rating', { ascending: false })
      .limit(4);

    if (relatedError) {
      console.error('Error fetching related prompts:', relatedError);
    }

    // ビュー数を増加（非同期で実行）
    supabase
      .from('prompts')
      .update({ view_count: (prompt.view_count || 0) + 1 })
      .eq('id', prompt.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating view count:', error);
        }
      });

    // レスポンス用のデータを整形
    const responseData = {
      id: prompt.id,
      title: prompt.title,
      slug: prompt.slug,
      short_description: prompt.short_description,
      long_description: prompt.long_description,
      sample_output: prompt.sample_output,
      price_jpy: prompt.price_jpy,
      thumbnail_url: prompt.thumbnail_url,
      avg_rating: prompt.avg_rating,
      ratings_count: prompt.ratings_count || 0,
      view_count: prompt.view_count || 0,
      like_count: prompt.like_count || 0,
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      category_id: prompt.category_id,
      category_name: prompt.categories?.name || '未分類',
      category_slug: prompt.categories?.slug || '',
      seller_id: prompt.seller_id,
      seller_name: prompt.user_profiles?.display_name || '不明',
      seller_avatar: prompt.user_profiles?.avatar_url,
      status: prompt.status,
      visibility: prompt.visibility,
      reviews: (reviews || []).map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user_name: review.user_profiles?.display_name || '不明',
        user_avatar: review.user_profiles?.avatar_url,
      })),
      related_prompts: (relatedPrompts || []).map(related => ({
        id: related.id,
        title: related.title,
        slug: related.slug,
        thumbnail_url: related.thumbnail_url,
        price_jpy: related.price_jpy,
        avg_rating: related.avg_rating,
        ratings_count: related.ratings_count || 0,
        created_at: related.created_at,
        category_name: related.categories?.name || '未分類',
      })),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, content, category_id, price, tags, thumbnail_url } = body;

    // バリデーション
    if (!title || !description || !content || !category_id || price === undefined || price === null) {
      return NextResponse.json(
        { message: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { message: '価格は0以上である必要があります' },
        { status: 400 }
      );
    }

    // プロンプトの所有者確認
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, seller_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { message: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    if (existingPrompt.seller_id !== user.id) {
      return NextResponse.json(
        { message: 'このプロンプトを編集する権限がありません' },
        { status: 403 }
      );
    }

    // プロンプトを更新
    const updateData: Record<string, unknown> = {
      title,
      short_description: description,
      long_description: content,
      category_id: parseInt(category_id),
      price_jpy: parseFloat(price),
      updated_at: new Date().toISOString()
    };

    // サムネイル画像URLがある場合は更新
    if (thumbnail_url !== undefined) {
      updateData.thumbnail_url = thumbnail_url || null;
    }

    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', existingPrompt.id)
      .select()
      .single();

    if (updateError) {
      console.error('Prompt update error:', updateError);
      return NextResponse.json(
        { message: 'プロンプトの更新に失敗しました', details: updateError.message },
        { status: 500 }
      );
    }

    // タグを更新
    if (tags && tags.length > 0) {
      try {
        // 既存のタグ関連を削除
        await supabase
          .from('prompt_tags')
          .delete()
          .eq('prompt_id', existingPrompt.id);

        // 新しいタグを追加
        const tagPromises = tags.map(async (tagName: string) => {
          const trimmedTag = tagName.trim();
          if (!trimmedTag) return null;

          // タグが既に存在するかチェック
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', trimmedTag)
            .single();

          if (existingTag) {
            return existingTag.id;
          }

          // 新しいタグを作成
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              name: trimmedTag,
              slug: trimmedTag.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            })
            .select('id')
            .single();

          if (tagError) {
            console.error('Tag creation error:', tagError);
            return null;
          }

          return newTag.id;
        });

        const tagIds = await Promise.all(tagPromises);
        const validTagIds = tagIds.filter(id => id !== null);

        // prompt_tagsテーブルに関連付けを追加
        if (validTagIds.length > 0) {
          const promptTagInserts = validTagIds.map(tagId => ({
            prompt_id: existingPrompt.id,
            tag_id: tagId
          }));

          await supabase
            .from('prompt_tags')
            .insert(promptTagInserts);
        }
      } catch (tagError) {
        console.error('Tag processing error:', tagError);
        // タグ処理に失敗してもプロンプトは更新済みなので、警告のみ
      }
    }

    return NextResponse.json({
      message: 'プロンプトが正常に更新されました',
      prompt: updatedPrompt
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    // プロンプトの所有者確認
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, seller_id, title')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { message: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    if (existingPrompt.seller_id !== user.id) {
      return NextResponse.json(
        { message: 'このプロンプトを削除する権限がありません' },
        { status: 403 }
      );
    }

    // プロンプトを削除（RLSポリシーにより、関連するタグやバージョンも自動削除される）
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', existingPrompt.id);

    if (deleteError) {
      console.error('Prompt deletion error:', deleteError);
      return NextResponse.json(
        { message: 'プロンプトの削除に失敗しました', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'プロンプトが正常に削除されました'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
