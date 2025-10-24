import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, content, category_id, price, tags } = body;

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

    // スラッグを生成（タイトルから）
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // プロンプトを作成（データベース構造に合わせて修正）
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        title,
        short_description: description,
        long_description: content,
        category_id: parseInt(category_id),
        price_jpy: parseInt(price),
        seller_id: user.id,
        slug: `${slug}-${Date.now()}`,
        status: 'published',
        visibility: 'public'
      })
      .select()
      .single();

    if (promptError) {
      console.error('Prompt creation error:', promptError);
      return NextResponse.json(
        { message: 'プロンプトの作成に失敗しました', details: promptError.message },
        { status: 500 }
      );
    }

    // タグを追加（tagsテーブルとprompt_tagsテーブルを使用）
    if (tags && tags.length > 0) {
      try {
        // 各タグをtagsテーブルに追加（存在しない場合のみ）
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
            prompt_id: prompt.id,
            tag_id: tagId
          }));

          const { error: promptTagError } = await supabase
            .from('prompt_tags')
            .insert(promptTagInserts);

          if (promptTagError) {
            console.error('Prompt tag association error:', promptTagError);
            // タグの関連付けに失敗してもプロンプトは作成済みなので、警告のみ
          }
        }
      } catch (tagError) {
        console.error('Tag processing error:', tagError);
        // タグ処理に失敗してもプロンプトは作成済みなので、警告のみ
      }
    }

    return NextResponse.json({
      message: 'プロンプトが正常に作成されました',
      prompt
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
