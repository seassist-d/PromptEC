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
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    console.log(`Checking for email: ${email}`);
    console.log(`Total users in database: ${authUsers.users.length}`);
    
    // デバッグ: 最初の数件のユーザーのメールアドレスを表示
    if (authUsers.users.length > 0) {
      console.log('Sample user emails:', authUsers.users.slice(0, 3).map(u => ({ email: u.email, providers: u.identities?.map(i => i.provider) })));
    }
    
    // 同じメールアドレスのユーザーが存在するかチェック
    const sameEmailUsers = authUsers.users.filter(user => 
      user.email === email
    );

    console.log(`Users with same email: ${sameEmailUsers.length}`);
    
    // デバッグ: 同じメールアドレスのユーザーの詳細を表示
    if (sameEmailUsers.length > 0) {
      sameEmailUsers.forEach(user => {
        console.log(`Found user ${user.id}:`, {
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          identities: user.identities,
          app_metadata: user.app_metadata
        });
      });
    }
    
    // OAuthで登録されているユーザーを探す
    for (const user of sameEmailUsers) {
      console.log(`Checking user: ${user.id}, identities:`, user.identities);
      
      const identities = user.identities || [];
      const oauthIdentity = identities.find(identity => 
        identity.provider !== 'email'
      );
      
      if (oauthIdentity) {
        console.log(`OAuth user found: ${oauthIdentity.provider} for email: ${email}`);
        return NextResponse.json({
          isOAuthUser: true,
          provider: oauthIdentity.provider
        });
      }
    }

    console.log(`No OAuth user found for email: ${email}`);
    return NextResponse.json({
      isOAuthUser: false,
      provider: null
    });

  } catch (error) {
    console.error('Check OAuth user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

