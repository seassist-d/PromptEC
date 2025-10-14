'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLのハッシュフラグメントから認証情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=認証に失敗しました');
          return;
        }
        
        if (data.session) {
          // 認証成功 - パスワード設定ページにリダイレクト
          router.push('/auth/set-password');
        } else {
          // セッションが見つからない場合
          router.push('/auth/login?error=認証情報が見つかりません');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/login?error=予期しないエラーが発生しました');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">認証を処理中...</p>
      </div>
    </div>
  );
}
