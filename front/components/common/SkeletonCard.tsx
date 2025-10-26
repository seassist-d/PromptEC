'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 card-hover">
      {/* サムネイル */}
      <div className="relative overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%]"></div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* カテゴリタグ */}
        <div className="flex space-x-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* タイトル */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
        </div>
        
        {/* 説明 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" style={{ animationDelay: '0.15s' }}></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* 評価と価格 */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="w-4 h-4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${star * 0.1}s` }}></div>
              ))}
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-6 w-20 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

