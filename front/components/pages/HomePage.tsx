'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  categories?: { id: number; name: string; slug: string } | null;
  user_profiles?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// 1文字ずつ表示するアニメーションコンポーネント
const AnimatedText = ({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <motion.span
          key={`${text}-char-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.05,
            ease: 'easeOut',
          }}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const { user } = useAuth();
  const [recommended, setRecommended] = useState<Array<{
    seller_id: string;
    display_name: string;
    avatar_url: string | null;
    totalLikes: number;
    totalReviews: number;
    totalPurchases: number;
    latestDate: string;
    specialty: string;
  }>>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'; } catch {}
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    return () => { try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto'; } catch {} };
  }, []);

  const fetchPopularPrompts = async () => {
    try {
      const r = await fetch('/api/prompts/popular');
      if (r.ok) setPrompts((await r.json()).prompts || []);
    } catch (e) {
      console.error('Error fetching popular prompts:', e);
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const r = await fetch('/api/categories');
        if (r.ok) setCategories((await r.json()).categories || []);
      } catch (e) {
        console.error('Error fetching categories:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
    fetchPopularPrompts();
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchPopularPrompts();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const CATEGORY_NAME_MAP: Record<string, string> = {
    'ライティング': 'ライター・編集者',
    'マーケティング': 'マーケティング・広告',
    'プログラミング': 'プログラマー・開発者',
    'デザイン': 'デザイナー・クリエイター',
    'ビジネス': '経営者・マネージャー',
    '教育': '教育・トレーニング',
    'テクノロジー': '研究・開発',
    'ライフスタイル': '旅行・観光',
    'ファイナンス': '金融・会計',
  };
  const normalizeCategoryName = (name?: string | null) => name ? (CATEGORY_NAME_MAP[name] ?? name) : '未分類';

  useEffect(() => {
    const fetchRecommended = async () => {
      if (!prompts?.length) return setRecommended([]);
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const p of prompts) {
        if (!seen.has(p.seller_id)) {
          seen.add(p.seller_id);
          ids.push(p.seller_id);
          if (ids.length >= 3) break;
        }
      }
      const stats: Record<string, { likes: number; reviews: number; categories: Record<string, number> }> = {};
      const profiles: Record<string, { name: string | null; avatar: string | null }> = {};
      for (const p of prompts) {
        if (!ids.includes(p.seller_id)) continue;
        stats[p.seller_id] = stats[p.seller_id] || { likes: 0, reviews: 0, categories: {} };
        stats[p.seller_id].likes += p.like_count || 0;
        stats[p.seller_id].reviews += p.ratings_count || 0;
        const cat = normalizeCategoryName(p.categories?.name);
        stats[p.seller_id].categories[cat] = (stats[p.seller_id].categories[cat] || 0) + 1;

        if (p.user_profiles && !profiles[p.seller_id]) {
          profiles[p.seller_id] = {
            name: p.user_profiles.display_name,
            avatar: p.user_profiles.avatar_url,
          };
        }
      }
      const rec = ids.map((id) => {
        const s = stats[id];
        const topCat = Object.entries(s?.categories || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || '未分類';
        return {
          seller_id: id,
          display_name: profiles[id]?.name || `プロンプター ${id.slice(0, 6)}`,
          avatar_url: profiles[id]?.avatar || null,
          totalLikes: s?.likes || 0,
          totalReviews: s?.reviews || 0,
          totalPurchases: 0,
          latestDate: new Date().toISOString(),
          specialty: topCat,
        };
      });
      setRecommended(rec);
    };
    fetchRecommended();
  }, [prompts]);

  // --- ハイライト用スコア（UI用途のみ） ---
  const { maxScore, scoreMap } = useMemo(() => {
    const scores = recommended.map(p => ({ id: p.seller_id, score: p.totalLikes * 2 + p.totalReviews * 3 }));
    const max = Math.max(1, ...scores.map(s => s.score));
    return { maxScore: max, scoreMap: Object.fromEntries(scores.map(s => [s.id, s.score])) as Record<string, number> };
  }, [recommended]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* === Hero Section（上は既存のまま想定） === */}
      <section className="relative flex items-center justify-center min-h-[85vh] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/60 overflow-hidden">
        {/* 背景グラデーション層1: メインのグラデーション */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent_80%)]"
        />
        
        {/* 背景グラデーション層2: 補助的なグラデーション */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,rgba(59,130,246,0.08),transparent_70%)]"
        />
        
        {/* 背景グラデーション層3: アクセント */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_60%_at_80%_80%,rgba(96,165,250,0.06),transparent_60%)]"
        />
        
        {/* 微細なパターン効果 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative text-center px-6 sm:px-10 max-w-4xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.15] tracking-tight">
            <motion.span 
              className="block text-slate-800 drop-shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedText text="AIの答えは" delay={0.2} />
            </motion.span>
            <motion.span 
              className="block bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <AnimatedText text="プロンプトで決まる" delay={0.4} />
            </motion.span>
          </h1>
          <motion.p 
            className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <AnimatedText text="“引き出し方”が変われば、成果が変わる" delay={1.4} />
          </motion.p>

          <motion.div 
            className="mt-12 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.5 }}
          >
            {user ? (
              <>
                <Link
                  href="/search"
                  className="rounded-xl px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  プロンプトを探す
                </Link>
                <Link
                  href="/prompts/create"
                  className="rounded-xl px-8 py-3 text-base font-semibold text-indigo-700 border-2 border-indigo-300 bg-white/80 backdrop-blur-sm hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  プロンプトを販売
                </Link>
              </>
            ) : (
              <Link
                href="/auth/register"
                className="rounded-xl px-10 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                無料で始める
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* === 人気プロンプト（現状維持） === */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center text-neutral-900 mb-8 sm:mb-12">
            人気のプロンプト
          </h2>

          <div className="space-y-4">
            {loadingPrompts ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-zinc-200 animate-pulse">
                  <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 rounded w-full" />
                    <div className="h-3 bg-zinc-200 rounded w-5/6" />
                  </div>
                </div>
              ))
            ) : prompts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-neutral-900">人気プロンプトがありません</h3>
                <p className="mt-1 text-sm text-zinc-600">評価されたプロンプトが表示されます。</p>
              </div>
            ) : (
              prompts.map((prompt, index) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="group block py-6 border-t border-zinc-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start min-w-0">
                      <div className="flex-shrink-0 pt-1 mr-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shadow ${
                            index < 3 ? 'text-white' : 'text-neutral-800'
                          } ${
                            index === 0
                              ? 'bg-amber-500'
                              : index === 1
                              ? 'bg-zinc-500'
                              : index === 2
                              ? 'bg-amber-700'
                              : 'bg-zinc-200'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-start min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 ml-1 mr-4">
                              {prompt.thumbnail_url ? (
                                <img
                                  src={prompt.thumbnail_url}
                                  alt={prompt.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-zinc-400 text-xl">📝</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2 leading-snug mb-1.5">
                              {prompt.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-block bg-zinc-100 text-neutral-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-zinc-200">
                                {normalizeCategoryName(prompt.categories?.name)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex-1 pr-4 min-w-0">
                          <p className="text-zinc-700 text-xs sm:text-sm leading-relaxed break-words">
                            {prompt.short_description}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {prompt.like_count}
                            </span>
                            <button
                              type="button"
                              className="flex items-center gap-1 hover:text-neutral-700 transition-colors"
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

                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-semibold text-neutral-900">
                        ¥{prompt.price_jpy.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl px-7 py-3 text-sm sm:text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1E4ED8] transition-colors shadow-sm"
            >
              人気プロンプト一覧を見る
            </Link>
          </div>
        </div>
      </section>

      {/* === カテゴリ一覧（PC最適サイズ・淡いブルー） === */}
      <section className="py-24 lg:py-32 bg-[#F6FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center text-neutral-900 mb-16">
            カテゴリから探す
          </h2>

          <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
            {[
              { id: 1, name: 'ライター・編集者' },
              { id: 2, name: '営業・カスタマーサポート' },
              { id: 3, name: 'デザイナー・クリエイター' },
              { id: 4, name: 'プログラマー・開発者' },
              { id: 5, name: '人事・採用担当' },
              { id: 6, name: '経営者・マネージャー' },
              { id: 7, name: '金融・会計' },
              { id: 8, name: 'マーケティング・広告' },
              { id: 9, name: '医療・ヘルスケア' },
              { id: 10, name: '研究・開発' },
            ].map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.id}`}
                className="group inline-flex items-center justify-center rounded-full px-10 py-4 bg-white border border-zinc-200 hover:border-[#2563EB]/40 hover:bg-white shadow-sm hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              >
                <span className="text-base sm:text-lg font-medium text-neutral-900 group-hover:text-[#2563EB] transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === おすすめプロンプター（❤️版・カテゴリー削除） === */}
      <section className="relative py-24 lg:py-32 bg-white">
        {/* セクション切り替えを明確にする薄いグラデ"継ぎ目" */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-[#F6FAFF] to-white"
        />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center text-neutral-900 mb-16">
            おすすめプロンプター
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommended.map((p) => (
              <div
                key={p.seller_id}
                className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/40 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-5 shadow-sm ring-2 ring-[#DBEAFE]/60">
                  <img
                    src={p.avatar_url || '/placeholder.png'}
                    alt="avatar"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-3">
                  {p.display_name}
                </h3>

                <div className="flex items-center justify-center gap-4 text-sm text-zinc-600 mb-6">
                  <span>❤️ {p.totalLikes}</span>
                  <span>💬 {p.totalReviews}</span>
                </div>

                <Link
                  href={`/prompters/${p.seller_id}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#2563EB]/40 text-[#2563EB] bg-white/70 px-5 py-2.5 text-sm font-medium hover:bg-[#EFF6FF] hover:border-[#2563EB]/50 transition-all"
                >
                  プロンプターを見る
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/prompters"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1E4ED8] transition-all shadow-sm hover:shadow-md"
            >
              すべてのプロンプターを見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
