'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableSelection?: boolean;
  searchableColumns?: string[];
  onBulkAction?: (selectedRows: T[], action: string) => void;
  enableExport?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enableSelection = false,
  searchableColumns = [],
  onBulkAction,
  enableExport = false,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 行選択カラムを追加
  const columnsWithSelection = useMemo(() => {
    if (!enableSelection) return columns;
    
    const selectionColumn: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    };
    
    return [selectionColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: enableSelection ? columnsWithSelection : columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    enableSorting,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().flatRows.map(row => row.original);

  // CSV/Excelエクスポート機能
  const handleExportCSV = () => {
    const headers = columns.map(col => col.id || col.accessorKey || '');
    const rows = data.map(row => 
      columns.map(col => {
        const accessorKey = col.accessorKey as string;
        const value = accessorKey ? row[accessorKey] : '';
        return `"${String(value || '').replace(/"/g, '""')}"`;
      })
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex items-center justify-between gap-4">
        {/* 検索バー */}
        {searchableColumns.length > 0 && (
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="検索..."
            className="max-w-sm px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
        )}
        
        {/* アクション */}
        <div className="flex items-center gap-2">
          {onBulkAction && selectedRows.length > 0 && (
            <>
              <button
                onClick={() => onBulkAction(selectedRows, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                一括承認 ({selectedRows.length})
              </button>
              <button
                onClick={() => onBulkAction(selectedRows, 'delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                一括削除 ({selectedRows.length})
              </button>
            </>
          )}
          {enableExport && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              CSVエクスポ்த
            </button>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '⇅'}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  データがありません
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${
                    row.getIsSelected() ? 'bg-blue-50' : ''
                  } transition-colors`}
                >
                  {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページ情報 */}
      <div className="flex items-center justify-between text-sm text-gray-900">
        <div>
          {data.length} 件中 {table.getRowModel().rows.length} 件を表示
        </div>
        {selectedRows.length > 0 && (
          <div className="text-blue-600">
            {selectedRows.length} 件選択中
          </div>
        )}
      </div>
    </div>
  );
}
