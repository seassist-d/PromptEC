'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateProfileClient, deleteAvatarClient } from '../../lib/profile-client';
import { validateProfileForm, validateField } from '../../lib/validations';
import { useAuth } from '../../lib/useAuth';
import type { ProfileFormData, User } from '../../types/auth';

interface ProfileEditFormProps {
  user: User;
  onSuccess?: (user: User) => void;
  onCancel?: () => void;
  onPreviewChange?: (previewUrl: string | null) => void;
}

export default function ProfileEditForm({ user, onSuccess, onCancel, onPreviewChange }: ProfileEditFormProps) {
  const { user: authUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: user.display_name || '',
    bio: user.bio || '',
    contact: {
      email: user.contact?.email || '',
      url: user.contact?.url || '',
      twitter: user.contact?.twitter || '',
      github: user.contact?.github || '',
      linkedin: user.contact?.linkedin || ''
    }
  });
  
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>(formData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar_url || '');
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 変更の監視
  useEffect(() => {
    const hasDataChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    const hasAvatarChanges = avatarFile !== null || (avatarFile === null && user.avatar_url !== avatarPreview);
    setHasChanges(hasDataChanges || hasAvatarChanges || avatarPreview !== (user.avatar_url || ''));
  }, [formData, avatarFile, avatarPreview, originalFormData, user.avatar_url]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // リアルタイムバリデーション
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
    
    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        toast.error('画像ファイルは5MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        toast.error('画像ファイルを選択してください');
        return;
      }

      setAvatarFile(file);
      setError('');

      // プレビュー画像を生成
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setAvatarPreview(previewUrl);
        // 親コンポーネントにプレビューURLを通知
        onPreviewChange?.(previewUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarDelete = async () => {
    if (!confirm('アバター画像を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Storageから削除
      if (authUser) {
        await deleteAvatarClient(authUser.id);
      }
      
      // ローカル状態を更新
      setAvatarFile(null);
      setAvatarPreview('');
      setIsDeleted(true);
      onPreviewChange?.('');
      
      // データベースも更新
      const submitData: ProfileFormData = {
        ...formData,
        avatar: null
      };
      
      const result = await updateProfileClient(submitData);
      
      if (result.success && result.user) {
        // 削除されたユーザー情報でpropsを更新
        const updatedUser = { ...user, avatar_url: undefined };
        onSuccess?.(updatedUser);
        toast.success('アバター画像を削除しました');
      } else {
        toast.error('アバター画像の削除に失敗しました');
      }
    } catch (error) {
      toast.error('アバター画像の削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const submitData: ProfileFormData = {
        ...formData,
        avatar: avatarFile || (isDeleted ? null : undefined)
      };

      // フォーム全体のバリデーション
      const validation = validateProfileForm(submitData);
      if (!validation.isValid) {
        const errors: Record<string, string> = {};
        validation.errors.forEach(error => {
          errors[error.field] = error.message;
        });
        setFieldErrors(errors);
        toast.error('入力内容を確認してください');
        return;
      }

      const result = await updateProfileClient(submitData);
      
      if (result.success && result.user) {
        toast.success('プロフィールを更新しました');
        onSuccess?.(result.user);
      } else {
        const errorMessage = result.error || 'プロフィールの更新に失敗しました';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = '予期しないエラーが発生しました';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !confirm('変更内容が失われます。キャンセルしますか？')) {
      return;
    }
    onCancel?.();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">プロフィール編集</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* アバター画像 */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div 
              className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden relative group"
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <>
                  <img 
                    src={avatarPreview} 
                    alt="アバター" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100">変更</span>
                  </div>
                </>
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              画像を変更
            </button>
            {user.avatar_url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAvatarDelete();
                }}
                disabled={isLoading}
                className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                削除
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF形式、5MB以下
            </p>
          </div>
        </div>

        {/* 表示名 */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-900 mb-2">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            required
            maxLength={50}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
              fieldErrors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="あなたの名前"
          />
          <div className="flex justify-between items-start mt-1">
            {fieldErrors.display_name && (
              <p className="text-sm text-red-600">{fieldErrors.display_name}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.display_name.length}/50
            </p>
          </div>
        </div>

        {/* 自己紹介 */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-900 mb-2">
            自己紹介
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            maxLength={500}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
              fieldErrors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="あなたについて簡単に紹介してください..."
          />
          <div className="flex justify-between items-start mt-1">
            {fieldErrors.bio && (
              <p className="text-sm text-red-600">{fieldErrors.bio}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.bio.length}/500
            </p>
          </div>
        </div>

        {/* 連絡先情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">連絡先情報</h3>
          
          <div>
            <label htmlFor="contact.email" className="block text-sm font-medium text-gray-900 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="contact.email"
              name="contact.email"
              value={formData.contact.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                fieldErrors['contact.email'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="contact@example.com"
            />
            {fieldErrors['contact.email'] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors['contact.email']}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact.url" className="block text-sm font-medium text-gray-900 mb-2">
              ウェブサイト
            </label>
            <input
              type="url"
              id="contact.url"
              name="contact.url"
              value={formData.contact.url}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                fieldErrors['contact.url'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="https://your-website.com"
            />
            {fieldErrors['contact.url'] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors['contact.url']}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact.twitter" className="block text-sm font-medium text-gray-900 mb-2">
              Twitter / X
            </label>
            <input
              type="text"
              id="contact.twitter"
              name="contact.twitter"
              value={formData.contact.twitter}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                fieldErrors['contact.twitter'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="@username"
            />
            {fieldErrors['contact.twitter'] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors['contact.twitter']}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact.github" className="block text-sm font-medium text-gray-900 mb-2">
              GitHub
            </label>
            <input
              type="text"
              id="contact.github"
              name="contact.github"
              value={formData.contact.github}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                fieldErrors['contact.github'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="username"
            />
            {fieldErrors['contact.github'] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors['contact.github']}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact.linkedin" className="block text-sm font-medium text-gray-900 mb-2">
              LinkedIn
            </label>
            <input
              type="text"
              id="contact.linkedin"
              name="contact.linkedin"
              value={formData.contact.linkedin}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                fieldErrors['contact.linkedin'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="username"
            />
            {fieldErrors['contact.linkedin'] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors['contact.linkedin']}</p>
            )}
          </div>
        </div>

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '更新中...' : '更新する'}
          </button>
        </div>
      </form>
    </div>
  );
}
