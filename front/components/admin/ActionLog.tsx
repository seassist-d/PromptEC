'use client';

import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface ActionLog {
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

interface ActionLogProps {
  logs: ActionLog[];
}

export default function ActionLog({ logs }: ActionLogProps) {
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredLogs = logs.filter(log => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return (
      log.action_label.toLowerCase().includes(search) ||
      log.reason?.toLowerCase().includes(search) ||
      log.actor?.display_name?.toLowerCase().includes(search) ||
      log.actor?.email?.toLowerCase().includes(search)
    );
  });

  const getActionColor = (action: string) => {
    const actionColors: { [key: string]: string } = {
      'user_ban': 'bg-red-100 text-red-800',
      'user_unban': 'bg-green-100 text-green-800',
      'user_role_change': 'bg-blue-100 text-blue-800',
      'role_change': 'bg-blue-100 text-blue-800',
      'prompt_approve': 'bg-green-100 text-green-800',
      'prompt_reject': 'bg-red-100 text-red-800',
      'prompt_suspend': 'bg-yellow-100 text-yellow-800',
    };
    return actionColors[action] || 'bg-gray-100 text-gray-800';
  };

  const exportCSV = () => {
    const headers = ['日時', '操作者', 'アクション', '対象タイプ', '対象ID', '理由'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('ja-JP'),
      log.actor?.display_name || log.actor?.email || '',
      log.action_label,
      log.target_type,
      log.target_id,
      log.reason || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `action_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 検索とエクスポート */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="アクション、操作者、理由で検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          📥 CSVエクスポート
        </button>
      </div>

      {/* ログ一覧 */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">アクション履歴がありません</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action_label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">操作者:</span> {log.actor?.display_name || log.actor?.email || '不明'}
                  </div>
                  {log.reason && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">理由:</span> {log.reason}
                    </div>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">詳細:</span> {JSON.stringify(log.metadata, null, 2)}
                    </div>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">アクション詳細</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">アクション</label>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action_label}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日時</label>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.created_at).toLocaleString('ja-JP')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">操作者</label>
                  <p className="text-sm text-gray-900">{selectedLog.actor?.display_name || selectedLog.actor?.email || '不明'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">対象タイプ</label>
                  <p className="text-sm text-gray-900">{selectedLog.target_type}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">対象ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.target_id}</p>
                </div>

                {selectedLog.reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">理由</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.reason}</p>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">詳細情報</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

