import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface PerformanceData {
  date: string;
  dailyProfit: number;
  cumulativeProfit: number;
  roi: number;
  copyCount: number;
  successRate: number;
  avgTradeSize: number;
}

interface StrategyMetrics {
  totalProfit: number;
  totalROI: number;
  winRate: number;
  successfulCopies: number;
  failedCopies: number;
  averageHoldTime: number;
  bestDay: string;
  worstDay: string;
}

// Mock data generator for demonstration
const generateMockPerformanceData = (): PerformanceData[] => {
  const data: PerformanceData[] = [];
  let cumulativeProfit = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    
    // Simulate realistic trading performance
    const dailyProfit = (Math.random() - 0.3) * 500 + 200; // Bias slightly positive
    cumulativeProfit += dailyProfit;
    const roi = ((cumulativeProfit / 10000) * 100).toFixed(2);
    const copyCount = Math.floor(Math.random() * 15) + 5;
    const successRate = 65 + Math.random() * 30; // 65-95% success rate
    const avgTradeSize = Math.random() * 500 + 200;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dailyProfit: parseFloat(dailyProfit.toFixed(2)),
      cumulativeProfit: parseFloat(cumulativeProfit.toFixed(2)),
      roi: parseFloat(roi),
      copyCount,
      successRate: parseFloat(successRate.toFixed(1)),
      avgTradeSize: parseFloat(avgTradeSize.toFixed(2)),
    });
  }
  
  return data;
};

const calculateMetrics = (data: PerformanceData[]): StrategyMetrics => {
  if (data.length === 0) {
    return {
      totalProfit: 0,
      totalROI: 0,
      winRate: 0,
      successfulCopies: 0,
      failedCopies: 0,
      averageHoldTime: 0,
      bestDay: 'N/A',
      worstDay: 'N/A',
    };
  }

  const lastData = data[data.length - 1];
  const totalProfit = lastData.cumulativeProfit;
  const totalROI = lastData.roi;
  const avgWinRate = data.reduce((sum, d) => sum + d.successRate, 0) / data.length;
  const totalCopies = data.reduce((sum, d) => sum + d.copyCount, 0);
  
  // Estimate success/failure based on average success rate
  const successfulCopies = Math.floor(totalCopies * (avgWinRate / 100));
  const failedCopies = totalCopies - successfulCopies;

  // Find best and worst days
  let bestDay = data[0];
  let worstDay = data[0];
  data.forEach((d) => {
    if (d.dailyProfit > bestDay.dailyProfit) bestDay = d;
    if (d.dailyProfit < worstDay.dailyProfit) worstDay = d;
  });

  return {
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    totalROI: parseFloat(totalROI.toFixed(2)),
    winRate: parseFloat(avgWinRate.toFixed(1)),
    successfulCopies,
    failedCopies,
    averageHoldTime: 4.5, // Mock value: avg 4.5 hours
    bestDay: bestDay.date,
    worstDay: worstDay.date,
  };
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-3 rounded border border-slate-700">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="text-xs"
          >
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const StrategyPerformanceChart: React.FC = () => {
  const performanceData = useMemo(() => generateMockPerformanceData(), []);
  const metrics = useMemo(() => calculateMetrics(performanceData), [performanceData]);

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Copy-Trading Strategy Performance
        </h2>
        <p className="text-slate-400">30-day rolling performance analysis</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Profit"
          value={`$${metrics.totalProfit.toFixed(2)}`}
          change={metrics.totalROI}
          changeLabel="ROI %"
          positive={metrics.totalProfit > 0}
        />
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          change={metrics.successfulCopies}
          changeLabel="Successful Copies"
          positive={metrics.winRate > 50}
        />
        <MetricCard
          label="Copy Trades"
          value={`${metrics.successfulCopies + metrics.failedCopies}`}
          change={metrics.successfulCopies}
          changeLabel="Successful"
          positive={true}
        />
        <MetricCard
          label="Avg Hold Time"
          value={`${metrics.averageHoldTime.toFixed(1)}h`}
          change={metrics.failedCopies}
          changeLabel="Failed"
          positive={false}
        />
      </div>

      {/* Daily Profit Chart */}
      <div className="bg-slate-800 rounded p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Daily Profit Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              interval={4}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="dailyProfit"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Daily P&L"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative ROI Chart */}
      <div className="bg-slate-800 rounded p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Cumulative ROI & Copy Count</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              interval={4}
            />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="roi"
              stroke="#3b82f6"
              strokeWidth={2}
              name="ROI %"
              dot={false}
            />
            <Bar
              yAxisId="right"
              dataKey="copyCount"
              fill="#8b5cf6"
              opacity={0.6}
              name="Copies/Day"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Success Rate Chart */}
      <div className="bg-slate-800 rounded p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Copy Success Rate (30-Day)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              interval={4}
            />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Success Rate %"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Summary */}
      <div className="bg-slate-800 rounded p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Strategy Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Best Performing Day</p>
            <p className="text-slate-100 font-semibold">{metrics.bestDay}</p>
          </div>
          <div>
            <p className="text-slate-400">Worst Performing Day</p>
            <p className="text-slate-100 font-semibold">{metrics.worstDay}</p>
          </div>
          <div>
            <p className="text-slate-400">Total Trade Volume</p>
            <p className="text-slate-100 font-semibold">
              ${(metrics.successfulCopies * 250).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Avg Trade Size</p>
            <p className="text-slate-100 font-semibold">$250 - $350</p>
          </div>
        </div>
      </div>

      {/* Weekly Performance Breakdown */}
      <div className="bg-slate-800 rounded p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Weekly Performance</h3>
        <div className="space-y-2 text-sm">
          {[
            { week: 'Week 1', profit: '$245.30', roi: '2.45%', copies: 32, success: '72%' },
            { week: 'Week 2', profit: '$512.45', roi: '5.12%', copies: 41, success: '78%' },
            { week: 'Week 3', profit: '$387.20', roi: '3.87%', copies: 38, success: '75%' },
            { week: 'Week 4', profit: '$621.80', roi: '6.22%', copies: 45, success: '82%' },
          ].map((week) => (
            <div key={week.week} className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="font-semibold text-slate-300">{week.week}</span>
              <div className="flex gap-4">
                <span className="text-green-400">{week.profit}</span>
                <span className="text-blue-400">{week.roi}</span>
                <span className="text-purple-400">{week.copies} trades</span>
                <span className="text-amber-400">{week.success}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  positive: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, changeLabel, positive }) => (
  <div className="bg-slate-800 rounded p-4 border border-slate-700">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-slate-100 mt-2">{value}</p>
    <p className={`text-xs mt-2 ${positive ? 'text-green-400' : 'text-red-400'}`}>
      {changeLabel}: {change >= 0 ? '+' : ''}{change}
    </p>
  </div>
);

export default StrategyPerformanceChart;
