'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { uploadPromptThumbnail, createImagePreview, deletePromptFile } from '@/lib/file-upload';

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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  // 固定カテゴリリスト
  const categories = [
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
  ];
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // サムネイル画像関連のstate
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
  // 初期化済みフラグ（useRefで永続的に保持）
  const isInitializedRef = useRef(false);
  const currentSlugRef = useRef<string>('');

  // パラメータ解決用のuseEffect
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const targetSlug = resolvedParams.slug;
      
      // slugが変更された場合は初期化状態をリセット
      if (currentSlugRef.current !== targetSlug) {
        isInitializedRef.current = false;
        currentSlugRef.current = targetSlug;
        setSlug(targetSlug);
      }
    };
    
    resolveParams();
  }, [params]);

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

      // slugが未設定の場合は待機
      if (!slug) {
        return;
      }
      
      // 既に同じslugで初期化済みの場合は再実行しない（編集内容を保護）
      if (isInitializedRef.current && currentSlugRef.current === slug) {
        setIsLoadingData(false);
        return;
      }

      // 認証が完了している場合のみデータを取得
      if (user && user.id && slug) {
        // プロンプトデータを取得
        try {
          const response = await fetch(`/api/prompts/${slug}`);
          if (response.ok) {
            const promptData = await response.json();
            
            // 自分のプロンプトかチェック
            if (promptData.seller_id !== user.id) {
              setError('このプロンプトを編集する権限がありません');
              setIsLoadingData(false);
              return;
            }

            // フォームデータを初期化（編集内容を保護するため、既に値がある場合は更新しない）
            if (!isInitializedRef.current || currentSlugRef.current !== slug) {
              // フォームデータが空の場合のみ初期値を設定
              const hasFormData = formData.title || formData.description || formData.content;
              if (!hasFormData) {
                setFormData({
                  title: promptData.title || '',
                  description: promptData.short_description || '',
                  content: promptData.long_description || '',
                  category_id: promptData.category_id?.toString() || '',
                  price: promptData.price_jpy?.toString() || '',
                });
              }
              
              // 現在のサムネイル画像URLを保存（未設定の場合のみ）
              if (promptData.thumbnail_url && !currentThumbnailUrl) {
                setCurrentThumbnailUrl(promptData.thumbnail_url);
              }
              
              isInitializedRef.current = true;
              currentSlugRef.current = slug;
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, slug]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      errors.title = 'タイトルは必須です';
    } else if (formData.title.length > 100) {
      errors.title = 'タイトルは100文字以内で入力してください';
    }

    if (!formData.description.trim()) {
      errors.description = '説明は必須です';
    } else if (formData.description.length > 500) {
      errors.description = '説明は500文字以内で入力してください';
    }

    if (!formData.content.trim()) {
      errors.content = 'プロンプト内容は必須です';
    } else if (formData.content.length > 10000) {
      errors.content = 'プロンプト内容は10000文字以内で入力してください';
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

  // サムネイル画像の選択
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルバリデーション
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください');
        return;
      }

      setThumbnailFile(file);
      setError('');

      // プレビュー画像を生成
      try {
        const preview = await createImagePreview(file);
        setThumbnailPreview(preview);
      } catch (error) {
        console.error('Preview generation error:', error);
        setError('プレビューの生成に失敗しました');
      }
    }
  };

  // サムネイル画像を削除
  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setCurrentThumbnailUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // サムネイル画像のアップロード
      let thumbnailUrl = currentThumbnailUrl || '';
      
      if (thumbnailFile && user) {
        setUploadingThumbnail(true);
        const uploadResult = await uploadPromptThumbnail(thumbnailFile, user.id);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'サムネイル画像のアップロードに失敗しました');
        }
        
        thumbnailUrl = uploadResult.url || '';
        setUploadingThumbnail(false);
      }

      const promptData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        thumbnail_url: thumbnailUrl
      };

      const response = await fetch(`/api/prompts/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        // レスポンスボディが空の場合を考慮
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (e) {
            // JSONパースエラーの場合、空のレスポンスとみなす
            errorData = {};
          }
        } else {
          errorData = {};
        }
        throw new Error(errorData.message || `プロンプトの更新に失敗しました (${response.status})`);
      }

      const result = await response.json();
      router.push(`/prompts/${result.prompt.slug}`);
    } catch (error) {
      console.error('Prompt update error:', error);
      setError(error instanceof Error ? error.message : 'プロンプトの更新に失敗しました');
      setUploadingThumbnail(false);
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
                    maxLength={500}
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
                    maxLength={10000}
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
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                  サムネイル画像
                </label>
                <div className="mt-1">
                  {/* 現在のサムネイル画像 */}
                  {currentThumbnailUrl && !thumbnailPreview && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">現在の画像:</p>
                      <div className="relative">
                        <img
                          src={currentThumbnailUrl}
                          alt="現在のサムネイル"
                          className="w-[100px] h-[100px] object-cover border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          画像を削除
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 新しい画像のプレビュー */}
                  {thumbnailPreview && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">新しい画像プレビュー:</p>
                      <img
                        src={thumbnailPreview}
                        alt="サムネイルプレビュー"
                        className="w-[100px] h-[100px] object-cover border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        className="mt-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  )}
                  
                  {/* ファイル選択 */}
                  {!thumbnailPreview && (
                    <input
                      type="file"
                      id="thumbnail"
                      name="thumbnail"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                    />
                  )}
                  
                  <p className="mt-1 text-sm text-gray-500">
                    推奨サイズ: 600x600px、最大5MB（JPEG、PNG）
                  </p>
                  
                  {uploadingThumbnail && (
                    <p className="mt-2 text-sm text-blue-600">画像をアップロード中...</p>
                  )}
                </div>
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
