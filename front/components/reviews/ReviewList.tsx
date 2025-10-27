'use client';

import { useState } from 'react';
import { Review } from '@/types/prompt';

interface ReviewListProps {
  promptId: string;
  reviews: Review[];
  currentUserId?: string;
  onReviewUpdate?: () => void;
}

export default function ReviewList({
  promptId,
  reviews,
  currentUserId,
  onReviewUpdate
}: ReviewListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    if (!confirm('レビューを削除しますか？')) {
      return;
    }

    setDeletingId(reviewId);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'レビューの削除に失敗しました');
      }

      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (err) {
      console.error('レビュー削除エラー:', err);
      setError(err instanceof Error ? err.message : 'レビューの削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const getStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        レビューはまだありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {review.user_name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{review.user_name || '不明なユーザー'}</p>
                <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
              </div>
            </div>
            
            {currentUserId === review.user_id && (
              <button
                onClick={() => handleDelete(review.id)}
                disabled={deletingId === review.id}
                className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
              >
                {deletingId === review.id ? '削除中...' : '削除'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 text-lg">{getStars(review.rating)}</span>
            <span className="text-sm text-gray-700">{review.rating}/5</span>
          </div>

          {review.comment && (
            <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}

