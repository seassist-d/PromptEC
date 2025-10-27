'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import SearchSuggestions from './SearchSuggestions';

interface AdvancedFiltersProps {
  initialKeyword?: string;
  onFilterChange: (filters: FilterState) => void;
  searchableColumns?: string[];
}

interface FilterState {
  keyword: string;
  dateRange: { from: Date | null; to: Date | null };
  categories: string[];
  priceRange: { min: number | null; max: number | null };
  operator: 'AND' | 'OR';
}

export default function AdvancedFilters({
  initialKeyword = '',
  onFilterChange,
  searchableColumns = [],
}: AdvancedFiltersProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 300);

  useEffect(() => {
    const filters: FilterState = {
      keyword: debouncedKeyword,
      dateRange: {
        from: dateFrom ? new Date(dateFrom) : null,
        to: dateTo ? new Date(dateTo) : null,
      },
      categories: [],
      priceRange: {
        min: minPrice ? parseInt(minPrice) : null,
        max: maxPrice ? parseInt(maxPrice) : null,
      },
      operator: operator || 'AND',
    };

    onFilterChange(filters);
  }, [debouncedKeyword, dateFrom, dateTo, minPrice, maxPrice, operator, onFilterChange]);

  const clearFilters = () => {
    setKeyword('');
    setDateFrom('');
    setDateTo('');
    setMinPrice('');
    setMaxPrice('');
  };

  const activeFilterCount = [
    keyword,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">フィルター</h3>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {activeFilterCount}件のフィルター
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* キーワード検索 */}
        {searchableColumns.length > 0 && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              キーワード検索
            </label>
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(keyword.length > 0)}
                placeholder="検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showSuggestions && (
                <SearchSuggestions
                  searchQuery={keyword}
                  suggestions={suggestions}
                  onSelect={(suggestion) => {
                    setKeyword(suggestion);
                    setShowSuggestions(false);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* 日付範囲 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            開始日
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            終了日
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 価格範囲 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            最小価格
          </label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="¥0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            最大価格
          </label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="¥100000"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 検索演算子 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            検索条件
          </label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as 'AND' | 'OR')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="AND">すべての条件に一致（AND）</option>
            <option value="OR">いずれかの条件に一致（OR）</option>
          </select>
        </div>
      </div>
    </div>
  );
}

