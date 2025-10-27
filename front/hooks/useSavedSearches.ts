'use client';

import { useState, useEffect } from 'react';
import { SearchFilters } from '@/components/pages/SearchPage';

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  timestamp: number;
}

const SAVED_SEARCHES_KEY = 'prompt-saved-searches';
const MAX_SAVED = 5;

/**
 * 保存された検索条件を管理するフック
 */
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // 初期化時にローカルストレージから保存された検索を読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedSearches(parsed);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }, []);

  // 検索条件を保存
  const saveSearch = (name: string, filters: SearchFilters) => {
    if (!name.trim()) return;

    const newSaved: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      filters,
      timestamp: Date.now(),
    };

    const updatedSearches = [newSaved, ...savedSearches].slice(0, MAX_SAVED);
    setSavedSearches(updatedSearches);

    try {
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  // 保存された検索を削除
  const removeSearch = (id: string) => {
    const updatedSearches = savedSearches.filter(search => search.id !== id);
    setSavedSearches(updatedSearches);

    try {
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to remove search:', error);
    }
  };

  // 保存された検索をクリア
  const clearSearches = () => {
    setSavedSearches([]);
    try {
      localStorage.removeItem(SAVED_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear searches:', error);
    }
  };

  return {
    savedSearches,
    saveSearch,
    removeSearch,
    clearSearches,
  };
}

