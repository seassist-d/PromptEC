'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function AdminReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('権限チェックエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">読み込み中...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">← ダッシュボードに戻る</Link>
          <h1 className="text-3xl font-bold">売上レポート</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500">売上レポート機能は準備中です。</p>
        </div>
      </div>
    </div>
  );
}
