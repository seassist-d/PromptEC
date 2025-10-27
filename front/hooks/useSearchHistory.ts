'use client';

import { useState, useEffect } from 'react';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

const SEARCH_HISTORY_KEY = 'prompt-search-history';
const MAX_HISTORY = 10;

/**
 * 検索履歴を管理するフック
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 初期化時にローカルストレージから履歴を読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // 検索履歴を保存
  const saveSearch = (query: string) => {
    if (!query.trim()) return;

    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...history.filter(item => item.query !== query.trim())
    ].slice(0, MAX_HISTORY);

    setHistory(newHistory);
    
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // 検索履歴を削除
  const removeSearch = (query: string) => {
    const newHistory = history.filter(item => item.query !== query);
    setHistory(newHistory);
    
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to remove search history:', error);
    }
  };

  // 検索履歴をクリア
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  return {
    history,
    saveSearch,
    removeSearch,
    clearHistory,
  };
}

