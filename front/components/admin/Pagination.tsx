'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showPageInput?: boolean;
  showLimitSelect?: boolean;
  showJumpButtons?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  showPageInput = true,
  showLimitSelect = true,
  showJumpButtons = true,
}: PaginationProps) {
  const [pageInput, setPageInput] = useState<string>('');
  const [showInput, setShowInput] = useState(false);

  const handlePageInput = () => {
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setShowInput(false);
      setPageInput('');
    }
  };

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, total);

  // ページ番号の配列を生成（現在のページを中心に5ページ表示）
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow + 2) {
      // 全ページを表示できる場合
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページ
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // 現在のページを中心に表示
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // 最後のページ
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
      {/* ページ情報 */}
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span>
          {total > 0 ? (
            <>
              <span className="font-medium">{startIndex}</span> - <span className="font-medium">{endIndex}</span> / 全 <span className="font-medium">{total}</span> 件
            </>
          ) : (
            <span>0 件</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* 表示件数調整 */}
        {showLimitSelect && onLimitChange && (
          <div className="flex items-center gap-2 mr-4">
            <label className="text-sm text-gray-700">表示件数:</label>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10件</option>
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
          </div>
        )}

        {/* ジャンプボタン */}
        {showJumpButtons && (
          <>
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="最初のページへ"
            >
              ≪
            </button>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="前のページへ"
            >
              ‹
            </button>
          </>
        )}

        {/* ページ番号 */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">
                  ...
                </span>
              );
            }
            
            const pageNum = page as number;
            const isActive = pageNum === currentPage;
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 border rounded text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* モバイル用: ページ番号入力 */}
        <div className="sm:hidden">
          {showInput ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={currentPage.toString()}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 text-center focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePageInput}
                className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                跳
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setPageInput('');
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              {currentPage} / {totalPages}
            </button>
          )}
        </div>

        {/* デスクトップ用: ページ番号直接入力 */}
        {showPageInput && (
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder="ページ番号"
              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePageInput();
                }
              }}
            />
            <button
              onClick={handlePageInput}
              className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              title="ページへジャンプ"
            >
              跳
            </button>
          </div>
        )}

        {/* ジャンプボタン */}
        {showJumpButtons && (
          <>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="次のページへ"
            >
              ›
            </button>
            <button
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="最後のページへ"
            >
              ≫
            </button>
          </>
        )}
      </div>
    </div>
  );
}

