'use client';

import { useState, useRef, DragEvent } from 'react';
import ProgressBar from './ProgressBar';

interface DragDropFileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function DragDropFileUpload({
  onFileSelect,
  onUploadProgress,
  acceptedFileTypes = 'image/*',
  maxFileSize = 5 * 1024 * 1024,
  label = '画像をドラッグ&ドロップまたはクリックして選択',
  className = '',
  disabled = false,
}: DragDropFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev - 1);
    
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    
    // ファイルタイプチェック
    if (acceptedFileTypes && !file.type.match(acceptedFileTypes.replace('*', '.*'))) {
      setError('サポートされていないファイル形式です');
      return;
    }
    
    // ファイルサイズチェック
    if (file.size > maxFileSize) {
      setError(`ファイルサイズは${(maxFileSize / 1024 / 1024).toFixed(0)}MB以下にしてください`);
      return;
    }
    
    // ファイルを親コンポーネントに渡す
    onFileSelect(file);
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500 mt-1">
              クリックしてファイルを選択
            </p>
          </div>
          
          {error && (
            <div className="mt-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <ProgressBar progress={uploadProgress} label="アップロード中" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

