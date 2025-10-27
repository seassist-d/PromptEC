import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // フィルタリング
    const role = searchParams.get('role');
    const isBanned = searchParams.get('is_banned');
    const search = searchParams.get('search');

    let query = supabase
      .from('user_profiles')
      .select(`
        user_id,
        display_name,
        role,
        is_banned,
        bio,
        contact,
        created_at,
        updated_at
      `, { count: 'exact' });

    // ロールフィルタ
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    // BAN状態フィルタ
    if (isBanned && isBanned !== 'all') {
      query = query.eq('is_banned', isBanned === 'true');
    }

    // 検索フィルタ（表示名）
    if (search) {
      query = query.or(`display_name.ilike.%${search}%`);
    }

    // 並び替えとページネーション
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      users: data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: error.message || 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

