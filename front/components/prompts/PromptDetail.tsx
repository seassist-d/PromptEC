'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PromptDetail as PromptDetailType, Review } from '@/types/prompt';
import { useAuth } from '@/lib/useAuth';
import AddToCartButton from '../cart/AddToCartButton';
import LikeButton from './LikeButton';
import ReviewForm from '../reviews/ReviewForm';
import ReviewList from '../reviews/ReviewList';

interface PromptDetailProps {
  slug: string;
}

export default function PromptDetail({ slug }: PromptDetailProps) {
  const [prompt, setPrompt] = useState<PromptDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const { user } = useAuth();

  // レビュー
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [existingReview, setExistingReview] = useState<{ id: string; rating: number; comment?: string } | null>(null);
  const [canReview, setCanReview] = useState(false);

  // ---- fetch ----
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/prompts/${slug}`);
        if (!res.ok) throw new Error(res.status === 404 ? 'プロンプトが見つかりません' : 'エラーが発生しました');
        const data = await res.json();
        setPrompt(data);
        await fetchReviews(data.id);
        if (user) await checkCanReview(data.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    fetchPrompt();
  }, [slug, user]);

  const fetchReviews = async (promptId: string) => {
    try {
      const res = await fetch(`/api/reviews?prompt_id=${promptId}`);
      if (!res.ok) throw new Error('レビューの取得に失敗しました');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    }
  };

  const checkCanReview = async (promptId: string) => {
    if (!user) return setCanReview(false);
    const mine = reviews.find(r => r.user_id === user.id);
    setCanReview(!mine);
    if (mine) setExistingReview({ id: mine.id, rating: mine.rating, comment: mine.comment || '' });
  };

  const refetchPrompt = async () => {
    try {
      const res = await fetch(`/api/prompts/${slug}`);
      if (res.ok) setPrompt(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleDeletePrompt = async () => {
    if (!confirm('このプロンプトを削除しますか？この操作は取り消せません。')) return;
    try {
      const res = await fetch(`/api/prompts/${slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'プロンプトの削除に失敗しました');
      }
      window.location.href = '/profile';
    } catch (e) {
      alert(e instanceof Error ? e.message : 'プロンプトの削除に失敗しました');
    }
  };

  const handleReviewSubmit = async () => {
    setShowReviewForm(false);
    setExistingReview(null);
    if (!prompt) return;
    await fetchReviews(prompt.id);
    if (user) await checkCanReview(prompt.id);
    await refetchPrompt();
  };
  const handleReviewUpdate = async () => {
    if (!prompt) return;
    await fetchReviews(prompt.id);
    if (user) await checkCanReview(prompt.id);
    await refetchPrompt();
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    return (
      <>
        {Array.from({ length: full }).map((_, i) => (
          <svg key={i} className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
        {hasHalf && (
          <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        )}
      </>
    );
  };

  // ----------------- Tabs -----------------
  type TabKey = 'overview' | 'reviews' | 'related';
  const tabFromHash = (hash: string): TabKey => {
    const key = (hash?.replace('#', '') || '') as TabKey;
    return ['overview', 'reviews', 'related'].includes(key) ? key : 'overview';
  };
  const [activeTab, setActiveTab] = useState<TabKey>(() => tabFromHash(typeof window !== 'undefined' ? window.location.hash : ''));
  useEffect(() => {
    const onHash = () => setActiveTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const switchTab = (key: TabKey) => {
    setActiveTab(key);
    // URLハッシュも同期（戻る操作に対応）
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `#${key}`);
  };

  const relatedCount = prompt?.related_prompts?.length ?? 0;

  const TABS = useMemo(
    () => ([
      { key: 'overview' as const, label: '概要' },
      { key: 'reviews'  as const, label: `レビュー（${reviews.length}）` },
      { key: 'related'  as const, label: `関連プロンプト（${relatedCount}）` },
    ]),
    [reviews.length, relatedCount]
  );

  // ----------------- Skeleton / Error -----------------
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse">
          <div className="h-7 bg-zinc-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-zinc-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-zinc-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-5 bg-zinc-200 rounded w-5/6"></div>
              <div className="h-5 bg-zinc-200 rounded w-4/6"></div>
              <div className="h-5 bg-zinc-200 rounded w-3/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-rose-700 mb-2">エラー</h1>
        <p className="text-zinc-600 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors">
          再試行
        </button>
      </div>
    );
  }
  if (!prompt) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-3">プロンプトが見つかりません</h1>
        <p className="text-zinc-600 mb-6">指定されたプロンプトは存在しないか、削除されています。</p>
        <Link href="/search" className="inline-flex items-center justify-center bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors">
          検索画面に戻る
        </Link>
      </div>
    );
  }

  // ----------------- Main -----------------
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="px-8 lg:px-16">
      {/* パンくず */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-zinc-500">
          <li><Link href="/" className="hover:text-neutral-900">ホーム</Link></li>
          <li>/</li>
          <li><Link href="/search" className="hover:text-neutral-900">検索</Link></li>
          <li>/</li>
          <li><Link href={`/search?category=${prompt.category_id}`} className="hover:text-neutral-900">{prompt.category_name}</Link></li>
          <li>/</li>
          <li className="text-neutral-900 font-medium line-clamp-1">{prompt.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8">
        {/* メイン */}
        <div className="space-y-6">
          {/* ヒーロー / 基本情報（タブの上） */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* 写真 */}
              <div className="w-[200px] h-[200px] bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                {prompt.thumbnail_url ? (
                  <img src={prompt.thumbnail_url} alt={prompt.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-zinc-400">
                    <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* 写真の右側：カテゴリと作成日、タイトル、出品者 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/search?category=${prompt.category_id}`}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-zinc-100 text-neutral-800 border border-zinc-200"
                  >
                    {prompt.category_name}
                  </Link>
                  <span className="text-xs text-zinc-500">作成日: {formatDate(prompt.created_at)}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">{prompt.title}</h1>
                {/* 出品者 */}
                <div className="text-sm text-neutral-900">
                  <span className="text-zinc-500">出品者：</span>
                  <span className="font-medium">{prompt.seller_name}</span>
                </div>
                {/* 価格 */}
                <div>
                  <div className="text-sm text-zinc-500 mb-1">価格</div>
                  <div className="text-2xl font-semibold text-neutral-900">{formatPrice(prompt.price_jpy)}</div>
                </div>
                {/* アクションボタン */}
                {user && user.id === prompt.seller_id ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/prompts/${prompt.slug}/edit`}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-black text-center transition-colors whitespace-nowrap"
                    >
                      プロンプトを編集
                    </Link>
                    <button
                      onClick={handleDeletePrompt}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors whitespace-nowrap"
                    >
                      プロンプトを削除
                    </button>
                  </div>
                ) : (
                  user && user.id !== prompt.seller_id && (
                    <div className="flex items-center gap-2">
                      <AddToCartButton
                        promptId={prompt.id}
                        promptData={{ title: prompt.title, price_jpy: prompt.price_jpy, thumbnail_url: prompt.thumbnail_url }}
                        className="!px-3 !py-3 !rounded-lg"
                      />
                      <LikeButton
                        promptId={prompt.id}
                        promptSlug={prompt.slug}
                        initialLikeCount={prompt.like_count}
                        showCount
                        size="md"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {prompt.avg_rating && prompt.avg_rating > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(prompt.avg_rating)}</div>
                  <span className="text-sm text-zinc-700 font-medium">
                    {prompt.avg_rating.toFixed(1)}（{prompt.ratings_count}件）
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* ーーーーーー タブ ーーーーーー */}
          <div className="mt-2">
            {/* Tablist */}
            <div role="tablist" aria-label="Prompt detail tabs" className="border-b border-zinc-200 flex gap-1">
              {TABS.map(({ key, label }) => {
                const selected = activeTab === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`panel-${key}`}
                    id={`tab-${key}`}
                    onClick={() => switchTab(key)}
                    className={[
                      'px-4 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors',
                      selected
                        ? 'bg-white text-neutral-900 border-x border-t border-zinc-200 -mb-px'
                        : 'text-zinc-600 hover:text-neutral-900'
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Panels */}
            <div className="border-x border-b border-zinc-200 rounded-b-lg bg-white">
              {/* 概要 */}
              <div
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="tab-overview"
                hidden={activeTab !== 'overview'}
                className="p-5 sm:p-6 space-y-6"
              >
                <section className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">概要</h2>
                  <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {prompt.short_description || prompt.long_description}
                  </p>
                </section>

                {prompt.sample_output && (
                  <section className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900">プロンプト（サンプル）</h3>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <pre className="text-sm text-neutral-800 whitespace-pre-wrap font-mono">
                        {prompt.sample_output}
                      </pre>
                    </div>
                  </section>
                )}

              </div>

              {/* レビュー */}
              <div
                role="tabpanel"
                id="panel-reviews"
                aria-labelledby="tab-reviews"
                hidden={activeTab !== 'reviews'}
                className="p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">レビュー（{reviews.length}）</h2>
                  {canReview && !showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:bg-black transition-colors"
                    >
                      レビューを投稿
                    </button>
                  )}
                </div>

                {showReviewForm && prompt && user && (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <h3 className="text-base font-semibold text-neutral-900 mb-3">
                      {existingReview ? 'レビューを編集' : 'レビューを投稿'}
                    </h3>
                    <ReviewForm
                      promptId={prompt.id}
                      existingReview={existingReview}
                      onSuccess={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}

                <ReviewList
                  promptId={prompt.id}
                  reviews={reviews}
                  currentUserId={user?.id}
                  onReviewUpdate={handleReviewUpdate}
                />
              </div>

              {/* 関連 */}
              <div
                role="tabpanel"
                id="panel-related"
                aria-labelledby="tab-related"
                hidden={activeTab !== 'related'}
                className="p-5 sm:p-6 space-y-4"
              >
                {relatedCount === 0 ? (
                  <p className="text-sm text-zinc-600">関連プロンプトはまだありません。</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {prompt.related_prompts!.map((related) => (
                      <Link
                        key={related.id}
                        href={`/prompts/${related.slug}`}
                        className="bg-white rounded-lg border border-zinc-200 hover:shadow-sm transition-shadow"
                      >
                        <div className="p-4">
                          <div className="aspect-video bg-zinc-100 rounded mb-3 overflow-hidden">
                            {related.thumbnail_url ? (
                              <img src={related.thumbnail_url} alt={related.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <h3 className="font-medium text-neutral-900 mb-2 line-clamp-2">{related.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-900 font-semibold">{formatPrice(related.price_jpy)}</span>
                            {related.avg_rating && related.avg_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span className="text-xs text-zinc-600">{related.avg_rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ーーーーーー /タブ ーーーーーー */}
        </div>

      </div>
      </div>
    </div>
  );
}
