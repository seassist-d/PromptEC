'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import SearchBar from '@/components/search/SearchBar';

export interface SearchFilters {
  query: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'created_at' | 'price' | 'rating' | 'views';
  sortOrder: 'ASC' | 'DESC';
}

export interface Prompt {
  id: string;
  title: string;
  slug: string;
  seller_id: string;
  category_id: number;
  thumbnail_url: string | null;
  price_jpy: number;
  short_description: string | null;
  avg_rating: number | null;
  ratings_count: number;
  view_count: number;
  created_at: string;
  rank: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || null,
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null,
    sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as SearchFilters['sortOrder']) || 'DESC',
  });

  const [results, setResults] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 検索実行
  const performSearch = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: filters.query,
        page: page.toString(),
        limit: '20',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== null) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== null) params.append('maxPrice', filters.maxPrice.toString());

      const response = await fetch(`/api/prompts/search?${params}`);
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data = await response.json();
      setResults(data.prompts || []);
      setTotalCount(data.totalCount || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索エラーが発生しました');
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // フィルター変更時の検索実行
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(1);
    }, 300); // デバウンス

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // 初期検索
  useEffect(() => {
    performSearch(1);
  }, []);

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    performSearch(page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ページタイトル */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          プロンプト検索
        </h1>
        <p className="text-lg text-gray-600">
          お探しのプロンプトを見つけましょう
        </p>
      </div>

      {/* 検索バー */}
      <div className="mb-8">
        <SearchBar
          query={filters.query}
          onQueryChange={(query) => handleFilterChange({ query })}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* サイドバー: フィルター */}
        <div className="lg:w-80 flex-shrink-0">
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
          />
        </div>

        {/* メインコンテンツ: 検索結果 */}
        <div className="flex-1">
          <SearchResults
            results={results}
            loading={loading}
            error={error}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}
