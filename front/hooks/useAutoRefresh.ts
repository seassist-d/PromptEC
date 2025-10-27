import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  callback: () => void;
  intervalMs: number;
  enabled?: boolean;
}

export function useAutoRefresh({ callback, intervalMs, enabled = true }: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // callbackを常に最新に保つ
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // インターバル設定（callbackRef.currentを使用することで再レンダリングを防ぐ）
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs, enabled]);

  return {
    refreshNow: callback,
  };
}

