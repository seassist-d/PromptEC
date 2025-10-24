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
    const { title, description, content, category_id, price, tags, seller_id } = body;

    // バリデーション
    if (!title || !description || !content || !category_id || !price) {
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

    // プロンプトを作成
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        title,
        description,
        content,
        category_id: parseInt(category_id),
        price: parseFloat(price),
        seller_id: user.id,
        slug: `${slug}-${Date.now()}`,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (promptError) {
      console.error('Prompt creation error:', promptError);
      return NextResponse.json(
        { message: 'プロンプトの作成に失敗しました' },
        { status: 500 }
      );
    }

    // タグを追加（タグが提供されている場合）
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tag: string) => ({
        prompt_id: prompt.id,
        name: tag.trim(),
        created_at: new Date().toISOString()
      }));

      const { error: tagError } = await supabase
        .from('prompt_tags')
        .insert(tagInserts);

      if (tagError) {
        console.error('Tag creation error:', tagError);
        // タグの作成に失敗してもプロンプトは作成済みなので、警告のみ
      }
    }

    return NextResponse.json({
      message: 'プロンプトが正常に作成されました',
      prompt
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
