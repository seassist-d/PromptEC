'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

interface User {
  user_id: string;
  display_name: string;
  role: string;
  is_banned: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setUsers(data.users || []);

    } catch (error: any) {
      console.error('ユーザー読み込みエラー:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('このユーザーをBANしますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '管理者によるBAN' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'BANに失敗しました');
      }

      alert('ユーザーをBANしました');
      loadUsers();
    } catch (error: any) {
      console.error('BANエラー:', error);
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">表示名</th>
                <th className="text-left p-2">ロール</th>
                <th className="text-left p-2">ステータス</th>
                <th className="text-left p-2">登録日</th>
                <th className="text-left p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} className="border-b">
                  <td className="p-2">{user.display_name || '未設定'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2">
                    {user.is_banned ? (
                      <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-800">BAN済み</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">アクティブ</span>
                    )}
                  </td>
                  <td className="p-2">{new Date(user.created_at).toLocaleString('ja-JP')}</td>
                  <td className="p-2">
                    {!user.is_banned && (
                      <button
                        onClick={() => handleBan(user.user_id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        BAN
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

