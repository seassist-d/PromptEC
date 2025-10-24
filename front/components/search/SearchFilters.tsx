'use client';

import { useState, useEffect } from 'react';
import { SearchFilters as SearchFiltersType } from '@/components/pages/SearchPage';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: Partial<SearchFiltersType>) => void;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // カテゴリデータを取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (response.ok) {
          setCategories(data.categories || []);
        } else {
          console.error('Categories fetch error:', data.error);
        }
      } catch (error) {
        console.error('Categories fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const priceRanges = [
    { label: 'すべて', min: null, max: null },
    { label: '無料', min: 0, max: 0 },
    { label: '〜500円', min: 1, max: 500 },
    { label: '500円〜1,000円', min: 500, max: 1000 },
    { label: '1,000円〜3,000円', min: 1000, max: 3000 },
    { label: '3,000円〜', min: 3000, max: null },
  ];

  const sortOptions = [
    { value: 'created_at', label: '新着順' },
    { value: 'price', label: '価格順' },
    { value: 'rating', label: '評価順' },
    { value: 'views', label: '人気順' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">フィルター</h3>
      
      {/* カテゴリフィルター */}
      <div className="mb-8">
        <h4 className="text-base font-semibold text-gray-800 mb-4">カテゴリ</h4>
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={!filters.category}
              onChange={() => onFiltersChange({ category: null })}
              className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">すべて</span>
          </label>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            categories.map((category) => (
              <label key={category.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.id.toString()}
                  checked={filters.category === category.id.toString()}
                  onChange={() => onFiltersChange({ category: category.id.toString() })}
                  className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* 価格フィルター */}
      <div className="mb-8">
        <h4 className="text-base font-semibold text-gray-800 mb-4">価格帯</h4>
        <div className="space-y-3">
          {priceRanges.map((range, index) => (
            <label key={index} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={
                  filters.minPrice === range.min && 
                  filters.maxPrice === range.max
                }
                onChange={() => onFiltersChange({ 
                  minPrice: range.min, 
                  maxPrice: range.max 
                })}
                className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ソート順 */}
      <div className="mb-8">
        <h4 className="text-base font-semibold text-gray-800 mb-4">並び順</h4>
        <div className="space-y-3">
          {sortOptions.map((option) => (
            <label key={option.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="sortBy"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={() => onFiltersChange({ sortBy: option.value as SearchFiltersType['sortBy'] })}
                className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        
        {/* 昇順/降順 */}
        <div className="mt-4 ml-6 space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="sortOrder"
              value="DESC"
              checked={filters.sortOrder === 'DESC'}
              onChange={() => onFiltersChange({ sortOrder: 'DESC' })}
              className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">降順</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="sortOrder"
              value="ASC"
              checked={filters.sortOrder === 'ASC'}
              onChange={() => onFiltersChange({ sortOrder: 'ASC' })}
              className="mr-3 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">昇順</span>
          </label>
        </div>
      </div>

      {/* フィルターリセット */}
      <button
        onClick={() => onFiltersChange({
          query: '',
          category: null,
          minPrice: null,
          maxPrice: null,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        })}
        className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 py-3 border-t border-gray-200 transition-colors"
      >
        フィルターをリセット
      </button>
    </div>
  );
}
