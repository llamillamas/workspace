# Real Data Collection Plan for Polymarket Volatility Backtesting

**Status:** Ready to execute (no synthetic data)  
**Goal:** Collect real 5-min interval market data, backtest 4 strategies with 100+ market samples  
**Timeline:** Start immediately, backtest results within 1 week

---

## PHASE 1: DATA SOURCE OPTIONS (Ranked by Quality)

### Option 1: Historical Archive + Live WebSocket (RECOMMENDED)
**Best for:** Complete, verified backtesting + ongoing live collection

#### A. Historical Data (PMX Archive)
- **Source:** https://archive.pmxt.dev/
- **Format:** Parquet files (efficient, compressed)
- **Coverage:** Complete historical Polymarket data
- **Update:** Hourly snapshots
- **Cost:** FREE
- **Data fields:** Market prices, volumes, spreads, timestamps
- **Sample access:** Download last 30 days of volatile markets

```bash
# Example: Download BTC price prediction markets
curl https://archive.pmxt.dev/data/polymarket/...  
# Provides: YES/NO prices, volumes, bid/ask, timestamps
```

#### B. Live WebSocket Stream
- **Source:** Polymarket Real-Time Data Socket (RTDS)
- **Endpoint:** `wss://ws-live-data.polymarket.com`
- **Topics:** Market updates, price changes, trades
- **Cost:** FREE
- **Update frequency:** Real-time (sub-second)
- **Data:** Bid/ask, last trade price, volumes
- **Official client:** GitHub - Polymarket/real-time-data-client (TypeScript)

**How to use:**
```json
{
  "action": "subscribe",
  "subscriptions": [
    {
      "topic": "market_updates",
      "type": "price_change",
      "filters": "volatility > 0.3"
    }
  ]
}
```

---

### Option 2: Tick-Level Data (PredictionData.dev)
- **Source:** https://predictiondata.dev
- **Format:** CSV.GZ (tick-level = every trade)
- **Coverage:** Polymarket + Kalshi
- **Data:** Order book reconstruction at any timestamp
- **Cost:** Paid (but has free tier)
- **Best for:** Precise backtesting with slippage

```bash
# Example: Get all fills for BTC prediction
curl -G "http://datasets.predictiondata.dev/polymarket/onchain/fills/bitcoin-prediction/YES/2025-11-16.csv.gz" \
  --data-urlencode "apikey=YOUR_KEY"
```

---

### Option 3: Real-Time Analytics (FinFeedAPI)
- **Source:** https://www.finfeedapi.com
- **Coverage:** Polymarket + Kalshi + Manifold
- **Data:** Normalized across platforms
- **Cost:** Paid
- **Best for:** Cross-market monitoring

---

## PHASE 2: DATA STORAGE SOLUTION (For Live Collection)

### Recommended: TimescaleDB (PostgreSQL Extension)
**Why:** Built for financial time-series, compression 95%, easy Python integration

```sql
-- Create table for 5-min market snapshots
CREATE TABLE polymarket_snapshots (
  time TIMESTAMPTZ NOT NULL,
  market_id TEXT NOT NULL,
  yes_price DECIMAL(5,4),
  no_price DECIMAL(5,4),
  yes_volume BIGINT,
  no_volume BIGINT,
  bid_ask_spread DECIMAL(5,4),
  volatility_score DECIMAL(10,8),
  PRIMARY KEY (time, market_id)
);

-- Convert to hypertable (auto-partitioning)
SELECT create_hypertable('polymarket_snapshots', 'time', 
  if_not_exists => TRUE);

-- Automatic compression after 7 days
ALTER TABLE polymarket_snapshots SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'time DESC'
);
```

**Installation (1 line):**
```bash
docker run -d --name timescaledb -e POSTGRES_PASSWORD=password \
  -p 5432:5432 timescale/timescaledb:latest-pg15
```

**Python insert (5-min snapshots):**
```python
import psycopg2
from datetime import datetime

conn = psycopg2.connect("dbname=postgres user=postgres password=password host=localhost")
cur = conn.cursor()

# Insert 5-min snapshot
cur.execute("""
  INSERT INTO polymarket_snapshots VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
""", (
  datetime.now(),           # time
  "btc-70k-march",          # market_id
  0.62,                     # yes_price
  0.38,                     # no_price
  150000,                   # yes_volume
  120000,                   # no_volume
  0.0400,                   # bid_ask_spread
  0.125,                    # volatility_score
))
conn.commit()
```

