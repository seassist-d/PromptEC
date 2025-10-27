'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import DataTable from './DataTable';

interface Prompt {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  price_jpy: number;
  status: 'draft' | 'pending' | 'published' | 'suspended' | 'deleted';
  like_count: number;
  view_count: number;
  ratings_count: number;
  avg_rating: number;
  created_at: string;
  user_profiles: {
    display_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

interface PromptTableProps {
  prompts: Prompt[];
  onApprove: (promptId: string, action: 'approve' | 'reject' | 'suspend') => void;
  processing?: string | null;
  getStatusBadgeColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export default function PromptTable({
  prompts,
  onApprove,
  processing,
  getStatusBadgeColor,
  getStatusLabel,
}: PromptTableProps) {
  const columns: ColumnDef<Prompt>[] = [
    {
      accessorKey: 'title',
      header: 'タイトル',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{row.original.title}</div>
          <div className="text-sm text-gray-500 max-w-xs truncate">{row.original.short_description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'user_profiles.display_name',
      header: '出品者',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.user_profiles?.avatar_url ? (
            <img
              className="h-8 w-8 rounded-full mr-2"
              src={row.original.user_profiles.avatar_url}
              alt={row.original.user_profiles.display_name || ''}
            />
          ) : (
            <div className="h-8 w-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-600">
                {(row.original.user_profiles?.display_name || row.original.user_profiles?.email || 'N/A')[0]}
              </span>
            </div>
          )}
          <div className="text-sm">
            <div className="font-medium text-gray-900">{row.original.user_profiles?.display_name || 'N/A'}</div>
            <div className="text-gray-500">{row.original.user_profiles?.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'price_jpy',
      header: '価格',
      cell: ({ row }) => `¥${row.original.price_jpy.toLocaleString()}`,
    },
    {
      accessorKey: 'view_count',
      header: '統計',
      cell: ({ row }) => (
        <div>
          <div>👁 {row.original.view_count}</div>
          <div>❤️ {row.original.like_count}</div>
          {row.original.ratings_count > 0 && (
            <div>⭐ {row.original.avg_rating.toFixed(1)} ({row.original.ratings_count})</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(row.original.status)}`}>
          {getStatusLabel(row.original.status)}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: '作成日',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('ja-JP'),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {row.original.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(row.original.id, 'approve')}
                disabled={processing === row.original.id}
                className="px-3 py-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
              >
                {processing === row.original.id ? '処理中...' : '承認'}
              </button>
              <button
                onClick={() => onApprove(row.original.id, 'reject')}
                disabled={processing === row.original.id}
                className="px-3 py-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
              >
                {processing === row.original.id ? '処理中...' : '削除'}
              </button>
            </>
          )}
          {row.original.status === 'published' && (
            <button
              onClick={() => onApprove(row.original.id, 'suspend')}
              disabled={processing === row.original.id}
              className="px-3 py-1 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded disabled:opacity-50 transition-colors"
            >
              {processing === row.original.id ? '処理中...' : '停止'}
            </button>
          )}
          <Link 
            href={`/prompts/${row.original.slug}`}
            className="px-3 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors inline-block text-center"
            target="_blank"
          >
            詳細
          </Link>
        </div>
      ),
    },
  ];

  const handleBulkAction = (selectedPrompts: Prompt[], action: string) => {
    console.log('Bulk action:', action, selectedPrompts);
    // TODO: 一括操作の実装
  };

  return (
    <DataTable
      data={prompts}
      columns={columns}
      enableSorting
      enableFiltering
      enableSelection
      enableExport
      searchableColumns={['title', 'user_profiles.display_name']}
      onBulkAction={handleBulkAction}
    />
  );
}

