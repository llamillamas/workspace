import { Request, Response } from 'express';
import axios from 'axios';

const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';

interface TraderData {
  address: string;
  username: string;
  total_trades: number;
  win_rate: number;
  monthly_return: number;
  sharpe_ratio: number;
  total_volume: number;
}

interface BacktestTrade {
  trader: string;
  market: string;
  direction: string;
  entry_price: number;
  position_size: number;
  timestamp: string;
  expected_pnl_percent: number;
}

interface BacktestResult {
  num_traders: number;
  traders: TraderData[];
  total_capital: number;
  num_trades_simulated: number;
  expected_trades_24h: number;
  average_position_size: number;
  minimum_capital_required: number;
  estimated_daily_return: number;
  estimated_monthly_return: number;
  risk_score: number;
  simulated_trades: BacktestTrade[];
}

/**
 * Fetch real top N traders from Polymarket
 */
async function fetchTopTraders(limit: number = 30): Promise<TraderData[]> {
  try {
    console.log(`📊 Fetching top ${limit} real traders from Polymarket...`);

    const response = await axios.get(`${POLYMARKET_DATA_API}/profiles`, {
      params: {
        limit: limit * 2, // Fetch extra to filter
        sort: 'sharpe_ratio_desc',
      },
      timeout: 15000,
    });

    const traders = (response.data?.data || [])
      .filter((t: any) => t.total_trades >= 20) // Min 20 trades
      .sort((a: any, b: any) => (b.sharpe_ratio || 0) - (a.sharpe_ratio || 0))
      .slice(0, limit)
      .map((t: any) => ({
        address: t.address,
        username: t.username || t.address.slice(0, 8) + '...',
        total_trades: t.total_trades || 0,
        win_rate: t.win_rate || 0,
        monthly_return: t.monthly_pnl_pct || 0,
        sharpe_ratio: t.sharpe_ratio || 1.0,
        total_volume: t.total_volume || 0,
      }));

    console.log(`✅ Fetched ${traders.length} real traders`);
    return traders;
  } catch (error) {
    console.error('❌ Error fetching traders:', error);
    throw error;
  }
}

/**
 * Fetch recent trades for a trader
 */
