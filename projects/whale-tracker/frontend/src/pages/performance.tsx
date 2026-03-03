import React, { useState } from 'react';
import StrategyPerformanceChart from '../components/StrategyPerformanceChart';

interface PerformanceMetrics {
  metric: string;
  value: string;
  target: string;
  status: 'above' | 'below' | 'on-track';
}

const PerformancePage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const performanceMetrics: PerformanceMetrics[] = [
    { metric: 'Daily Profit Target', value: '$487.23', target: '$300', status: 'above' },
    { metric: 'Win Rate', value: '76.3%', target: '65%', status: 'above' },
    { metric: 'Copy Success Rate', value: '78.9%', target: '70%', status: 'above' },
    { metric: 'Avg Trade Size', value: '$287.50', target: '$250', status: 'above' },
    { metric: 'Max Drawdown', value: '12.4%', target: '<20%', status: 'on-track' },
    { metric: 'Monthly ROI', value: '18.6%', target: '15%', status: 'above' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Strategy Performance Dashboard</h1>
          <p className="text-slate-400">
            Real-time analytics for copy-trading strategy performance
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {(['daily', 'weekly', 'monthly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Performance Overview */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((item) => (
              <div
                key={item.metric}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all"
              >
                <p className="text-slate-400 text-sm font-medium mb-2">{item.metric}</p>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-3xl font-bold text-slate-100">{item.value}</p>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      item.status === 'above'
                        ? 'bg-green-900/30 text-green-400'
                        : item.status === 'below'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-amber-900/30 text-amber-400'
                    }`}
                  >
                    {item.status === 'above' ? '↑' : item.status === 'below' ? '↓' : '→'}{' '}
                    Target: {item.target}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.status === 'above'
                        ? 'bg-green-500'
                        : item.status === 'below'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${
                        item.status === 'above'
                          ? '85%'
                          : item.status === 'below'
                          ? '45%'
                          : '72%'
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Charts */}
        <section>
          <StrategyPerformanceChart />
        </section>

        {/* Risk Analysis */}
        <section className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h2 className="text-2xl font-bold mb-6">Risk Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Portfolio Heat Map</h3>
              <div className="space-y-3">
                <RiskIndicator label="Market Concentration" value={32} color="green" />
                <RiskIndicator label="Leverage Exposure" value={15} color="green" />
                <RiskIndicator label="Whale Correlation" value={48} color="amber" />
                <RiskIndicator label="Volatility Risk" value={22} color="green" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Drawdown Analysis</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Drawdown (30d)</span>
                  <span className="font-semibold text-red-400">12.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Drawdown</span>
                  <span className="font-semibold text-amber-400">5.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recovery Time (avg)</span>
                  <span className="font-semibold text-slate-100">2.3 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sharpe Ratio</span>
                  <span className="font-semibold text-green-400">1.85</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
              <div className="space-y-2 text-sm">
                <Alert type="info" message="High volatility period detected (4h)" />
                <Alert type="warning" message="Whale 0x1234 increased position by 25%" />
                <Alert type="success" message="Copy rate at all-time high (82%)" />
                <Alert type="neutral" message="Market correlation trending down" />
              </div>
            </div>
          </div>
        </section>

        {/* Strategy Recommendations */}
        <section className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h2 className="text-2xl font-bold mb-6">Strategy Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Increase Position Size',
                description: 'Copy rate exceeds targets. Consider 10-15% increase.',
                action: 'Review',
              },
              {
                title: 'Monitor Whale 0x7890',
                description: 'Recent performance diverging from historical patterns.',
                action: 'Investigate',
              },
              {
                title: 'Reduce Concentration',
                description: '3 whales represent 45% of active copies. Diversify.',
                action: 'Adjust',
              },
              {
                title: 'Take Profit Schedule',
                description: 'Monthly ROI at 18.6%. Set trailing stop at 15%.',
                action: 'Configure',
              },
            ].map((rec, idx) => (
              <div
                key={idx}
                className="bg-slate-800 border border-slate-700 rounded p-4 flex justify-between items-start"
              >
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">{rec.title}</h4>
                  <p className="text-sm text-slate-400">{rec.description}</p>
                </div>
                <button className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-all whitespace-nowrap">
                  {rec.action}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const RiskIndicator: React.FC<{ label: string; value: number; color: 'green' | 'amber' | 'red' }> = ({
  label,
  value,
  color,
}) => (
  <div>
    <div className="flex justify-between mb-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}%</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div
        className={`h-full rounded-full ${
          color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

interface AlertProps {
  type: 'info' | 'warning' | 'success' | 'neutral';
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const colors = {
    info: 'bg-blue-900/30 text-blue-400 border-blue-700',
    warning: 'bg-amber-900/30 text-amber-400 border-amber-700',
    success: 'bg-green-900/30 text-green-400 border-green-700',
    neutral: 'bg-slate-700/30 text-slate-400 border-slate-600',
  };

  return (
    <div className={`p-2 rounded border ${colors[type]}`}>
      <p className="text-xs">{message}</p>
    </div>
  );
};

export default PerformancePage;