---

## PHASE 3: LIVE DATA COLLECTION SYSTEM

### Strategy A: WebSocket → TimescaleDB Pipeline (Recommended)
```
Polymarket WebSocket → Python collector → TimescaleDB
   (5-sec updates)      (aggregate 5-min)  (persistent storage)
```

**Code structure:**
```python
# 1. Connect to Polymarket WebSocket
import asyncio
import websockets
import json

async def collect_market_data():
    uri = "wss://ws-live-data.polymarket.com"
    async with websockets.connect(uri) as ws:
        # Subscribe to volatile markets
        await ws.send(json.dumps({
            "action": "subscribe",
            "subscriptions": [{
                "topic": "market_updates",
                "type": "price_change"
            }]
        }))
        
        # Collect data
        while True:
            message = await ws.recv()
            data = json.loads(message)
            
            # Aggregate 5-min snapshot
            save_to_timescaledb(data)
            
            # Keep PING alive (required every 5 sec)
            await ws.send(json.dumps({"action": "ping"}))

# 2. Run collector
asyncio.run(collect_market_data())
```

---

## PHASE 4: BACKTEST DATA SELECTION

### Which Markets to Collect
Focus on **highest volatility** (where strategies work best):

1. **BTC Price Predictions** (Weekly, monthly strikes)
   - Range: $65K-$75K (highly volatile Feb-Mar)
   - Volume: $6M+
   - Spreads: Wide (good for straddles)

2. **ETH Price Predictions** (Similar to BTC)
   - Range: $2K-$3.5K
   - Volume: $2M+

3. **Event Markets** (Geopolitical, political)
   - US-Iran tensions (spiked Feb-Mar)
   - Trump/2024 election outcomes
   - Fed decisions
   - Volume spikes 500-1000%

4. **Rare Event Markets**
   - Space launches, celebrity rumors
   - Highly volatile, good for meme spike strategy

### Sample Size Target
- **Minimum:** 100 market snapshots across 5-min windows
- **Better:** 1,000+ snapshots (full week of data)
- **Best:** 10,000+ snapshots (4 weeks, multiple markets)

---

## PHASE 5: IMMEDIATE EXECUTION PLAN

### Week 1 (Start Today)
**Day 1-2:**
- [ ] Set up TimescaleDB (Docker container)
- [ ] Download historical data from PMX archive (last 30 days)
- [ ] Load into TimescaleDB for analysis

**Day 3-4:**
- [ ] Start live WebSocket collector
- [ ] Connect to Polymarket RTDS
- [ ] Begin collecting 5-min snapshots (100+ per volatile market)

**Day 5-7:**
- [ ] Run backtests on collected data (no synthetic)
- [ ] 4 strategies × 100+ markets = Real results
- [ ] Generate win rates, Sharpe ratios, monthly ROI

### Week 2
- [ ] Full 7-day backtest (1000+ snapshots)
- [ ] Paper test on live markets
- [ ] Decide which strategy to live-trade first

---

## KEY ADVANTAGES OF THIS APPROACH

✅ **Real data only** — No synthetic bias  
✅ **Tick-level precision** — Capture true volatility  
✅ **Ongoing collection** — Build database continuously  
✅ **Low cost** — Free or cheap data sources  
✅ **100+ samples minimum** — Statistical significance  
✅ **Repeatable** — Can backtest continuously as more data arrives  
✅ **Cross-market** — Multiple markets = robust results  

---

## WHAT WE CAN PROVE

With 100+ real market samples over 5-min intervals, we can prove:

1. **Strategy profitability** — Actual win rates (not theoretical)
2. **Sharpe ratios** — Risk-adjusted returns
3. **Frequency** — Trades per day/week (realistic)
4. **Best markets** — Which pairs work best
5. **Capital requirements** — Real position sizing
6. **Scalability** — Can it work on more markets?

---

## NEXT STEPS

Ready to execute?

**Option A:** I build the full system (WebSocket → TimescaleDB → Backtest) — 2-3 hours, full automation

**Option B:** You provide Polymarket + Deribit API keys → I add premium data sources

**Option C:** We start with PMX archive data only (instant, no setup)

Which direction?

---

**Timeline:** Can have real backtests with 100+ samples by Friday (72 hours)  
**Cost:** $0-50 depending on data sources chosen  
**Result Quality:** High — Real data, proper methodology, statistical validity
