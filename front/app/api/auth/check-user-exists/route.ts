import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 同じメールアドレスのユーザーをauth.usersテーブルから検索
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    // 同じメールアドレスのユーザーが存在するかチェック
    const sameEmailUsers = authUsers.users.filter(user => 
      user.email === email
    );

    // 既存ユーザーが存在するかどうかを判定
    const userExists = sameEmailUsers.length > 0;

    console.log(`User check for email ${email}:`, {
      sameEmailUsersCount: sameEmailUsers.length,
      userExists
    });

    return NextResponse.json({
      userExists,
      existingUsersCount: sameEmailUsers.length
    });

  } catch (error) {
    console.error('Check user exists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
