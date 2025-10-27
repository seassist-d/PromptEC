'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

interface Prompt {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description?: string;
  price_jpy: number;
  status: 'draft' | 'pending' | 'published' | 'suspended' | 'deleted';
  visibility: string;
  like_count: number;
  view_count: number;
  ratings_count: number;
  avg_rating: number;
  created_at: string;
  updated_at?: string;
  seller_id: string;
  user_profiles: {
    display_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPromptsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPrompts();
    }
  }, [filter, currentPage, loading]);

  const checkAdmin = async () => {
    try {
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
    } catch (error) {
      console.error('権限チェックエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await fetch(`/api/admin/prompts?status=${filter}&page=${currentPage}&limit=${pagination.limit}`);
      if (response.ok) {
        const data = await response.json();
        console.log('取得したデータ:', data);
        console.log('プロンプト数:', data.prompts?.length || 0);
        setPrompts(data.prompts || []);
        setPagination(data.pagination || pagination);
      } else {
        const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
        console.error('プロンプト取得に失敗しました:', errorData);
        alert(`エラー: ${errorData.error || 'プロンプトの取得に失敗しました'}`);
      }
    } catch (error) {
      console.error('プロンプト取得エラー:', error);
      alert('プロンプトの取得中にエラーが発生しました');
    }
  };

  const handleApprove = async (promptId: string, action: 'approve' | 'reject' | 'suspend', reason?: string) => {
    const messages = {
      approve: 'このプロンプトを承認しますか？',
      reject: 'このプロンプトを削除しますか？この操作は取り消せません。',
      suspend: 'このプロンプトを停止しますか？'
    };

    if (!confirm(messages[action])) {
      return;
    }

    setProcessing(promptId);
    try {
      const response = await fetch(`/api/admin/prompts/${promptId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchPrompts();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('承認エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: '下書き',
      pending: '審査中',
      published: '公開済み',
      suspended: '停止',
      deleted: '削除済み'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">読み込み中...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="mb-4 space-x-4">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              トップページ
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ダッシュボードに戻る
            </Link>
          </div>
          <h1 className="text-3xl font-bold">プロンプト管理</h1>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'published', 'suspended', 'deleted'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded transition-colors ${
                  filter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === '' ? '全て' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* プロンプト一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出品者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">統計</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prompts.map(prompt => (
                  <tr key={prompt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{prompt.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{prompt.short_description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {prompt.user_profiles?.avatar_url ? (
                          <img
                            className="h-8 w-8 rounded-full mr-2"
                            src={prompt.user_profiles.avatar_url}
                            alt={prompt.user_profiles.display_name || ''}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">
                              {(prompt.user_profiles?.display_name || prompt.user_profiles?.email || 'N/A')[0]}
                            </span>
                          </div>
                        )}
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{prompt.user_profiles?.display_name || 'N/A'}</div>
                          <div className="text-gray-500">{prompt.user_profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{prompt.price_jpy.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>👁 {prompt.view_count}</div>
                      <div>❤️ {prompt.like_count}</div>
                      {prompt.ratings_count > 0 && (
                        <div>⭐ {prompt.avg_rating.toFixed(1)} ({prompt.ratings_count})</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(prompt.status)}`}>
                        {getStatusLabel(prompt.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(prompt.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        {prompt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(prompt.id, 'approve')}
                              disabled={processing === prompt.id}
                              className="px-3 py-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
                            >
                              承認
                            </button>
                            <button
                              onClick={() => handleApprove(prompt.id, 'reject')}
                              disabled={processing === prompt.id}
                              className="px-3 py-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                            >
                              削除
                            </button>
                          </>
                        )}
                        {prompt.status === 'published' && (
                          <button
                            onClick={() => handleApprove(prompt.id, 'suspend')}
                            disabled={processing === prompt.id}
                            className="px-3 py-1 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded disabled:opacity-50 transition-colors"
                          >
                            停止
                          </button>
                        )}
                        <Link 
                          href={`/prompts/${prompt.slug}`}
                          className="px-3 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors inline-block text-center"
                          target="_blank"
                        >
                          詳細
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {prompts.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              該当するプロンプトがありません
            </div>
          )}
          {/* ページネーション */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                全 {pagination.total} 件中 {((currentPage - 1) * pagination.limit) + 1} 〜 {Math.min(currentPage * pagination.limit, pagination.total)} 件を表示
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  前へ
                </button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
