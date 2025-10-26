'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LikeButton from '../prompts/LikeButton';

interface LikedPrompt {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  price_jpy: number;
  view_count: number;
  like_count: number;
  created_at: string;
  thumbnail_url?: string;
  categories?: {
    id: number;
    name: string;
    slug: string;
  };
}

export default function LikedPromptsList() {
  const [prompts, setPrompts] = useState<LikedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLikedPrompts = async () => {
      try {
        const response = await fetch('/api/prompts/liked');
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
        } else {
          console.error('Failed to fetch liked prompts');
        }
      } catch (error) {
        console.error('Error fetching liked prompts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPrompts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">いいねしたプロンプトがありません</h3>
        <p className="mt-1 text-sm text-gray-500">プロンプトにいいねを付けると、ここに表示されます。</p>
        <div className="mt-6">
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            プロンプトを探す
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/prompts/${prompt.slug}`)}
        >
          {prompt.thumbnail_url ? (
            <div className="w-full h-48 bg-gray-200 overflow-hidden rounded-t-lg">
              <img
                src={prompt.thumbnail_url}
                alt={prompt.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center rounded-t-lg">
              <span className="text-white text-4xl">📝</span>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{prompt.title}</h4>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{prompt.short_description}</p>
            
            {prompt.categories && (
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {prompt.categories.name}
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">¥{prompt.price_jpy.toLocaleString()}</span>
                <span className="text-xs text-gray-500">
                  {new Date(prompt.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>👀 {prompt.view_count}</span>
                <LikeButton
                  promptId={prompt.id}
                  initialLikeCount={prompt.like_count}
                  showCount={false}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

