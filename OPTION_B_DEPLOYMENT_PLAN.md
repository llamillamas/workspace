# Option B Deployment Plan — 2-Week Signal Validation

**Status:** READY TO DEPLOY (waiting for API Fix to complete)  
**Decision:** Phase 0 Option A failed → Escalating to Option B  
**Start Time:** Mar 5, 2026, 18:20 UTC (once API Fix confirms working)  
**End Time:** Mar 12, 2026, 18:20 UTC (7 days later)  
**Expected Data:** ~2,000 market windows (statistically conclusive)

---

## What is Option B?

**Continuous data collection + real-time backtesting for 7 days.**

Instead of trying to backtest historical data (hard to get), we:
1. **Start collectors NOW** — Binance + Polymarket real-time feeds
2. **Collect live data** — 2 weeks of actual market activity
3. **Backtest continuously** — As data arrives, validate 4 signals
4. **By Mar 12** — Have 2,000+ windows to determine if any signal has real edge

---

## Three Collector Services

### Service 1: Binance Price Collector
```
Endpoint: wss://fstream.binance.com:9443
Asset: BTC/USDT
Frequency: Every 1 second
Duration: Mar 5 18:20 → Mar 12 18:20 (7 days)
Storage: JSONL (polymarket/data/binance_prices.jsonl)
Format: {timestamp, open, high, low, close, volume}
No auth: Public WebSocket (no API key needed)
```

### Service 2: Polymarket Order Book Collector
```
Endpoint: wss://ws-subscriptions-clob.polymarket.com/ws/market
Markets: BTC up/down 5m windows (auto-discover)
Frequency: Every 10 seconds
Duration: 7 days continuous
Storage: JSONL (polymarket/data/orderbooks.jsonl)
Format: {timestamp, market_id, bids, asks, spread, imbalance}
No auth: Public WebSocket
```

### Service 3: Polymarket Resolution Tracker
```
Method: Poll Gamma API every 5 minutes
Check: Which markets resolved, what was the outcome?
Storage: CSV (polymarket/data/resolutions.csv)
Format: {market_id, resolution_time, outcome (UP/DOWN)}
Truth Source: Cross-check with polymarket.com UI
Duration: 7 days
```

---

## Four Signals Being Tested

### Signal 1: Order Flow Imbalance
- **Logic:** (bid_volume - ask_volume) / (bid_volume + ask_volume)
- **Threshold:** Ratio > 0.05 (predict UP) or < -0.05 (predict DOWN)
- **Data source:** Order book snapshots
- **Hypothesis:** More buyers than sellers = price rises

### Signal 2: Cross-Exchange Momentum
- **Logic:** BTC price change on Binance in last 60 seconds before resolution
- **Threshold:** +0.1% (predict UP) or -0.1% (predict DOWN)
- **Data source:** Binance 1-second candlesticks
- **Hypothesis:** Binance moves first, Polymarket follows

### Signal 3: Polymarket Contrarian
- **Logic:** If market prices YES > 0.65 (overbought UP), predict DOWN
- **Threshold:** YES > 0.65 or YES < 0.35
- **Data source:** Polymarket market prices
- **Hypothesis:** Crowds overshoot; reversals profitable

### Signal 4: Volatility Filter
- **Logic:** Only trade if 5-min volatility is in sweet spot (0.3% - 1.0% per 5 min)
- **Threshold:** Calculate realized vol, filter out too-calm/too-wild windows
- **Data source:** Binance 1-second prices
- **Hypothesis:** Edge works only in certain volatility regimes

---

## Backtesting Framework

**Runs continuously as data arrives:**

```
For each 5-minute market window:
  1. Get Binance price data (1 min before → resolution)
  2. Get Polymarket order book (leading up to resolution)
  3. Get actual outcome (from resolution tracker)
  4. Calculate Signal 1, 2, 3, 4 scores
  5. Generate prediction (UP/DOWN/SKIP)
  6. Compare to actual outcome
  7. Update win rates + statistics
```

**Real-time reporting:**
- Every 100 windows: Print interim results
- Every 500 windows: Update statistical significance (t-tests, p-values)
- Daily: Full report with current win rates

