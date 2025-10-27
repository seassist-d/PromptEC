'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import ActionLog from '@/components/admin/ActionLog';
import AdvancedFilters from '@/components/admin/AdvancedFilters';
import Pagination from '@/components/admin/Pagination';

interface ActionLogItem {
  id: string;
  actor_id: string;
  action: string;
  action_label: string;
  target_type: string;
  target_id: string;
  reason: string;
  metadata?: any;
  created_at: string;
  actor?: {
    user_id: string;
    display_name: string;
    email: string;
  };
}

export default function AdminActivityPage() {

  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActionLogItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchLogs();
    }
  }, [pagination.page, pagination.limit, loading]);

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

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/admin/activity?page=${pagination.page}&limit=${pagination.limit}`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('アクション履歴取得エラー:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">アクション履歴・監査ログ</h1>
        </div>

        {/* アクション履歴 */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <ActionLog logs={logs} />
        </div>

        {/* ページネーション */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

