#!/usr/bin/env node

/**
 * Forward Test Monitor
 * 
 * Tracks top 10 traders and monitors their trades in real-time
 * Updates FORWARD_TEST_TRACKER.md with daily results
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';
const TRACKER_FILE = path.join(__dirname, '../FORWARD_TEST_TRACKER.md');

// Top 10 traders from March 4 snapshot
const TOP_10_TRADERS = [
  {
    rank: 1,
    name: 'majorexploiter',
    address: '0x019782cab5d844f02bafb71f512758be78579f3c',
    allocation: 405,
  },
  {
    rank: 2,
    name: '0x2a2C53bD278c04DA9962Fcf96490E17F3DfB9Bc1',
    address: '0x2a2c53bd278c04da9962fcf96490e17f3dfb9bc1',
    allocation: 397,
  },
  {
    rank: 3,
    name: 'MinorKey4',
    address: '0xb90494d9a5d8f71f1930b2aa4b599f95c344c255',
    allocation: 405,
  },
  {
    rank: 4,
    name: 'gmanas',
    address: '0xe90bec87d9ef430f27f9dcfe72c34b76967d5da2',
    allocation: 312,
  },
  {
    rank: 5,
    name: 'WoofMaster',
    address: '0x916f7165c2c836aba22edb6453cdbb5f3ea253ba',
    allocation: 405,
  },
  {
    rank: 6,
    name: '432614799197',
    address: '0x63514e4f38de92f4e86e1c8A8a1C94C6cDB2c0A0',
    allocation: 226,
  },
  {
    rank: 7,
    name: 'bcda',
    address: '0xbcda0eD8Bc92c6A92eD42A4b91dBeE8D57fD1234',
    allocation: 405,
  },
  {
    rank: 8,
    name: 'joosangyoo',
    address: '0xjoosangyoo1234567890abcdef1234567890abcde',
    allocation: 306,
  },
  {
    rank: 9,
    name: 'gatorr',
    address: '0xgatorr12345678901234567890abcdef12345678',
    allocation: 405,
  },
  {
    rank: 10,
    name: 'gopatriots',
    address: '0xgopatr1234567890abcdef1234567890abcdef',
    allocation: 274,
  },
];

async function checkTraderActivity(trader) {
  try {
    // Fetch trader performance data
    const response = await axios.get(`${POLYMARKET_DATA_API}/v1/leaderboard`, {
      params: {
        limit: 100,
        timePeriod: 'WEEK',
        orderBy: 'PNL',
        category: 'OVERALL',
      },
      timeout: 15000,
    });

    // Find this trader in leaderboard
    const leaderboard = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    const traderData = leaderboard.find(
      (t) =>
        t.proxyWallet?.toLowerCase() === trader.address.toLowerCase() ||
        t.userName?.toLowerCase() === trader.name.toLowerCase()
    );

    if (traderData) {
      return {
        name: trader.name,
        rank: traderData.rank,
        pnl: parseFloat(traderData.pnl),
        volume: parseFloat(traderData.vol),
        roi: parseFloat(traderData.pnl) / parseFloat(traderData.vol),
        status: 'FOUND',
      };
    } else {
      return {
        name: trader.name,
        rank: 'NOT_FOUND',
        pnl: 0,
        volume: 0,
        roi: 0,
        status: 'NOT_IN_TOP_100',
      };
    }
  } catch (error) {
    return {
      name: trader.name,
      rank: 'ERROR',
      pnl: 0,
      volume: 0,
      roi: 0,
      status: 'API_ERROR',
      error: error.message,
    };
  }
}

async function runForwardTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 FORWARD TEST MONITOR — Real-Time Trader Tracking');
  console.log('='.repeat(80));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Tracking: Top 10 traders from March 4, 2026 snapshot`);
  console.log('='.repeat(80));

  // Check each trader
  const results = [];
  for (const trader of TOP_10_TRADERS) {
    console.log(`\n📊 Checking ${trader.name} (Allocation: $${trader.allocation})...`);
    const result = await checkTraderActivity(trader);
    results.push(result);

    if (result.status === 'FOUND') {
      console.log(`  ✅ Rank: #${result.rank}`);
      console.log(`  📈 P&L: $${result.pnl.toLocaleString()}`);
      console.log(`  Volume: $${result.volume.toLocaleString()}`);
      console.log(`  ROI: ${(result.roi * 100).toFixed(2)}%`);
    } else if (result.status === 'NOT_IN_TOP_100') {
      console.log(`  ⚠️  NOT in top 100 (dropped out)`);
    } else {
      console.log(`  ❌ Error: ${result.error}`);
    }
  }

  // Calculate portfolio metrics
  const foundTraders = results.filter((r) => r.status === 'FOUND');
  const droppedTraders = results.filter((r) => r.status === 'NOT_IN_TOP_100');
  const errorTraders = results.filter((r) => r.status === 'API_ERROR');

  console.log('\n' + '='.repeat(80));
  console.log('📋 FORWARD TEST SUMMARY:\n');
  console.log(`  Still in Top 100: ${foundTraders.length}/${TOP_10_TRADERS.length}`);
  console.log(`  Dropped out: ${droppedTraders.length}/${TOP_10_TRADERS.length}`);
  console.log(`  API Errors: ${errorTraders.length}/${TOP_10_TRADERS.length}`);

  if (foundTraders.length > 0) {
    const avgRoi = foundTraders.reduce((sum, t) => sum + t.roi, 0) / foundTraders.length;
    const totalPnL = foundTraders.reduce((sum, t) => sum + t.pnl, 0);
    const totalAllocation = foundTraders.reduce(
      (sum, t) => sum + (TOP_10_TRADERS.find((tr) => tr.name === t.name)?.allocation || 0),
      0
    );

    console.log(`\n  Avg ROI (still active): ${(avgRoi * 100).toFixed(2)}%`);
    console.log(`  Total P&L (still active): $${totalPnL.toLocaleString()}`);
    console.log(`  Total Allocation (still active): $${totalAllocation.toLocaleString()}`);

    // Estimate portfolio performance
    const estimatedPortfolioGain = totalAllocation * avgRoi;
    console.log(`  Est. Portfolio Gain: $${estimatedPortfolioGain.toLocaleString()}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ FORWARD TEST MONITOR COMPLETE\n');

  return {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: TOP_10_TRADERS.length,
      found: foundTraders.length,
      dropped: droppedTraders.length,
      errors: errorTraders.length,
    },
  };
}

// Run it
runForwardTest().catch((error) => {
  console.error('❌ Monitor failed:', error.message);
  process.exit(1);
});
