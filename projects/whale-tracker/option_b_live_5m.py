#!/usr/bin/env python3
"""
Option B: 5-Minute Live Test with Current Market
Using slug-based discovery (F1 Master's pattern)
Polymarket uses NYT (New York Time) for market windows
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

LOG_FILE = DATA_DIR / "option_b_live_5m_test.txt"
PRICE_LOG = DATA_DIR / "prices_live_5m.jsonl"
ORDERBOOK_LOG = DATA_DIR / "orderbooks_live_5m.jsonl"

TEST_DURATION = 300  # 5 minutes
START_TIME = time.time()

print("=" * 100)
print("🚀 OPTION B: 5-MINUTE LIVE TEST (Current Market)")
print("=" * 100)
print(f"\n⏱️ START: {datetime.now().isoformat()} (UTC)")
print(f"🗺️ Market timing: NYT (New York Time)")
print(f"📁 DATA DIR: {DATA_DIR.absolute()}")
print(f"⏲️  DURATION: 5 minutes ({TEST_DURATION} seconds)\n")

def log(msg):
    """Log to console and file"""
    ts = datetime.now().isoformat()
    print(f"{ts} | {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("Starting 5-minute live collection test...")

# Current market from F1 Master
current_slug = "btc-updown-5m-1772736600"
current_url = f"https://polymarket.com/event/{current_slug}"

log(f"Market URL: {current_url}")
log(f"Slug: {current_slug}\n")

# ============================================================================
# Fetch Market Data
# ============================================================================

log("Phase 1: Fetching market metadata via slug query...")

market_data = None
try:
    url = f"https://gamma-api.polymarket.com/markets?slug={current_slug}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req, timeout=10) as response:
        markets = json.loads(response.read())
    
    if markets:
        market_data = markets[0]
        
        log(f"✅ Market found")
        log(f"   Question: {market_data.get('question', '')}")
        
        # Get prices
        outcome_prices = market_data.get('outcomePrices', [])
        if outcome_prices:
            try:
                if isinstance(outcome_prices, str):
                    outcome_prices = json.loads(outcome_prices)
                
                yes_price = float(outcome_prices[0])
                no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0
                
                log(f"   YES Price: ${yes_price:.3f}")
                log(f"   NO Price: ${no_price:.3f}")
            except:
                pass
        
        log(f"   Active: {market_data.get('active', '')}")
        
        # Get token IDs
        token_ids = json.loads(market_data.get('clobTokenIds', '[]'))
        if token_ids:
            log(f"   CLOB Token IDs: {len(token_ids)} tokens")
        
except Exception as e:
    log(f"❌ Market fetch failed: {e}")

if not market_data:
    log("\n❌ Could not fetch market. Exiting.")
    exit(1)

# ============================================================================
# Continuous Data Collection
# ============================================================================

log(f"\nPhase 2: Collecting data continuously for 5 minutes...\n")

token_ids = json.loads(market_data.get('clobTokenIds', '[]'))
prices_collected = 0
orderbooks_collected = 0

with open(PRICE_LOG, "w") as f:
    f.write("")  # Clear file

with open(ORDERBOOK_LOG, "w") as f:
    f.write("")  # Clear file

last_ob_fetch = 0
ob_interval = 10  # Fetch order book every 10 seconds

while time.time() - START_TIME < TEST_DURATION:
    elapsed = time.time() - START_TIME
    
    # Collect Binance price
    try:
        req = urllib.request.Request(
            "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            price_data = json.loads(response.read())
            btc_price = float(price_data.get('price', 0))
            
            with open(PRICE_LOG, "a") as f:
                f.write(json.dumps({
                    "timestamp": datetime.now().isoformat(),
                    "source": "binance",
                    "symbol": "BTCUSDT",
                    "price": btc_price,
                    "elapsed_sec": int(elapsed)
                }) + "\n")
            
            prices_collected += 1
    except:
        pass
    
    # Collect order book every 10 seconds
    if elapsed - last_ob_fetch >= ob_interval and token_ids:
        last_ob_fetch = elapsed
        
        try:
            req = urllib.request.Request(
                f"https://clob.polymarket.com/book?token_id={token_ids[0]}",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                book = json.loads(response.read())
                
                bids = book.get('bids', [])
                asks = book.get('asks', [])
                
                with open(ORDERBOOK_LOG, "a") as f:
                    f.write(json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "elapsed_sec": int(elapsed),
                        "bid_count": len(bids),
                        "ask_count": len(asks),
                        "best_bid": float(bids[0].get('price', 0)) if bids else None,
                        "best_ask": float(asks[0].get('price', 0)) if asks else None,
                        "spread": (float(asks[0].get('price', 0)) - float(bids[0].get('price', 0))) if (bids and asks) else None
                    }) + "\n")
                
                orderbooks_collected += 1
                
                if int(elapsed) % 30 == 0:
                    log(f"[{int(elapsed)}s] Bids: {len(bids)}, Asks: {len(asks)}")
        except:
            pass
    
    time.sleep(1)

# ============================================================================
# Summary
# ============================================================================

elapsed_total = time.time() - START_TIME

log(f"\n" + "=" * 100)
log(f"✅ 5-MINUTE TEST COMPLETE")
log(f"=" * 100)

log(f"\n⏱️ Total elapsed: {int(elapsed_total)} seconds")
log(f"💰 Binance price samples: {prices_collected}")
log(f"📊 Polymarket order books: {orderbooks_collected}")

log(f"\nData files created:")
log(f"  ✅ {PRICE_LOG}")
log(f"  ✅ {ORDERBOOK_LOG}")
log(f"  ✅ {LOG_FILE}")

log(f"\n🎯 Market slug: {current_slug}")
log(f"📍 Market URL: {current_url}")

print(f"\n✅ Test complete at {datetime.now().isoformat()}\n")

