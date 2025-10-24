'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQueryChange(localQuery);
    
    // URLパラメータを更新
    const params = new URLSearchParams();
    if (localQuery) params.set('q', localQuery);
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.push(newUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder="プロンプトを検索..."
          className="w-full px-6 py-4 pl-14 pr-20 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm text-gray-900 placeholder-gray-500"
        />
        
        {/* 検索アイコン */}
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* 検索ボタン */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold transition-colors"
        >
          検索
        </button>
      </div>
      
      {/* 検索候補（将来的に実装） */}
      {localQuery && localQuery.length > 0 && (
        <div className="mt-3 text-sm text-gray-500">
          「{localQuery}」の検索結果を表示中
        </div>
      )}
    </form>
  );
}
