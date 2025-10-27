'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  file: File;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export default function ImageEditor({
  file,
  onSave,
  onCancel,
  aspectRatio = 16 / 9,
  minWidth = 800,
  minHeight = 400,
}: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cropStarted, setCropStarted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  useEffect(() => {
    if (imageSrc && imageRef.current) {
      imageRef.current.onload = () => {
        if (imageRef.current) {
          const width = imageRef.current.naturalWidth;
          const height = imageRef.current.naturalHeight;
          setImageSize({ width, height });
          
          // 初期クロップエリアを設定（中央に配置）
          const initWidth = Math.min(width, minWidth);
          const initHeight = initWidth / aspectRatio;
          setCropArea({
            x: (width - initWidth) / 2,
            y: (height - initHeight) / 2,
            width: initWidth,
            height: initHeight,
          });
        }
      };
    }
  }, [imageSrc, aspectRatio, minWidth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setCropStarted(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropStarted) return;
    
    // クロップエリアの位置を更新（簡易実装）
    // 実際の実装ではより高度な機能が必要
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      imageRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], file.name, { type: file.type });
        onSave(newFile);
      }
    }, file.type);
  };

  const handleResize = (direction: string, deltaX: number, deltaY: number) => {
    // リサイズ処理（実装が必要）
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">画像を編集</h2>
        
        <div className="mb-4 relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="編集対象"
            className="max-w-full max-h-96 mx-auto block"
            style={{ display: 'none' }}
          />
          
          {/* クロップエリアのプレビュー */}
          {imageSrc && (
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="relative cursor-move"
              style={{
                width: `${imageSize.width}px`,
                height: `${imageSize.height}px`,
                margin: '0 auto',
              }}
            >
              <img
                src={imageSrc}
                alt="編集対象"
                className="w-full h-full object-contain"
              />
              
              {/* クロップオーバーレイ */}
              <div
                className="absolute border-2 border-blue-500"
                style={{
                  left: `${cropArea.x}px`,
                  top: `${cropArea.y}px`,
                  width: `${cropArea.width}px`,
                  height: `${cropArea.height}px`,
                }}
              >
                {/* リサイズハンドル */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize" />
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

