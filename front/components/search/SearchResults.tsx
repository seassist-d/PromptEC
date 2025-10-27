'use client';

import { Prompt, SearchFilters as SearchFiltersType } from '@/components/pages/SearchPage';
import Link from 'next/link';
import SkeletonCard from '@/components/common/SkeletonCard';

interface SearchResultsProps {
  results: Prompt[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  filters: SearchFiltersType;
}

export default function SearchResults({
  results,
  loading,
  error,
  totalCount,
  currentPage,
  onPageChange,
  filters,
}: SearchResultsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">エラーが発生しました</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          再試行
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">検索結果が見つかりません</h3>
        <p className="text-gray-600 mb-4">
          {filters.query ? `「${filters.query}」に一致するプロンプトはありません` : '条件に一致するプロンプトはありません'}
        </p>
        <p className="text-sm text-gray-500">
          検索条件を変更して再度お試しください
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / 20);

  // フィルター条件を取得
  const getActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; value: string }> = [];
    
    if (filters.query) {
      activeFilters.push({ key: 'query', label: 'キーワード', value: filters.query });
    }
    
    if (filters.category) {
      // カテゴリ名はここでは簡易的にIDを表示（実際の実装ではカテゴリ名を取得）
      activeFilters.push({ key: 'category', label: 'カテゴリ', value: filters.category });
    }
    
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      let priceRange = '';
      if (filters.minPrice !== null && filters.maxPrice !== null) {
        priceRange = `${filters.minPrice}円 - ${filters.maxPrice}円`;
      } else if (filters.minPrice !== null) {
        priceRange = `${filters.minPrice}円以上`;
      } else if (filters.maxPrice !== null) {
        priceRange = `${filters.maxPrice}円以下`;
      }
      activeFilters.push({ key: 'price', label: '価格', value: priceRange });
    }
    
    if (filters.sortBy !== 'created_at') {
      const sortLabels: Record<string, string> = {
        price: '価格順',
        rating: '評価順',
        views: '人気順',
      };
      activeFilters.push({ key: 'sort', label: 'ソート', value: sortLabels[filters.sortBy] || filters.sortBy });
    }
    
    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 検索結果ヘッダー */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {totalCount}件のプロンプトが見つかりました
            </h2>
            {filters.query && (
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                「{filters.query}」の検索結果
              </p>
            )}
          </div>
          
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            {currentPage} / {totalPages} ページ
          </div>
        </div>
        
        {/* フィルター条件の視覚化 */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">適用中のフィルター:</span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                <span className="mr-1">{filter.label}:</span>
                <span className="font-semibold">{filter.value}</span>
              </span>
            ))}
            <span className="text-xs text-gray-500">({activeFilters.length}件の条件)</span>
          </div>
        )}
      </div>

      {/* プロンプト一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {results.map((prompt) => (
          <Link
            key={prompt.id}
            href={`/prompts/${prompt.slug}`}
            className="group relative bg-white rounded-2xl shadow-lg overflow-hidden card-hover animate-slide-up border border-gray-100"
          >
            {/* グラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            
            {/* ホバー時のハートアイコン */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* サムネイル */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg sm:rounded-xl mb-3 sm:mb-4 overflow-hidden">
                {prompt.thumbnail_url ? (
                  <img
                    src={prompt.thumbnail_url}
                    alt={prompt.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* カテゴリ */}
              <div className="mb-3">
                <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                  {prompt.category_name}
                </span>
              </div>

              {/* タイトル */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {prompt.title}
              </h3>

              {/* 説明 */}
              {prompt.short_description && (
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                  {prompt.short_description}
                </p>
              )}

              {/* 評価と価格 */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {prompt.avg_rating ? (
                    <>
                      <div className="flex items-center">
                        {renderStars(prompt.avg_rating)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {prompt.avg_rating.toFixed(1)} ({prompt.ratings_count})
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">評価なし</span>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(prompt.price_jpy)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(prompt.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3 mt-8">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            前へ
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
