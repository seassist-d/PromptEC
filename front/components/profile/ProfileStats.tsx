'use client';

interface ProfileStatsProps {
  stats: {
    promptsCount: number;
    salesCount: number;
    averageRating: number;
    totalEarnings?: number;
  };
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">統計情報</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.promptsCount}</div>
          <div className="text-sm text-gray-500">出品数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.salesCount}</div>
          <div className="text-sm text-gray-500">売上数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-gray-500">評価平均</div>
        </div>
        {stats.totalEarnings !== undefined && (
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ¥{stats.totalEarnings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">総売上</div>
          </div>
        )}
      </div>
    </div>
  );
}
