'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/useAuth';
import { createImagePreview } from '@/lib/file-upload';
import { uploadPromptThumbnailWithProgress } from '@/lib/file-upload-with-progress';
import ProgressBar from '@/components/common/ProgressBar';

export default function PromptCreatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    price: '',
  });
  const [isLoading, setIsLoading] = useState(false);
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // プレビュー用state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

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
    
    const newData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newData);

    // リアルタイムバリデーション
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('ユーザー情報が見つかりません');
      }

      // サムネイル画像のアップロード（プログレスバー付き）
      let thumbnailUrl = '';
      if (thumbnailFile) {
        setUploadingThumbnail(true);
        setUploadProgress(0);
        
        const uploadResult = await uploadPromptThumbnailWithProgress(
          thumbnailFile,
          user.id,
          (progress) => {
            setUploadProgress(progress.progress);
          }
        );
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'サムネイル画像のアップロードに失敗しました');
        }
        
        thumbnailUrl = uploadResult.url || '';
        setUploadingThumbnail(false);
        setUploadProgress(0);
      }

      const promptData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        seller_id: user.id,
        thumbnail_url: thumbnailUrl
      };

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロンプトの登録に失敗しました');
      }

      const result = await response.json();
      
      router.push(`/prompts/${result.prompt.slug}`);
    } catch (error) {
      console.error('Prompt creation error:', error);
      setError(error instanceof Error ? error.message : 'プロンプトの登録に失敗しました');
      setUploadingThumbnail(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    プロンプトを登録
                  </h1>
                  <p className="text-sm text-gray-600 mt-2">
                    新しいプロンプトを登録して販売を開始しましょう。
                  </p>
                </div>
                
              </div>

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

              {/* タブ切り替え */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`${
                      activeTab === 'edit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`${
                      activeTab === 'preview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    プレビュー
                  </button>
                </nav>
              </div>

              {/* 編集タブ */}
              {activeTab === 'edit' && (
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
                    maxLength={100}
                  />
                  <div className="mt-1 flex justify-between items-center">
                    {validationErrors.title && (
                      <p className="text-sm text-red-600">{validationErrors.title}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {formData.title.length} / 100
                    </p>
                  </div>
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
                  <div className="mt-1 flex justify-between items-center">
                    {validationErrors.description && (
                      <p className="text-sm text-red-600">{validationErrors.description}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {formData.description.length} / 500
                    </p>
                  </div>
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
                  <div className="mt-1 flex justify-between items-center">
                    {validationErrors.content && (
                      <p className="text-sm text-red-600">{validationErrors.content}</p>
                    )}
                    <p className={`text-xs ml-auto ${
                      formData.content.length > 9000 ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                      {formData.content.length} / 10000
                    </p>
                  </div>
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
                  <input
                    type="file"
                    id="thumbnail"
                    name="thumbnail"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    推奨サイズ: 600x600px、最大5MB（JPEG、PNG）
                  </p>
                  {thumbnailPreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
                      <img
                        src={thumbnailPreview}
                        alt="サムネイルプレビュー"
                        className="w-[100px] h-[100px] object-cover border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                  {uploadingThumbnail && (
                    <div className="mt-3">
                      <ProgressBar
                        progress={uploadProgress}
                        label="画像をアップロード中"
                        showPercentage={true}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
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
                  {isLoading ? '登録中...' : 'プロンプトを登録'}
                </button>
              </div>
              </form>
              )}

              {/* プレビュータブ */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-300 rounded-lg p-6">
                    {/* プレビュー表示 */}
                    <div className="prose max-w-none">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {formData.title || 'タイトルが未入力です'}
                      </h1>
                      
                      {/* カテゴリ */}
                      {formData.category_id && (
                        <div className="mb-4">
                          {categories.find(c => c.id === parseInt(formData.category_id)) && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                              {categories.find(c => c.id === parseInt(formData.category_id))?.name}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* サムネイル */}
                      {thumbnailPreview && (
                        <div className="mb-4">
                          <img
                            src={thumbnailPreview}
                            alt="サムネイル"
                            className="w-[600px] h-[600px] object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                      {/* 説明 */}
                      {formData.description && (
                        <div className="mb-6">
                          <p className="text-lg text-gray-700 whitespace-pre-wrap">
                            {formData.description}
                          </p>
                        </div>
                      )}
                      
                      {/* プロンプト内容 */}
                      {formData.content && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-4">プロンプト内容</h2>
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {formData.content}
                          </pre>
                        </div>
                      )}
                      
                      {/* 価格 */}
                      {formData.price && (
                        <div className="mb-6">
                          <p className="text-2xl font-bold text-blue-600">
                            ¥{parseInt(formData.price).toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {!formData.title && !formData.description && !formData.content && (
                        <div className="text-center py-12 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <p>プロンプトを入力すると、ここにプレビューが表示されます。</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* プレビューモードでのアクション */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="bg-gray-300 text-gray-700 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      編集に戻る
                    </button>
                  </div>
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
