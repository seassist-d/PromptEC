'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TrendData {
  date: string;
  count?: number;
  amount?: number;
}

interface Rankings {
  topPrompts: Array<{ id: string; title: string; sales: number }>;
  topSellers: Array<{ id: string; name: string; revenue: number }>;
}

interface DashboardChartsProps {
  trends: {
    users: TrendData[];
    revenue: TrendData[];
  };
  comparisons: {
    usersWeekOverWeek: number;
    revenueWeekOverWeek: number;
  };
  rankings: Rankings;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardCharts({ trends, comparisons, rankings }: DashboardChartsProps) {
  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'M/d');
    } catch {
      return dateStr;
    }
  };

  // ユーザー推移データを整形
  const userChartData = trends.users.map(({ date, count }) => ({
    date: formatDate(date),
    ユーザー数: count || 0
  }));

  // 売上推移データを整形
  const revenueChartData = trends.revenue.map(({ date, amount }) => ({
    date: formatDate(date),
    売上: amount || 0
  }));

  // 増減表示
  const ComparisonCard = ({ title, value, comparison }: { title: string; value: number; comparison: number }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <div className="flex items-baseline">
        <p className="text-2xl font-bold text-gray-900">{value.toFixed(1)}%</p>
        <span className={`ml-2 text-sm ${comparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {comparison >= 0 ? '↑' : '↓'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">前週比</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 比較カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonCard 
          title="ユーザー数" 
          value={comparisons.usersWeekOverWeek} 
          comparison={comparisons.usersWeekOverWeek} 
        />
        <ComparisonCard 
          title="売上" 
          value={comparisons.revenueWeekOverWeek} 
          comparison={comparisons.revenueWeekOverWeek} 
        />
      </div>

      {/* ユーザー推移グラフ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">ユーザー数推移（過去30日）</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="ユーザー数" 
              stroke="#0088FE" 
              strokeWidth={3}
              dot={{ fill: '#0088FE', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 売上推移グラフ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">売上推移（過去30日）</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            <Bar dataKey="売上" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ランキング表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* トッププロンプト */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">トッププロンプト</h3>
          <div className="space-y-3">
            {rankings.topPrompts.length > 0 ? (
              rankings.topPrompts.map((prompt, idx) => (
                <div key={`prompt-${prompt.id || idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-400 mr-3">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{prompt.title}</p>
                      <p className="text-sm text-gray-500">{prompt.sales} views</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">データがありません</p>
            )}
          </div>
        </div>

        {/* トップ出品者 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">トップ出品者</h3>
          <div className="space-y-3">
            {rankings.topSellers.length > 0 ? (
              rankings.topSellers.map((seller, idx) => (
                <div key={`seller-${idx}-${seller.name}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-400 mr-3">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{seller.name}</p>
                      <p className="text-sm text-gray-500">{seller.revenue} 売上</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">データがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

