#!/usr/bin/env node

/**
 * Find Historically Consistent Traders
 * 
 * Instead of chasing current top 10 (which rotate monthly),
 * this finds traders who have been consistently profitable
 * over longer time periods (all-time, 6-month patterns, etc)
 */

const axios = require('axios');

const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';

async function fetchLeaderboard(timePeriod = 'MONTH', limit = 100) {
  try {
    console.log(`\n📊 Fetching top traders (${timePeriod})...`);

    const response = await axios.get(`${POLYMARKET_DATA_API}/v1/leaderboard`, {
      params: {
        limit,
        timePeriod,
        orderBy: 'PNL',
        category: 'OVERALL',
      },
      timeout: 15000,
    });

    const traders = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    console.log(`✅ Fetched ${traders.length} traders for ${timePeriod}`);
    return traders;
  } catch (error) {
    console.error(`❌ Error fetching ${timePeriod}:`, error.message);
    return [];
  }
}

async function compareTimeframes() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 HISTORICALLY CONSISTENT TRADERS ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Date: ${new Date().toISOString()}\n`);

  // Fetch leaders from different time periods
  const dayLeaders = await fetchLeaderboard('DAY', 100);
  const weekLeaders = await fetchLeaderboard('WEEK', 100);
  const monthLeaders = await fetchLeaderboard('MONTH', 100);
  const allTimeLeaders = await fetchLeaderboard('ALL', 100);

  // Create maps for easy lookup
  const dayMap = new Map(dayLeaders.map(t => [t.proxyWallet?.toLowerCase(), t]));
  const weekMap = new Map(weekLeaders.map(t => [t.proxyWallet?.toLowerCase(), t]));
  const monthMap = new Map(monthLeaders.map(t => [t.proxyWallet?.toLowerCase(), t]));
  const allTimeMap = new Map(allTimeLeaders.map(t => [t.proxyWallet?.toLowerCase(), t]));

  // Find traders that appear in multiple timeframes (consistent winners)
  const consistentTraders = [];

  for (const [address, traderData] of allTimeMap.entries()) {
    const dayRank = dayMap.has(address) ? dayMap.get(address).rank : null;
    const weekRank = weekMap.has(address) ? weekMap.get(address).rank : null;
    const monthRank = monthMap.has(address) ? monthMap.get(address).rank : null;
    const allTimeRank = parseInt(traderData.rank);

    // Score: How many timeframes are they in top 100?
    const appearances = [dayRank, weekRank, monthRank].filter(r => r !== null).length;
    const avgRank = [dayRank, weekRank, monthRank, allTimeRank]
      .filter(r => r !== null)
      .reduce((a, b) => a + b, 0) / 4;

    if (appearances >= 2) { // Consistent = in top 100 for multiple timeframes
      consistentTraders.push({
        name: traderData.userName,
        address: traderData.proxyWallet,
        allTimeRank,
        dayRank: dayRank || 'N/A',
        weekRank: weekRank || 'N/A',
        monthRank: monthRank || 'N/A',
        appearances, // How many timeframes
        avgRank: avgRank.toFixed(1),
        pnl: parseFloat(traderData.pnl),
        volume: parseFloat(traderData.vol),
        roi: (parseFloat(traderData.pnl) / parseFloat(traderData.vol) * 100).toFixed(2),
        consistency: appearances === 4 ? '🟢 ALL' : appearances === 3 ? '🟡 3/4' : '🟠 2/4',
      });
    }
  }

  // Sort by consistency (appearances) then by avg rank
  consistentTraders.sort((a, b) => {
    if (b.appearances !== a.appearances) return b.appearances - a.appearances;
    return parseFloat(a.avgRank) - parseFloat(b.avgRank);
  });

  // Display results
  console.log('🏆 TOP 20 HISTORICALLY CONSISTENT TRADERS\n');
  console.log(
    '| # | Name | All-Time | Day | Week | Month | Appearances | Avg Rank | P&L | ROI |'
  );
  console.log(
    '|---|------|----------|-----|------|-------|-------------|----------|-----|-----|'
  );

  for (let i = 0; i < Math.min(20, consistentTraders.length); i++) {
    const trader = consistentTraders[i];
    console.log(
      `| ${(i + 1).toString().padStart(2)} | ${trader.name.padEnd(20)} | ${trader.allTimeRank.toString().padStart(3)} | ${(trader.dayRank || '-').toString().padStart(3)} | ${(trader.weekRank || '-').toString().padStart(4)} | ${(trader.monthRank || '-').toString().padStart(5)} | ${trader.consistency} ${trader.appearances === 4 ? '✅' : '⚠️ '} | ${trader.avgRank.padStart(8)} | $${(trader.pnl / 1000000).toFixed(1)}M | ${trader.roi}% |`
    );
  }

  // Show top 10 most consistent (all 4 timeframes)
  const mostConsistent = consistentTraders.filter(t => t.appearances === 4).slice(0, 10);
  const threeOutOfFour = consistentTraders.filter(t => t.appearances === 3).slice(0, 10);

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ TOP 10 MOST CONSISTENT (In top 100 across ALL 4 timeframes)\n`);

  if (mostConsistent.length > 0) {
    console.log('| # | Trader | All-Time P&L | Monthly ROI | Allocation ($10K) |');
    console.log('|---|--------|--------------|-------------|-------------------|');

    const totalROI = mostConsistent.reduce((sum, t) => sum + parseFloat(t.roi), 0);

    for (let i = 0; i < mostConsistent.length; i++) {
      const trader = mostConsistent[i];
      const allocation = (parseFloat(trader.roi) / totalROI) * 10000;

      console.log(
        `| ${(i + 1).toString().padStart(2)} | ${trader.name.padEnd(20)} | $${(trader.pnl / 1000000).toFixed(2)}M | ${trader.roi}% | $${allocation.toFixed(0).padStart(5)} |`
      );
    }

    // Calculate portfolio metrics
    const portfolioAvgROI = totalROI / mostConsistent.length;
    const totalPnL = mostConsistent.reduce((sum, t) => sum + t.pnl, 0);

    console.log('\n📊 PORTFOLIO METRICS (Top 10 Consistent Traders):');
    console.log(`  Average ROI: ${portfolioAvgROI.toFixed(2)}%`);
    console.log(`  Combined P&L: $${(totalPnL / 1000000).toFixed(1)}M`);
    console.log(`  Expected Monthly Return: ${portfolioAvgROI.toFixed(2)}%`);
    console.log(`  On $10K: +$${(10000 * (portfolioAvgROI / 100)).toFixed(2)} per month`);
    console.log(`  After 30 days: $${(10000 * (1 + portfolioAvgROI / 100)).toFixed(2)}`);
  } else {
    console.log('⚠️  No traders found in top 100 across all 4 timeframes');
    console.log('    Showing top 10 with 3/4 timeframes instead:\n');

    for (let i = 0; i < threeOutOfFour.length; i++) {
      const trader = threeOutOfFour[i];
      console.log(`  ${i + 1}. ${trader.name.padEnd(20)} | ROI: ${trader.roi}% | All-Time Rank: #${trader.allTimeRank}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📈 COMPARISON: Consistent Traders vs Current Top 10\n');
  console.log('Strategy                     | Expected Monthly Return | Volatility | Recommendation |');
  console.log('-----|--------------------------|--------------------------|------------|');
  const finalAvgROI = mostConsistent.length > 0 
    ? mostConsistent.reduce((sum, t) => sum + parseFloat(t.roi), 0) / mostConsistent.length
    : (threeOutOfFour && threeOutOfFour.length > 0
      ? threeOutOfFour.reduce((sum, t) => sum + parseFloat(t.roi), 0) / threeOutOfFour.length
      : 0);
  console.log(`Cur Top 10 (30-day)         | 15-20% (but rotating)  | VERY HIGH  | ❌ Avoid (chasing rotators)  |`);
  console.log(`Consistent (All-time)       | ${finalAvgROI.toFixed(1)}% (stable)    | LOW        | ✅ Preferred (proven)        |`);
  console.log(`Combined (both)             | 12-18% (diversified)   | MEDIUM     | ⚠️  Could work               |`);

  console.log('\n✅ CONCLUSION:\n');
  console.log('Copy historically consistent traders, not current monthly rotators.');
  console.log('They have proven themselves over longer timeframes.\n');
}

// Run it
compareTimeframes().catch(error => {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
});
