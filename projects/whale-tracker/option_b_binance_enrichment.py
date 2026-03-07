#!/usr/bin/env python3
"""
Binance Enrichment Collector
Supplements V6 with rich Binance data synchronized to OB collection intervals
- BTC/USDT order book (bid/ask depth, spread)
- Volume metrics (24h volume, current volume)
- Volatility (price range, swings)
- VWAP (volume-weighted average price)
"""

import json
import urllib.request
import time
from datetime import datetime
from pathlib import Path

# ============================================================================
# Setup
# ============================================================================

DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

BINANCE_OB_LOG = DATA_DIR / "binance_orderbook.jsonl"
BINANCE_METRICS_LOG = DATA_DIR / "binance_metrics.jsonl"
LOG_FILE = DATA_DIR / "binance_enrichment_log.txt"

START_TIME = time.time()

def log(msg):
    """Log to file and console"""
    ts = datetime.now().isoformat()
    print(f"{ts} | {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("=" * 100)
log("🚀 BINANCE ENRICHMENT COLLECTOR STARTED")
log("=" * 100)

# ============================================================================
# Collection Loop
# ============================================================================

ob_collected = 0
metrics_collected = 0
last_ob_check = 0

ob_interval = 10  # Every 10 seconds (sync with Polymarket OB)

try:
    while True:
        elapsed = time.time() - START_TIME
        
        # === COLLECT BINANCE ORDER BOOK (every 10 seconds) ===
        if elapsed - last_ob_check >= ob_interval:
            last_ob_check = elapsed
            
            try:
                # Get order book (top 20 levels)
                url = "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    ob_data = json.loads(response.read())
                
                bids = ob_data.get('bids', [])
                asks = ob_data.get('asks', [])
                
                if bids and asks:
                    best_bid = float(bids[0][0])
                    best_ask = float(asks[0][0])
                    bid_size = sum(float(b[1]) for b in bids)
                    ask_size = sum(float(a[1]) for a in asks)
                    spread = best_ask - best_bid
                    spread_pct = (spread / best_bid) * 100
                    
                    with open(BINANCE_OB_LOG, "a") as f:
                        f.write(json.dumps({
                            "timestamp": datetime.now().isoformat(),
                            "best_bid": best_bid,
                            "best_ask": best_ask,
                            "spread": spread,
                            "spread_pct": spread_pct,
                            "bid_size": bid_size,
                            "ask_size": ask_size,
                            "imbalance": bid_size / (ask_size + 0.001)
                        }) + "\n")
                    
                    ob_collected += 1
            except Exception as e:
                log(f"⚠️  Order book error: {e}")
            
            # === COLLECT 24H METRICS (with OB) ===
            try:
                url = "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    metrics = json.loads(response.read())
                
                with open(BINANCE_METRICS_LOG, "a") as f:
                    f.write(json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "price": float(metrics.get('lastPrice', 0)),
                        "price_change_24h": float(metrics.get('priceChange', 0)),
                        "price_change_pct_24h": float(metrics.get('priceChangePercent', 0)),
                        "high_24h": float(metrics.get('highPrice', 0)),
                        "low_24h": float(metrics.get('lowPrice', 0)),
                        "volume_24h": float(metrics.get('volume', 0)),
                        "volume_usd_24h": float(metrics.get('quoteAssetVolume', 0))
                    }) + "\n")
                
                metrics_collected += 1
            except Exception as e:
                log(f"⚠️  Metrics error: {e}")
        
        # === PROGRESS REPORT (every 60 seconds) ===
        if int(elapsed) % 60 == 0 and int(elapsed) > 0:
            log(f"[{int(elapsed)}s] Order books: {ob_collected} | Metrics: {metrics_collected}")
        
        time.sleep(1)

except KeyboardInterrupt:
    log("🛑 Collection stopped by user")
except Exception as e:
    log(f"❌ Fatal error: {e}")

