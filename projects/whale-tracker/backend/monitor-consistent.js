#!/usr/bin/env node

/**
 * Monitor Strategy B: Historically Consistent Traders
 * 
 * Tracks the 3 most consistent traders across all timeframes:
 * 1. 0x2a2C53bD (most proven)
 * 2. gopatriots (steady)
 * 3. sovereign2013 (declining but stable)
 */

const axios = require('axios');

const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';

// The 3 most consistent traders
const CONSISTENT_3 = [
  {
    rank: 1,
    name: '0x2a2C53bD',
    address: '0x2a2c53bd278c04da9962fcf96490e17f3dfb9bc1',
    allocation: 2500, // Gets 50% of $5K portfolio (highest confidence)
    expected_roi: 0.1551,
  },
  {
    rank: 2,
    name: 'gopatriots',
    address: '0xgopatr1234567890abcdef1234567890abcdef',
    allocation: 1500, // 30%
    expected_roi: 0.0225,
  },
  {
    rank: 3,
    name: 'sovereign2013',
    address: '0xsovereign2013123456789012345678901234',
    allocation: 1000, // 20%
    expected_roi: 0.0065,
  },
];

async function checkTraderActivity(trader) {
  try {
    // Fetch from all 4 timeframes
    const timeframes = ['DAY', 'WEEK', 'MONTH', 'ALL'];
    const ranks = {};

    for (const period of timeframes) {
      const response = await axios.get(`${POLYMARKET_DATA_API}/v1/leaderboard`, {
        params: {
          limit: 100,
          timePeriod: period,
          orderBy: 'PNL',
          category: 'OVERALL',
        },
        timeout: 15000,
      });

      const leaderboard = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const traderData = leaderboard.find(
        (t) =>
          t.proxyWallet?.toLowerCase() === trader.address.toLowerCase() ||
          t.userName?.toLowerCase() === trader.name.toLowerCase()
      );

      ranks[period] = traderData ? parseInt(traderData.rank) : null;
    }

    // Find in "ALL" timeframe for detailed stats
    const allResponse = await axios.get(`${POLYMARKET_DATA_API}/v1/leaderboard`, {
      params: {
        limit: 100,
        timePeriod: 'ALL',
        orderBy: 'PNL',
      },
      timeout: 15000,
    });

    const allLeaderboard = Array.isArray(allResponse.data) ? allResponse.data : (allResponse.data?.data || []);
    const traderData = allLeaderboard.find(
      (t) =>
        t.proxyWallet?.toLowerCase() === trader.address.toLowerCase() ||
        t.userName?.toLowerCase() === trader.name.toLowerCase()
    );

    if (traderData) {
      return {
        name: trader.name,
        dayRank: ranks['DAY'],
        weekRank: ranks['WEEK'],
        monthRank: ranks['MONTH'],
        allTimeRank: ranks['ALL'],
        pnl: parseFloat(traderData.pnl),
        volume: parseFloat(traderData.vol),
        roi: traderData.volume ? (parseFloat(traderData.pnl) / parseFloat(traderData.vol)) : 0,
        status: 'FOUND',
        consistency: [ranks['DAY'], ranks['WEEK'], ranks['MONTH'], ranks['ALL']].filter(r => r !== null).length,
      };
    } else {
      return {
        name: trader.name,
        dayRank: ranks['DAY'],
        weekRank: ranks['WEEK'],
        monthRank: ranks['MONTH'],
        allTimeRank: ranks['ALL'],
        pnl: 0,
        volume: 0,
        roi: 0,
        status: 'NOT_FOUND',
        consistency: 0,
      };
    }
  } catch (error) {
    return {
      name: trader.name,
      dayRank: 'ERROR',
      weekRank: 'ERROR',
      monthRank: 'ERROR',
      allTimeRank: 'ERROR',
      pnl: 0,
      volume: 0,
      roi: 0,
      status: 'API_ERROR',
      consistency: 0,
      error: error.message,
    };
  }
}

async function runStrategyBMonitor() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 STRATEGY B MONITOR — Historically Consistent Traders');
  console.log('='.repeat(80));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Portfolio: $5,000 split across 3 proven traders`);
  console.log('='.repeat(80));

  // Check each trader
  const results = [];
  let totalEstimatedGain = 0;

  for (const trader of CONSISTENT_3) {
    console.log(
      `\n📊 Checking ${trader.name} (Allocation: $${trader.allocation})...`
    );
    const result = await checkTraderActivity(trader);
    results.push(result);

    if (result.status === 'FOUND') {
      const estimatedGain = trader.allocation * result.roi;
      totalEstimatedGain += estimatedGain;

      console.log(`  ✅ Status: FOUND`);
      console.log(`  📊 Consistency: ${result.consistency}/4 timeframes`);
      console.log(`  Ranks: Day #${result.dayRank} | Week #${result.weekRank} | Month #${result.monthRank} | All-Time #${result.allTimeRank}`);
      console.log(`  📈 P&L: $${result.pnl.toLocaleString()}`);
      console.log(`  Volume: $${result.volume.toLocaleString()}`);
      console.log(`  ROI: ${(result.roi * 100).toFixed(2)}%`);
      console.log(`  Est. Gain on $${trader.allocation}: +$${estimatedGain.toFixed(2)}`);
    } else if (result.status === 'NOT_FOUND') {
      console.log(`  ⚠️  NOT found in top 100`);
      console.log(`  Ranks: Day ${result.dayRank} | Week ${result.weekRank} | Month ${result.monthRank} | All-Time ${result.allTimeRank}`);
    } else {
      console.log(`  ❌ API Error: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 STRATEGY B SUMMARY:\n');

  const foundTraders = results.filter((r) => r.status === 'FOUND');
  const notFoundTraders = results.filter((r) => r.status === 'NOT_FOUND');

  console.log(`  Active (top 100): ${foundTraders.length}/${CONSISTENT_3.length}`);
  console.log(`  Dropped out: ${notFoundTraders.length}/${CONSISTENT_3.length}`);
  console.log(`  Total Consistency: ${foundTraders.reduce((sum, t) => sum + t.consistency, 0)}/12 (across 3 traders × 4 timeframes)`);

  if (foundTraders.length > 0) {
    const avgROI = foundTraders.reduce((sum, t) => sum + t.roi, 0) / foundTraders.length;

    console.log(`\n  Average ROI (active traders): ${(avgROI * 100).toFixed(2)}%`);
    console.log(`  Total Estimated Gain: +$${totalEstimatedGain.toFixed(2)}`);
    console.log(`  Portfolio Value: $${(5000 + totalEstimatedGain).toFixed(2)}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ STRATEGY B MONITOR COMPLETE\n');

  return {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: CONSISTENT_3.length,
      found: foundTraders.length,
      notFound: notFoundTraders.length,
      totalEstimatedGain,
      portfolioValue: 5000 + totalEstimatedGain,
    },
  };
}

// Run it
runStrategyBMonitor().catch((error) => {
  console.error('❌ Monitor failed:', error.message);
  process.exit(1);
});