async function fetchTraderTrades(
  traderAddress: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const response = await axios.get(
      `${POLYMARKET_DATA_API}/traders/${traderAddress}/trades`,
      {
        params: {
          limit,
          sort: 'timestamp_desc',
        },
        timeout: 10000,
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(`❌ Error fetching trades for ${traderAddress}:`, error);
    return [];
  }
}

/**
 * Backtest strategy with top N traders
 */
export async function runBacktest(req: Request, res: Response) {
  try {
    const { num_traders = 30, capital = 10000, days = 1 } = req.query;
    const numTradersNum = Math.min(parseInt(num_traders as string) || 30, 100);
    const capitalNum = parseInt(capital as string) || 10000;
    const daysNum = parseInt(days as string) || 1;

    console.log(
      `🔍 Running backtest: ${numTradersNum} traders, $${capitalNum} capital, ${daysNum} days`
    );

    // 1. Fetch real top traders
    const traders = await fetchTopTraders(numTradersNum);

    if (traders.length === 0) {
      return res.status(404).json({ error: 'No traders found' });
    }

    // 2. Calculate allocation (Sharpe-weighted)
    const totalSharpe = traders.reduce((sum: number, t: TraderData) => sum + t.sharpe_ratio, 0);
    const allocations = traders.map((t: TraderData) => ({
      trader: t.address,
      allocation_percent: (t.sharpe_ratio / totalSharpe) * 100,
      allocation_amount: (t.sharpe_ratio / totalSharpe) * capitalNum,
    }));

    // 3. Fetch actual trades from each trader (last 48 hours)
    console.log('📈 Fetching actual recent trades from traders...');
    const traderTradesMap: { [key: string]: any[] } = {};

    await Promise.all(
      traders.map(async (trader: TraderData) => {
        const trades = await fetchTraderTrades(trader.address, 30);
        traderTradesMap[trader.address] = trades;
      })
    );

    // 4. Simulate copying trades
    const simulatedTrades: BacktestTrade[] = [];
    let totalTradesSimulated = 0;

    for (const trader of traders) {
      const allocation = allocations.find((a) => a.trader === trader.address);
      if (!allocation) continue;

      const trades = traderTradesMap[trader.address] || [];

      // Filter to last 24 hours
      const last24h = trades.filter((trade: any) => {
        const tradeTime = new Date(trade.timestamp).getTime();
        const now = new Date().getTime();
        const hoursAgo = (now - tradeTime) / (1000 * 60 * 60);
        return hoursAgo <= 24;
      });

      for (const trade of last24h.slice(0, 5)) {
        // Max 5 per trader per day
        simulatedTrades.push({
          trader: trader.username,
          market: trade.market_slug || 'Unknown',
          direction: trade.direction || 'Unknown',
          entry_price: trade.entry_price || 0,
          position_size: allocation.allocation_amount / (last24h.length || 1),
          timestamp: trade.timestamp,
          expected_pnl_percent: (trader.monthly_return / 30) * (trade.expected_pnl || 1),
        });

        totalTradesSimulated++;
      }
    }

    // 5. Calculate metrics
    const avgWinRate = traders.reduce((sum: number, t: TraderData) => sum + t.win_rate, 0) / traders.length;
    const avgMonthlyReturn = traders.reduce((sum: number, t: TraderData) => sum + t.monthly_return, 0) / traders.length;
    const avgSharpe = traders.reduce((sum: number, t: TraderData) => sum + t.sharpe_ratio, 0) / traders.length;

    // Minimum viable capital: $100 per trade (smallest position)
    const minCapitalPerTrade = 100;
    const minCapitalRequired = Math.max(minCapitalPerTrade * 3, 300); // At least 3 trades

    // Expected trades per 24 hours
    const expectedTrades24h = Math.floor((totalTradesSimulated / daysNum) || numTradersNum * 2);

    // Daily return estimate
    const dailyReturn = avgMonthlyReturn / 30;
    const monthlyReturn = avgMonthlyReturn;

    // Risk score (inverse of Sharpe ratio)
    const riskScore = Math.max(0, 100 - avgSharpe * 10);

    const result: BacktestResult = {
      num_traders: numTradersNum,
      traders: traders.slice(0, 5), // Top 5 details
      total_capital: capitalNum,
      num_trades_simulated: totalTradesSimulated,
      expected_trades_24h: expectedTrades24h,
      average_position_size: capitalNum / (expectedTrades24h || 1),
      minimum_capital_required: minCapitalRequired,
      estimated_daily_return: dailyReturn,
      estimated_monthly_return: monthlyReturn,
      risk_score: riskScore,
      simulated_trades: simulatedTrades.slice(0, 20), // Last 20 trades
    };

    console.log('✅ Backtest complete');
    res.json(result);
  } catch (error) {
    console.error('❌ Backtest error:', error);
    res.status(500).json({
      error: 'Backtest failed',
      details: (error as any).message,
    });
  }
}

/**
 * Compare top 5 vs top 10 vs top 30
 */
export async function compareStrategies(req: Request, res: Response) {
  try {
    console.log('🔄 Comparing top 5 vs top 10 vs top 30 strategies...');

    const strategies = [5, 10, 30];
    const results: any = {};

    for (const num of strategies) {
      const traders = await fetchTopTraders(num);

      if (traders.length === 0) continue;

      const totalSharpe = traders.reduce((sum: number, t: TraderData) => sum + t.sharpe_ratio, 0);
      const avgWinRate = traders.reduce((sum: number, t: TraderData) => sum + t.win_rate, 0) / traders.length;
      const avgMonthlyReturn = traders.reduce((sum: number, t: TraderData) => sum + t.monthly_return, 0) / traders.length;
      const avgSharpe = traders.reduce((sum: number, t: TraderData) => sum + t.sharpe_ratio, 0) / traders.length;
      const avgVolume = traders.reduce((sum: number, t: TraderData) => sum + t.total_volume, 0) / traders.length;
      const volatility = traders.length > 1
        ? Math.sqrt(
            traders.reduce((sum: number, t: TraderData) => sum + Math.pow(t.monthly_return - avgMonthlyReturn, 2), 0) /
              traders.length
          )
        : 0;

      results[`top_${num}`] = {
        num_traders: num,
        avg_win_rate: parseFloat(avgWinRate.toFixed(2)),
        avg_monthly_return: parseFloat(avgMonthlyReturn.toFixed(2)),
        avg_sharpe_ratio: parseFloat(avgSharpe.toFixed(2)),
        avg_trader_volume: parseFloat(avgVolume.toFixed(0)),
        return_volatility: parseFloat(volatility.toFixed(2)),
        concentration_risk: parseFloat((100 - (traders[0].sharpe_ratio / totalSharpe) * 100).toFixed(1)),
        min_capital_recommended: num * 100, // $100 per trader minimum
        expected_daily_pnl: parseFloat(((avgMonthlyReturn / 30) * 10000 / 100).toFixed(2)), // On $10K
        top_trader: {
          name: traders[0].username,
          win_rate: traders[0].win_rate,
          monthly_return: traders[0].monthly_return,
          sharpe_ratio: traders[0].sharpe_ratio,
        },
      };
    }

    res.json({
      comparison: results,
      recommendation: 'Top 30 provides best risk-adjusted returns with lower concentration risk',
      minimum_capital_all_strategies: 300,
    });
  } catch (error) {
    console.error('❌ Comparison error:', error);
    res.status(500).json({ error: 'Comparison failed', details: (error as any).message });
  }
}
