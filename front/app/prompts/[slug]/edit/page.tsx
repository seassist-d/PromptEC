'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function PromptEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [slug, setSlug] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    price: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const initializePage = async () => {
      // 認証状態の確認
      if (!authLoading && !user) {
        router.push('/auth/login');
        return;
      }

      // ユーザーIDが取得できない場合は待機
      if (!authLoading && user && !user.id) {
        console.error('User ID is not available');
        setError('認証情報が正しくありません');
        setIsLoadingData(false);
        return;
      }

      // パラメータを取得
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);

      // 認証が完了している場合のみデータを取得
      if (user && user.id) {
        // カテゴリ一覧を取得
        try {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const data = await response.json();
            setCategories(data.categories || []);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }

        // プロンプトデータを取得
        try {
          const response = await fetch(`/api/prompts/${resolvedParams.slug}`);
          if (response.ok) {
            const promptData = await response.json();
            
            // 自分のプロンプトかチェック
            if (promptData.seller_id !== user.id) {
              setError('このプロンプトを編集する権限がありません');
              setIsLoadingData(false);
              return;
            }

            setFormData({
              title: promptData.title || '',
              description: promptData.short_description || '',
              content: promptData.long_description || '',
              category_id: promptData.category_id?.toString() || '',
              price: promptData.price_jpy?.toString() || '',
              tags: '' // タグは別途取得が必要
            });
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'プロンプトの取得に失敗しました');
          }
        } catch (error) {
          console.error('Error fetching prompt:', error);
          setError('プロンプトの取得に失敗しました');
        }
      } else {
        // 認証が完了していない場合は待機
        setIsLoadingData(false);
        return;
      }
      
      setIsLoadingData(false);
    };

    initializePage();
  }, [user, authLoading, router, params]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      errors.title = 'タイトルは必須です';
    } else if (formData.title.length > 100) {
      errors.title = 'タイトルは100文字以内で入力してください';
    }

    if (!formData.description.trim()) {
      errors.description = '説明は必須です';
    } else if (formData.description.length > 200) {
      errors.description = '説明は200文字以内で入力してください';
    }

    if (!formData.content.trim()) {
      errors.content = 'プロンプト内容は必須です';
    } else if (formData.content.length > 2000) {
      errors.content = 'プロンプト内容は2000文字以内で入力してください';
    }

    if (!formData.category_id) {
      errors.category_id = 'カテゴリを選択してください';
    }

    if (!formData.price) {
      errors.price = '価格は必須です';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        errors.price = '価格は0以上の数値を入力してください';
      } else if (price > 100000) {
        errors.price = '価格は100,000円以内で設定してください';
      }
    }

    // タグのバリデーション
    if (formData.tags.trim()) {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tags.length > 10) {
        errors.tags = 'タグは10個以内で設定してください';
      }
      for (const tag of tags) {
        if (tag.length > 50) {
          errors.tags = '各タグは50文字以内で入力してください';
          break;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const promptData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await fetch(`/api/prompts/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロンプトの更新に失敗しました');
      }

      const result = await response.json();
      router.push(`/prompts/${slug}`);
    } catch (error) {
      console.error('Prompt update error:', error);
      setError(error instanceof Error ? error.message : 'プロンプトの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このプロンプトを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/prompts/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロンプトの削除に失敗しました');
      }

      router.push('/profile');
    } catch (error) {
      console.error('Prompt deletion error:', error);
      setError(error instanceof Error ? error.message : 'プロンプトの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && !isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/profile')}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            プロフィールに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              プロンプトを編集
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              プロンプトの情報を編集できます。
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 ${
                      validationErrors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="プロンプトのタイトルを入力してください"
                  />
                  {validationErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  説明 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 ${
                      validationErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="プロンプトの説明を入力してください"
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  プロンプト内容 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    name="content"
                    id="content"
                    rows={8}
                    required
                    value={formData.content}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 font-mono ${
                      validationErrors.content ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="プロンプトの内容を入力してください"
                  />
                  {validationErrors.content && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                    カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      name="category_id"
                      id="category_id"
                      required
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 ${
                        validationErrors.category_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                    >
                      <option value="">カテゴリを選択してください</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.category_id}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    価格（円） <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      max="100000"
                      step="1"
                      required
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 ${
                        validationErrors.price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="1000"
                    />
                    {validationErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  タグ
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="tags"
                    id="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 ${
                      validationErrors.tags ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="タグ1, タグ2, タグ3（カンマ区切り）"
                  />
                  {validationErrors.tags && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.tags}</p>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  複数のタグはカンマで区切って入力してください（最大10個）
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? '削除中...' : 'プロンプトを削除'}
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-gray-300 text-gray-700 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? '更新中...' : 'プロンプトを更新'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
