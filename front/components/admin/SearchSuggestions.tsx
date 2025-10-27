'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchSuggestionsProps {
  searchQuery: string;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading?: boolean;
}

export default function SearchSuggestions({
  searchQuery,
  suggestions,
  onSelect,
  isLoading = false,
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(searchQuery.length > 0 && suggestions.length > 0);
    setSelectedIndex(-1);
  }, [searchQuery, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (suggestion: string) => {
    onSelect(suggestion);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={suggestionRef}
      className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="px-4 py-2 text-gray-500 text-sm text-center">
          読み込み中...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-4 py-2 text-gray-500 text-sm text-center">
          検索結果が見つかりません
        </div>
      ) : (
        suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSelect(suggestion)}
            className={`w-full text-left px-4 py-2 text-gray-900 hover:bg-blue-50 transition-colors ${
              index === selectedIndex ? 'bg-blue-50' : ''
            }`}
          >
            {suggestion}
          </button>
        ))
      )}
    </div>
  );
}

