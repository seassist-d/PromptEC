'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PromptDetail as PromptDetailType } from '@/types/prompt';

interface PromptDetailProps {
  slug: string;
}

export default function PromptDetail({ slug }: PromptDetailProps) {
  const [prompt, setPrompt] = useState<PromptDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/prompts/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('プロンプトが見つかりません');
          }
          throw new Error('エラーが発生しました');
        }
        
        const data = await response.json();
        setPrompt(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [slug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラー</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">プロンプトが見つかりません</h1>
          <p className="text-gray-600 mb-4">指定されたプロンプトは存在しないか、削除されています。</p>
          <Link
            href="/search"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            検索画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-blue-600">ホーム</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/search" className="hover:text-blue-600">検索</Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/search?category=${prompt.category_id}`} className="hover:text-blue-600">
              {prompt.category_name}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{prompt.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側: 商品情報 */}
        <div className="space-y-6">
          {/* サムネイル */}
          <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg overflow-hidden">
            {prompt.thumbnail_url ? (
              <img
                src={prompt.thumbnail_url}
                alt={prompt.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <Link
              href={`/search?category=${prompt.category_id}`}
              className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
            >
              {prompt.category_name}
            </Link>
          </div>

          {/* タイトル */}
          <h1 className="text-3xl font-bold text-gray-900">
            {prompt.title}
          </h1>

          {/* 価格 */}
          <div className="text-3xl font-bold text-blue-600">
            {formatPrice(prompt.price_jpy)}
          </div>

          {/* 評価と統計 */}
          <div className="space-y-3">
            {prompt.avg_rating && prompt.avg_rating > 0 ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(prompt.avg_rating)}
                </div>
                <span className="text-lg font-medium text-gray-600">
                  {prompt.avg_rating.toFixed(1)} ({prompt.ratings_count}件のレビュー)
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">まだ評価がありません</span>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>👁️ {prompt.view_count} 回閲覧</span>
              <span>❤️ {prompt.like_count} いいね</span>
            </div>
          </div>

          {/* 購入ボタン */}
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            カートに追加
          </button>

          {/* 出品者情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">出品者</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {prompt.seller_avatar ? (
                  <img
                    src={prompt.seller_avatar}
                    alt={prompt.seller_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-semibold">
                    {prompt.seller_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{prompt.seller_name}</p>
                <p className="text-sm text-gray-600">出品者</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右側: 詳細情報 */}
        <div className="space-y-6">
          {/* 説明 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">説明</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {prompt.long_description || prompt.short_description}
              </p>
            </div>
          </div>

          {/* プロンプト */}
          {prompt.sample_output && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">プロンプト</h2>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {prompt.sample_output}
                </pre>
              </div>
            </div>
          )}

          {/* レビュー */}
          {prompt.reviews && prompt.reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">レビュー</h2>
              <div className="space-y-4">
                {prompt.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          {review.user_avatar ? (
                            <img
                              src={review.user_avatar}
                              alt={review.user_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 text-xs font-semibold">
                              {review.user_name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">{review.user_name}</span>
                      </div>
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 作成日 */}
          <div className="text-sm text-gray-500">
            作成日: {formatDate(prompt.created_at)}
          </div>
        </div>
      </div>

      {/* 関連プロンプト */}
      {prompt.related_prompts && prompt.related_prompts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">関連プロンプト</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {prompt.related_prompts.map((related) => (
              <Link
                key={related.id}
                href={`/prompts/${related.slug}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded mb-3 overflow-hidden">
                    {related.thumbnail_url ? (
                      <img
                        src={related.thumbnail_url}
                        alt={related.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {related.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-bold">
                      {formatPrice(related.price_jpy)}
                    </span>
                    {related.avg_rating && related.avg_rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {related.avg_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
