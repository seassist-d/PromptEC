'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

interface SearchSuggestion {
  title: string;
  description: string;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // デバウンスされたクエリ（300ms遅延）
  const debouncedQuery = useDebounce(localQuery, 300);
  
  // 検索候補を取得
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!localQuery.trim() || localQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`/api/prompts/search?q=${encodeURIComponent(localQuery.trim())}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.prompts?.slice(0, 5) || []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    fetchSuggestions();
  }, [localQuery]);

  // 外側をクリックしたらサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // デバウンスされたクエリが変更されたら親コンポーネントに通知
  useEffect(() => {
    // 実際に値が変わった時だけ親に通知
    if (debouncedQuery !== query) {
      onQueryChange(debouncedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // 親コンポーネントからの query が変わったらローカル状態も更新
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // URLパラメータを更新
    const params = new URLSearchParams();
    if (localQuery) params.set('q', localQuery);
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.push(newUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setLocalQuery(suggestion.title);
    setShowSuggestions(false);
    onQueryChange(suggestion.title);
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="プロンプトを検索..."
            className="w-full px-6 py-4 pl-14 pr-20 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm text-gray-900 placeholder-gray-500"
            aria-label="プロンプト検索"
          />
        
        {/* 検索アイコン */}
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
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
      
      {/* リアルタイム検索のヒント */}
      {localQuery && localQuery.length > 0 && localQuery !== debouncedQuery && (
        <div className="mt-3 text-sm text-blue-600 flex items-center">
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          検索中...
        </div>
      )}
      </form>
      
      {/* 検索候補ドロップダウン */}
      {showSuggestions && suggestions.length > 0 && localQuery.length >= 2 && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</p>
                  {suggestion.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">{suggestion.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
