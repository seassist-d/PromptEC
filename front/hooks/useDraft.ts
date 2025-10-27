'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DraftData {
  [key: string]: any;
}

/**
 * localStorageを利用したドラフト保存フック
 * @param key ストレージのキー
 * @param initialData 初期データ
 * @param debounceDelay 保存の遅延時間（ミリ秒）
 */
export function useDraft(
  key: string,
  initialData: DraftData = {},
  debounceDelay: number = 1000
) {
  const [data, setData] = useState<DraftData>(initialData);
  const [isDraftAvailable, setIsDraftAvailable] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 初期化時にドラフトを読み込み
  useEffect(() => {
    const savedDraft = localStorage.getItem(key);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setData(parsed);
        setIsDraftAvailable(true);
        setLastSaved(new Date(parsed._savedAt || Date.now()));
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [key]);

  // データが変更されたら自動保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(data).length > 0) {
        saveDraft(data);
      }
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [data, debounceDelay]);

  // ドラフトを保存
  const saveDraft = useCallback((draftData: DraftData) => {
    try {
      setIsSaving(true);
      const dataWithMeta = {
        ...draftData,
        _savedAt: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(dataWithMeta));
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setIsSaving(false);
    }
  }, [key]);

  // ドラフトを削除
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setIsDraftAvailable(false);
      setLastSaved(null);
      setData(initialData);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key, initialData]);

  // データを更新
  const updateData = useCallback((newData: Partial<DraftData>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  return {
    data,
    setData,
    updateData,
    saveDraft,
    clearDraft,
    isDraftAvailable,
    lastSaved,
    isSaving,
  };
}

