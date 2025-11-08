'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

interface Seller {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Prompt {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  price_jpy: number;
  short_description: string | null;
  avg_rating: number | null;
  ratings_count: number;
  like_count: number;
  view_count: number;
  created_at: string;
  categories: { id: string; name: string } | null;
}

export default function PrompterProfilePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompterData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/prompters/${sellerId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('プロンプターが見つかりません');
          } else {
            setError('データの取得に失敗しました');
          }
          return;
        }
        
        const data = await res.json();
        setSeller(data.seller);
        setPrompts(data.prompts || []);
      } catch (e) {
        setError('エラーが発生しました');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchPrompterData();
    }
  }, [sellerId]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">エラー</h1>
            <p className="text-gray-600 mb-6">{error || 'プロンプターが見つかりません'}</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* パンくず */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-zinc-500">
              <li><Link href="/" className="hover:text-neutral-900">ホーム</Link></li>
              <li>/</li>
              <li className="text-neutral-900 font-medium">プロンプター</li>
              <li>/</li>
              <li className="text-neutral-900 font-medium line-clamp-1">{seller.display_name || '未設定'}</li>
            </ol>
          </nav>

          <div className="max-w-6xl mx-auto">
            {/* プロフィール情報 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start space-x-6">
                {/* アバター */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {seller.avatar_url ? (
                      <img 
                        src={seller.avatar_url}
                        alt="アバター" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 基本情報 */}
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                    {seller.display_name || '未設定'}
                  </h1>
                  
                  {/* 自己紹介 */}
                  {seller.bio ? (
                    <div className="mb-4">
                      <p className="text-gray-600 whitespace-pre-wrap">{seller.bio}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">自己紹介はまだ設定されていません。</p>
                  )}
                </div>
              </div>
            </div>

            {/* 出品プロンプト一覧 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                出品プロンプト（{prompts.length}件）
              </h2>

              {prompts.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">プロンプトがありません</h3>
                  <p className="mt-1 text-sm text-gray-500">このプロンプターはまだプロンプトを出品していません。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prompts.map((prompt) => (
                    <Link
                      key={prompt.id}
                      href={`/prompts/${prompt.slug}`}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-4">
                        {/* サムネイル */}
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          {prompt.thumbnail_url ? (
                            <img 
                              src={prompt.thumbnail_url} 
                              alt={prompt.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* カテゴリ */}
                        {prompt.categories && (
                          <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full mb-2">
                            {prompt.categories.name}
                          </span>
                        )}

                        {/* タイトル */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {prompt.title}
                        </h3>

                        {/* 説明 */}
                        {prompt.short_description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {prompt.short_description}
                          </p>
                        )}

                        {/* 価格と評価 */}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(prompt.price_jpy)}
                          </span>
                          {prompt.avg_rating && prompt.avg_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                              <span className="text-xs text-gray-600">{prompt.avg_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* いいねと閲覧数 */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>❤️ {prompt.like_count}</span>
                          <span>👁️ {prompt.view_count}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

