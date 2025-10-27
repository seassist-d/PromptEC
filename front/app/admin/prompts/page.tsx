'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import PromptTable from '@/components/admin/PromptTable';
import AdvancedFilters from '@/components/admin/AdvancedFilters';
import Pagination from '@/components/admin/Pagination';

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ promptId: string; action: 'approve' | 'reject' | 'suspend'; } | null>(null);

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
        toast.error(`エラー: ${errorData.error || 'プロンプトの取得に失敗しました'}`);
      }
    } catch (error) {
      console.error('プロンプト取得エラー:', error);
      toast.error('プロンプトの取得中にエラーが発生しました');
    }
  };

  const handleApprove = (promptId: string, action: 'approve' | 'reject' | 'suspend') => {
    setConfirmAction({ promptId, action });
    setShowConfirm(true);
  };

  const confirmApprove = async () => {
    if (!confirmAction) return;

    const { promptId, action } = confirmAction;
    const loadingToast = toast.loading('処理中...');

    setProcessing(promptId);
    setShowConfirm(false);
    
    try {
      const response = await fetch(`/api/admin/prompts/${promptId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || '処理が完了しました', { id: loadingToast });
        fetchPrompts();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'エラーが発生しました', { id: loadingToast });
      }
    } catch (error) {
      console.error('承認エラー:', error);
      toast.error('エラーが発生しました', { id: loadingToast });
    } finally {
      setProcessing(null);
      setConfirmAction(null);
    }
  };

  const getConfirmMessage = (action: 'approve' | 'reject' | 'suspend') => {
    const messages = {
      approve: 'このプロンプトを承認しますか？',
      reject: 'このプロンプトを削除しますか？この操作は取り消せません。',
      suspend: 'このプロンプトを停止しますか？'
    };
    return messages[action];
  };

  const getConfirmTitle = (action: 'approve' | 'reject' | 'suspend') => {
    const titles = {
      approve: 'プロンプト承認',
      reject: 'プロンプト削除',
      suspend: 'プロンプト停止'
    };
    return titles[action];
  };

  const getConfirmType = (action: 'approve' | 'reject' | 'suspend'): 'danger' | 'warning' | 'info' => {
    if (action === 'reject') return 'danger';
    if (action === 'suspend') return 'warning';
    return 'info';
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
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-4 md:mb-6">
          <div className="mb-3 md:mb-4 flex flex-wrap items-center gap-2 md:gap-4">
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              トップページ
            </Link>
            <span className="text-gray-400 hidden md:inline">|</span>
            <Link href="/admin" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ダッシュボード
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">プロンプト管理</h1>
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

        {/* 高度なフィルター */}
        <AdvancedFilters
          onFilterChange={(filters) => {
            console.log('フィルター変更:', filters);
            // ここでフィルター適用のロジックを実装
          }}
          searchableColumns={['title', 'short_description']}
        />

        {/* プロンプト一覧 */}
        <PromptTable
          prompts={prompts}
          onApprove={handleApprove}
          processing={processing}
          getStatusBadgeColor={getStatusBadgeColor}
          getStatusLabel={getStatusLabel}
        />

        {/* ページネーション */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* 確認ダイアログ */}
      {confirmAction && (
        <ConfirmDialog
          title={getConfirmTitle(confirmAction.action)}
          message={getConfirmMessage(confirmAction.action)}
          isOpen={showConfirm}
          onConfirm={confirmApprove}
          onCancel={() => {
            setShowConfirm(false);
            setConfirmAction(null);
          }}
          confirmText={confirmAction.action === 'approve' ? '承認' : confirmAction.action === 'reject' ? '削除' : '停止'}
          cancelText="キャンセル"
          type={getConfirmType(confirmAction.action)}
        />
      )}
    </div>
  );
}
