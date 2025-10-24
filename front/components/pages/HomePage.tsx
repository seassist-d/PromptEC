'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

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

    fetchCategories();
  }, []);

  const categoryIcons: { [key: string]: string } = {
    'ライティング': '✍️',
    'マーケティング': '📈',
    'プログラミング': '💻',
    'デザイン': '🎨',
    'ビジネス': '💼',
    '教育': '📚',
    'クリエイティブ': '🎭',
    'テクノロジー': '⚡',
    'ライフスタイル': '🌟',
    'エンターテイメント': '🎬',
    'ヘルスケア': '🏥',
    'ファイナンス': '💰',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              プロンプトを売買しよう
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              AIプロンプトのマーケットプレイスで、高品質なプロンプトを購入・販売
            </p>
            
            {/* ヒーロー検索バー */}
            <div className="max-w-2xl mx-auto mb-8">
              <form action="/search" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  placeholder="プロンプトを検索..."
                  className="w-full px-6 py-4 bg-white text-gray-900 placeholder-gray-500 border-0 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  検索
                </button>
              </form>
            </div>
            
            <div className="space-x-4">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    出品プロンプトを確認
                  </Link>
                  <Link
                    href="/prompts/create"
                    className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    プロンプトを出品
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  無料で始める
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 特集エリア - 人気プロンプト */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            人気のプロンプト
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* プロンプトカード（サンプル） */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">サンプル画像</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    プロンプトタイトル {item}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    このプロンプトは高品質なAI生成を可能にします。詳細な説明がここに表示されます。
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">4.8 (123)</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">¥1,200</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/search"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              すべてのプロンプトを見る
            </Link>
          </div>
        </div>
      </section>

      {/* カテゴリ一覧 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            カテゴリから探す
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center p-6 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${category.id}`}
                  className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-4xl mb-3">
                    {categoryIcons[category.name] || '📝'}
                  </span>
                  <span className="text-sm font-medium text-gray-900 text-center">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐPromptECを始めよう
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            高品質なプロンプトを購入したり、自作のプロンプトを販売したりできます
          </p>
          <div className="space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  出品プロンプトを確認
                </Link>
                <Link
                  href="/prompts/create"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  プロンプトを出品
                </Link>
                <Link
                  href="/search"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  プロンプトを探す
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  無料でアカウント作成
                </Link>
                <Link
                  href="/search"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  プロンプトを探す
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
