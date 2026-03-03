import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StrategyMetrics {
  strategy_name: string;
  description: string;
  initial_capital: number;
  current_portfolio_value: number;
  total_pnl: number;
  roi_percent: number;
  positions: any[];
  top_performers: any[];
  expected_monthly_return: number;
  expected_annual_return: number;
  win_rate: number;
  sharpe_ratio: number;
  trades_copied: number;
  winning_trades: number;
  losing_trades: number;
}

interface PerformanceData {
  date: string;
  portfolio_value: number;
  cumulative_pnl: number;
  roi_percent: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StrategyDemo() {
  const [metrics, setMetrics] = useState<StrategyMetrics | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrategyData = async () => {
      try {
        setLoading(true);
        
        // Fetch strategy metrics
        const metricsResponse = await fetch('http://localhost:3000/api/strategy/metrics');
        if (!metricsResponse.ok) throw new Error('Failed to fetch metrics');
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);

        // Fetch performance history
        const perfResponse = await fetch('http://localhost:3000/api/strategy/performance?days=30');
        if (!perfResponse.ok) throw new Error('Failed to fetch performance');
        const perfData = await perfResponse.json();
        setPerformanceHistory(perfData.performance_history);
      } catch (err) {
        setError((err as any).message);
        console.error('Error fetching strategy data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading real Polymarket data...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">⚠️ Error loading strategy</p>
          <p className="text-slate-400">{error}</p>
          <p className="text-sm text-slate-500 mt-4">Make sure the backend is running on localhost:3000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">{metrics.strategy_name}</h1>
          <p className="text-slate-400 text-lg">{metrics.description}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Current Value</p>
            <p className="text-3xl font-bold text-green-400">${metrics.current_portfolio_value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">Started with ${metrics.initial_capital.toLocaleString()}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Total P&L</p>
            <p className={`text-3xl font-bold ${metrics.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${metrics.total_pnl.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">{metrics.roi_percent.toFixed(2)}% ROI</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Expected Monthly</p>
            <p className="text-3xl font-bold text-blue-400">{metrics.expected_monthly_return.toFixed(2)}%</p>
            <p className="text-xs text-slate-500 mt-2">{metrics.expected_annual_return.toFixed(1)}% annualized</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Strategy Metrics</p>
            <p className="text-lg font-bold">
              <span className="text-amber-400">{metrics.win_rate.toFixed(1)}%</span> Win Rate
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Sharpe Ratio: <span className="text-slate-300">{metrics.sharpe_ratio.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Portfolio Growth Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Portfolio Growth (30 Days)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Line
                type="monotone"
                dataKey="portfolio_value"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Portfolio Value"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Allocation Pie Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Capital Allocation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.positions}
                  dataKey="allocation_percent"
                  nameKey="trader_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {metrics.positions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performers Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Top 5 Performers</h2>
            <div className="space-y-3">
              {metrics.top_performers.map((performer, idx) => (
                <div key={performer.address} className="border border-slate-700 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></div>
                      <p className="font-semibold text-slate-100">{performer.username}</p>
                    </div>
                    <span className="text-sm text-slate-400">{(metrics.positions[idx]?.allocation_percent || 0).toFixed(1)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      Win Rate: <span className="text-green-400">{performer.win_rate.toFixed(1)}%</span>
                    </div>
                    <div>
                      Monthly: <span className="text-blue-400">{performer.monthly_return.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Trade Statistics (30 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 mb-2">Total Trades Copied</p>
              <p className="text-3xl font-bold text-slate-100">{metrics.trades_copied}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-2">Winning Trades</p>
              <p className="text-3xl font-bold text-green-400">{metrics.winning_trades}</p>
              <p className="text-sm text-slate-500">({((metrics.winning_trades / metrics.trades_copied) * 100).toFixed(1)}%)</p>
            </div>
            <div>
              <p className="text-slate-400 mb-2">Losing Trades</p>
              <p className="text-3xl font-bold text-red-400">{metrics.losing_trades}</p>
              <p className="text-sm text-slate-500">({((metrics.losing_trades / metrics.trades_copied) * 100).toFixed(1)}%)</p>
            </div>
          </div>
        </div>

        {/* Strategy Explanation */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">How This Strategy Works</h2>
          <div className="space-y-4 text-slate-300 text-sm">
            <p>
              <span className="font-semibold text-slate-100">1. Identify Top Performers:</span> We analyze all Polymarket traders and select the top 5 based on risk-adjusted returns (Sharpe ratio).
            </p>
            <p>
              <span className="font-semibold text-slate-100">2. Allocate Proportionally:</span> Capital is allocated based on each trader's historical Sharpe ratio, ensuring we follow the best performers most closely.
            </p>
            <p>
              <span className="font-semibold text-slate-100">3. Copy All Trades:</span> When your allocated traders make a trade, you automatically copy it at your proportional size.
            </p>
            <p>
              <span className="font-semibold text-slate-100">4. Real Results:</span> This dashboard shows what your portfolio would look like after 30 days of copying real Polymarket trades at scale.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Start Copying?</h3>
          <p className="text-slate-200 mb-6">
            Sign up to activate this strategy and start earning from the best Polymarket traders.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition">
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