---

## Success Criteria

### For each signal:
- **Viable:** Win rate > 52% + p-value < 0.10 (100+ windows)
- **Real:** Win rate > 52% + p-value < 0.05 (500+ windows)
- **Strong:** Win rate > 54% + p-value < 0.01 (1,000+ windows)

### Final decision (Mar 12, 18:20 UTC):
- **If ANY signal is "Real" or "Strong"** → Proceed to Phase 1 (paper trading with that signal)
- **If ALL signals are "No edge"** → Admit market is efficient, stop here

---

## Deployment Checklist

### Pre-Launch (Now)
- [ ] API Fix Opus confirms working Polymarket APIs
- [ ] Binance WebSocket credentials verified
- [ ] Storage directories created (`polymarket/data/`)
- [ ] Logging configured (console + file)
- [ ] Error handling + restart logic ready

### Launch (Mar 5, 18:20 UTC)
- [ ] Start Binance price collector (background service)
- [ ] Start Polymarket order book collector (background service)
- [ ] Start resolution tracker (background service)
- [ ] Start backtesting harness (continuous)
- [ ] Verify data is flowing into JSONL files
- [ ] First 10-minute sanity check (all services online)

### Monitoring (Mar 5-12)
- [ ] Daily log review (any errors/timeouts?)
- [ ] Data quality check (no gaps, timestamps correct?)
- [ ] Signal interim reports (every 100 windows)
- [ ] Resource usage (CPU, memory, disk space)

### Completion (Mar 12, 18:20 UTC)
- [ ] Collect final stats (total windows, win rates, p-values)
- [ ] Generate comprehensive report
- [ ] Make go/no-go decision for Phase 1
- [ ] Archive all data files

---

## Resource Requirements

| Resource | Requirement |
|----------|-------------|
| Disk Space | ~5 GB (2 weeks of 1-sec + 10-sec data) |
| CPU | Minimal (polling + JSON parsing) |
| Memory | 500 MB (in-memory stats) |
| Network | 2-3 Mbps (WebSocket streams) |
| Uptime | 100% for 7 days |

**Contingency:**
- If collector crashes: Auto-restart (max 3 retries)
- If network dies: Log gap, resume when back online
- If data corrupts: Revert to last backup, continue

---

## What Happens Next (Mar 12)

**If signal is viable (>52% WR + p<0.05):**
1. Document the signal in detail
2. Move to Phase 1 (paper trading on that signal)
3. Trade with $100-500 for 2 weeks
4. If profitable: Scale to Phase 2 (live capital)

**If all signals fail (≤50% WR or p>0.10):**
1. Conclude: Market is efficient, no edge at this timeframe
2. Either pivot to different market/timeframe OR stop research
3. Use smart money tracking as alternative strategy (trade where whales align)

---

## Files Generated

By Mar 12:
- `binance_prices.jsonl` — 2 weeks of 1-sec BTC data
- `orderbooks.jsonl` — Order book snapshots every 10 sec
- `resolutions.csv` — Ground truth outcomes
- `signal_backtest_results.json` — Win rates + statistics
- `signal_performance_report.md` — Human-readable analysis
- `option_b_final_report.md` — Summary + recommendation

---

## Key Difference from Option A

| Aspect | Option A (Killed) | Option B (Launching) |
|--------|-------------------|-------------------|
| Data source | Historical (hard to get) | Live (streaming in) |
| Sample size | 288 windows | 2,000+ windows |
| Time to result | 2 hours | 7 days |
| Statistical power | Weak | Strong |
| Data freshness | Stale | Real-time |
| Scalability | One-off | Repeatable |

---

## Status

✅ **Phase 0 killed** (timeout at 31 min)  
🔄 **API Fix running** (ETA: 1-5 minutes)  
⏳ **Option B ready to deploy** (waiting for API Fix confirmation)  

Once API Fix announces working APIs, Option B collectors launch immediately.

**Estimated completion:** Mar 12, 2026, 18:20 UTC  
**Live decision:** Which signal has real edge (or none exist)?
