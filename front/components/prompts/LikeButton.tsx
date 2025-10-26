'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

interface LikeButtonProps {
  promptId: string;
  promptSlug?: string; // slugが利用可能な場合は使用
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export default function LikeButton({
  promptId,
  promptSlug,
  initialLikeCount = 0,
  initialIsLiked = false,
  showCount = true,
  size = 'md',
  variant = 'default',
}: LikeButtonProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デバッグ用: ステートの変更を監視
  useEffect(() => {
    console.log('LikeButton state changed:', { 
      isLiked, 
      likeCount, 
      isLoading, 
      error,
      renderCount: likeCount 
    });
  }, [isLiked, likeCount, isLoading, error]);

  // 認証状態に応じていいね状態を更新
  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, promptId]);

  const checkLikeStatus = async () => {
    if (!user) return;

    try {
      // slugが利用可能な場合はそれを使用
      if (promptSlug) {
        const response = await fetch(`/api/prompts/${promptSlug}/like`);
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked);
          setLikeCount(data.likeCount);
        }
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      setError('いいねするにはログインが必要です');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // slugが利用可能な場合はそれを使用、なければIDを使用
      const endpoint = promptSlug 
        ? `/api/prompts/${promptSlug}/like`
        : `/api/prompts/${promptId}/like`;
      
      console.log('Calling API:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('API Error:', data);
        setError(data.error || 'いいねの処理に失敗しました');
        return;
      }

      const data = await response.json();
      
      console.log('API Response received:', data);
      
      // APIレスポンスの値をそのまま使用（楽観的更新なし）
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
      
      console.log('State updated:', {
        isLiked: data.isLiked,
        likeCount: data.likeCount
      });
    } catch (error) {
      console.error('Like error:', error);
      setError('いいねの処理に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // サイズに応じたスタイル
  const sizeStyles = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  // デフォルトスタイル
  const defaultButtonStyle = `
    ${sizeStyles[size]}
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${
      isLiked
        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
    }
    ${variant === 'minimal' ? 'border-0 bg-transparent hover:bg-gray-50' : ''}
  `;

  if (!user) {
    return (
      <button
        onClick={() => setError('いいねするにはログインが必要です')}
        className={defaultButtonStyle}
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {showCount && <span data-testid="like-count">{likeCount}</span>}
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={handleToggleLike}
        disabled={isLoading}
        className={defaultButtonStyle}
        aria-label={isLiked ? 'いいねを取り消す' : 'いいねする'}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
        {showCount && (
          <span data-testid="like-count" className="font-medium">
            {likeCount}
          </span>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

