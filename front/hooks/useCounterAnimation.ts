import { useEffect, useState } from 'react';

/**
 * 数値をカウントアップアニメーションで表示するためのフック
 * @param targetValue 目標値
 * @param duration アニメーション時間（ミリ秒）
 * @returns 現在の表示値
 */
export function useCounterAnimation(targetValue: number, duration = 1000) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // 値が変わった場合のみアニメーション
    if (displayValue === targetValue) return;

    let startTime: number | null = null;
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // イージング関数: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // 数値を補間
      const currentValue = Math.floor(startValue + (targetValue - startValue) * eased);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // アニメーション完了時に正確な値に設定
        setDisplayValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  // 初期値は即座に設定（初回レンダリング時のみ）
  useEffect(() => {
    if (displayValue === 0 && targetValue !== 0) {
      setDisplayValue(targetValue);
    }
  }, []);

  return displayValue;
}

