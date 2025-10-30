'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import SkeletonCard from '@/components/common/SkeletonCard';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Prompt {
  id: string;
  title: string;
  slug: string;
  seller_id: string;
  category_id: number;
  thumbnail_url?: string;
  price_jpy: number;
  short_description: string;
  avg_rating: number;
  ratings_count: number;
  view_count: number;
  like_count: number;
  created_at: string;
  categories?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [recommended, setRecommended] = useState<Array<{
    seller_id: string;
    display_name: string;
    totalLikes: number;
    totalReviews: number;
    latestDate: string;
    specialty: string;
  }>>([]);

  // 初回マウント時にスクロール位置を最上部へ固定し、復元を無効化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
      } catch {}
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    return () => {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      } catch {}
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPopularPrompts = async () => {
      try {
        const response = await fetch('/api/prompts/popular');
          if (response.ok) {
            const data = await response.json();
            setPrompts(data.prompts || []);
          }
      } catch (error) {
        console.error('Error fetching popular prompts:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };

    fetchCategories();
    fetchPopularPrompts();
  }, []);

  // 表示用カテゴリ名の差し替え（既存名 → 要望のカテゴリ名）
  const CATEGORY_NAME_MAP: Record<string, string> = {
    'ライティング': 'ライター・編集者',
    'マーケティング': 'マーケティング・広告',
    'プログラミング': 'プログラマー・開発者',
    'デザイン': 'デザイナー・クリエイター',
    'ビジネス': '経営者・マネージャー',
    '教育': '教育・トレーニング',
    'クリエイティブ': 'デザイナー・クリエイター',
    'テクノロジー': '研究・開発',
    'ライフスタイル': '旅行・観光',
    'エンターテイメント': 'デザイナー・クリエイター',
    'ヘルスケア': '医療・ヘルスケア',
    'ファイナンス': '金融・会計',

    // 追加の差し替え指定
    'ライター・編集者': 'マーケティング・広告',
    'ブログ執筆': '営業・カスタマーサポート',
    'JavaScript': 'デザイナー・クリエイター',
    'UIデザイン': 'プログラマー・開発者',
    'Python': '人事・採用担当',
    'プログラマー・開発者': 'ライター・編集者',
    'グラフィックデザイン': '経営者・マネージャー',
    '技術文書': '金融・会計',
    'マーケティング・広告': '法務・コンプライアンス',
    'Web開発': '医療・ヘルスケア',
    'デザイナー・クリエイター': '教育・トレーニング',
    'Webデザイン': '研究・開発',

    // 新規カテゴリ（自己マッピングで明示）
    'イベント・プロジェクトマネージメント': 'イベント・プロジェクトマネージメント',
    '不動産・建設': '不動産・建設',
    '旅行・観光': '旅行・観光',
  };

  const normalizeCategoryName = (name?: string | null): string => {
    if (!name) return '未分類';
    return CATEGORY_NAME_MAP[name] ?? name;
  };

  // prompts からプロンプターを推定しておすすめを作成
  useEffect(() => {
    if (!prompts || prompts.length === 0) {
      setRecommended([]);
      return;
    }
    const bySeller: Record<string, {
      seller_id: string;
      totalLikes: number;
      totalReviews: number;
      latestDate: string;
      categories: Record<string, number>;
    }> = {};

    for (const p of prompts) {
      const s = p.seller_id;
      if (!bySeller[s]) {
        bySeller[s] = { seller_id: s, totalLikes: 0, totalReviews: 0, latestDate: p.created_at, categories: {} };
      }
      bySeller[s].totalLikes += p.like_count || 0;
      bySeller[s].totalReviews += p.ratings_count || 0;
      if (new Date(p.created_at) > new Date(bySeller[s].latestDate)) {
        bySeller[s].latestDate = p.created_at;
      }
      const cat = normalizeCategoryName(p.categories?.name);
      bySeller[s].categories[cat] = (bySeller[s].categories[cat] || 0) + 1;
    }

    const sellers = Object.values(bySeller)
      .sort((a, b) => {
        if (b.totalLikes !== a.totalLikes) return b.totalLikes - a.totalLikes;
        if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
        return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
      })
      .slice(0, 3)
      .map((s) => {
        const specialty = Object.entries(s.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '未分類';
        return {
          seller_id: s.seller_id,
          display_name: `プロンプター ${s.seller_id.slice(0, 6)}`,
          totalLikes: s.totalLikes,
          totalReviews: s.totalReviews,
          latestDate: s.latestDate,
          specialty,
        };
      });
    setRecommended(sellers);
  }, [prompts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-48">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            AIプロンプトをシェアしよう
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-blue-100">
              ChatGPT・Claude・Gemini対応の高品質プロンプトを、探す・買う・売る
              <br />
              PromptECが、あなたのAI活用を次のステージへ導く
            </p>
            
            <div className="space-x-4">
              {user ? (
                <>
                  <Link
                    href="/search"
                    className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    プロンプトを探す
                  </Link>
                  <Link
                    href="/prompts/create"
                    className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold backdrop-blur-sm bg-white/10 hover:bg-white hover:text-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    プロンプトを販売
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-block border-2 border-white text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg text-base sm:text-lg font-semibold backdrop-blur-sm bg-white/10 hover:bg-white hover:text-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg animate-pulse-glow"
                >
                  無料で始める
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 特集エリア - 人気プロンプト */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            人気のプロンプト
          </h2>
          <div className="space-y-4">
            {loadingPrompts ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))
            ) : prompts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">人気プロンプトがありません</h3>
                <p className="mt-1 text-sm text-gray-500">評価されたプロンプトが表示されます。</p>
              </div>
            ) : (
              prompts.map((prompt, index) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="group block py-6 border-t border-gray-200"
                >
                  {/* 上段: ランク + サムネイル + 情報  |  価格 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start min-w-0">
                      {/* ランク番号 */}
                      <div className="flex-shrink-0 pt-1 mr-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shadow-md ${
                            index === 0
                              ? 'bg-yellow-400'
                              : index === 1
                              ? 'bg-gray-500'
                              : index === 2
                              ? 'bg-amber-600'
                              : 'bg-gray-200'
                          } ${index < 3 ? 'text-white' : 'text-black'}`}
                        >
                          {index + 1}
                        </div>
                      </div>
                      {/* サムネ + タイトル/カテゴリ/評価 を同一ブロックにまとめる */}
                      <div className="min-w-0">
                        <div className="flex items-start min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 ml-1 mr-4">
                              {prompt.thumbnail_url ? (
                                <img 
                                  src={prompt.thumbnail_url} 
                                  alt={prompt.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-xl">📝</span>
                                </div>
                              )}
                            </div>
                          </div>
                            <div className="min-w-0 ml-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1.5">
                              {prompt.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-block bg-blue-100 text-blue-800 text-[9px] font-semibold px-1 py-0.5 rounded border border-blue-200">
                                {normalizeCategoryName(prompt.categories?.name)}
                              </span>
                              
                            </div>
                          </div>
                        </div>
                        {/* 写真の下に説明 + いいね/コメント */}
                        <div className="mt-2 flex-1 pr-4 min-w-0">
                          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-normal break-words">
                            {prompt.short_description}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {prompt.like_count}
                            </span>
                            <button
                              type="button"
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/prompts/${prompt.slug}#reviews`);
                              }}
                            >
                              <span role="img" aria-label="comments">💬</span>
                              {prompt.ratings_count}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 価格 */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-black">
                        ¥{prompt.price_jpy.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* アイテム境界線は親のborder-tで表現 */}
                </Link>
              ))
            )}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/search"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 active:scale-95"
            >
              人気プロンプト一覧を見る
            </Link>
          </div>
        </div>
      </section>

      {/* カテゴリ一覧 */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            カテゴリから探す
          </h2>
          {loading ? (
            <div className="grid gap-y-6 gap-x-8 justify-center grid-cols-[repeat(2,10rem)] sm:grid-cols-[repeat(3,12rem)]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center p-4 rounded-3xl animate-pulse border w-40 sm:w-48 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                  <div className="w-10 h-10 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-14"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-y-6 gap-x-8 justify-center grid-cols-[repeat(2,10rem)] sm:grid-cols-[repeat(3,12rem)]">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${category.id}`}
                  className="flex flex-col items-center p-4 rounded-3xl transition-colors border w-40 sm:w-48 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                >
                  <span className="text-xs font-medium text-gray-900 text-center">
                    {normalizeCategoryName(category.name)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* おすすめプロンプター セクション（1行3人） */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-10 text-center">
            おすすめプロンプター
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recommended.map((p) => (
              <div
                key={p.seller_id}
                className="flex flex-col items-center p-5 rounded-3xl border bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-gray-200">
                  <img
                    src={'/placeholder.png'}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 名前 */}
                <div className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">
                  {p.display_name}
                </div>

                {/* 専門領域（小さめバッジ） */}
                <div className="mt-1">
                  <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-200">
                    専門: {p.specialty}
                  </span>
                </div>

                {/* 実績（フォロワーは表示しない） */}
                <div className="mt-2 text-[11px] sm:text-xs text-gray-600 text-center">
                  いいね <span className="font-semibold">{p.totalLikes}</span> ・ レビュー <span className="font-semibold">{p.totalReviews}</span>
                </div>

                {/* CTA */}
                <a
                  href={`/prompters/${p.seller_id}`}
                  className="mt-3 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 transition"
                >
                  プロンプターを見に行く
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/prompters"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:shadow-md hover:from-blue-700 hover:to-purple-700 transition"
            >
              すべてのプロンプターを見る
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
