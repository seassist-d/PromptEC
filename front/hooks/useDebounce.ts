'use client';

import { useState, useEffect } from 'react';

/**
 * デバウンスフック
 * 指定された遅延時間後に値を更新します
 * @param value デバウンス対象の値
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 遅延時間後に値を更新
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // クリーンアップ関数：次のエフェクト実行前にタイマーをクリア
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 検索クエリ専用のデバウンスフック
 * @param query 検索クエリ
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた検索クエリ
 */
export function useDebounceSearch(query: string, delay: number = 300): string {
  return useDebounce(query, delay);
}

