'use client';

import { useState, useEffect } from 'react';

interface ReviewFormProps {
  promptId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment?: string;
  } | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  promptId,
  existingReview,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('評価を選択してください');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt_id: promptId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'レビューの投稿に失敗しました');
      }

      onSuccess();
    } catch (err) {
      console.error('レビュー投稿エラー:', err);
      setError(err instanceof Error ? err.message : 'レビューの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarButton = ({ value }: { value: number }) => (
    <button
      type="button"
      onClick={() => setRating(value)}
      className={`text-2xl ${
        rating >= value
          ? 'text-yellow-400'
          : 'text-gray-300 hover:text-yellow-300'
      } transition-colors`}
    >
      ★
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          評価
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <StarButton key={value} value={value} />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-900 mb-2">
          レビューコメント（任意）
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="レビューを入力してください..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '投稿中...' : existingReview ? '更新' : '投稿'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}

