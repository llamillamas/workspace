#!/usr/bin/env python3
"""
Option B: 5-Minute Live Test
Real market polling + data collection
"""

import json
import urllib.request
import urllib.error
import time
from datetime import datetime
from pathlib import Path

# ============================================================================
# Setup
# ============================================================================

DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

LOG_FILE = DATA_DIR / "option_b_5min_test_log.txt"
PRICE_LOG = DATA_DIR / "prices_5min_test.jsonl"
ORDERBOOK_LOG = DATA_DIR / "orderbooks_5min_test.jsonl"
RESOLUTION_LOG = DATA_DIR / "resolutions_5min_test.csv"

TEST_DURATION = 300  # 5 minutes in seconds
START_TIME = time.time()

print("=" * 100)
print("🚀 OPTION B: 5-MINUTE LIVE TEST")
print("=" * 100)
print(f"\n⏱️ START: {datetime.now().isoformat()}")
print(f"📁 DATA DIR: {DATA_DIR.absolute()}")
print(f"⏲️  DURATION: 5 minutes ({TEST_DURATION} seconds)\n")

def log(msg):
    """Log to console and file"""
    print(msg)
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now().isoformat()} | {msg}\n")

# Initialize resolution CSV header
with open(RESOLUTION_LOG, "w") as f:
    f.write("timestamp,condition_id,market_slug,outcome,final_yes_price\n")

log("Starting 5-minute live collection test...")

# ============================================================================
# Market Discovery + Data Collection Loop
# ============================================================================

markets_found = []
prices_collected = 0
orderbooks_collected = 0

# F1 Master's pattern: condition_id increments by 300 every 5 minutes
# Calculate expected market IDs to poll
base_time = int(time.time())
base_market_id = int(base_time // 300) * 300

market_ids_to_poll = [
    base_market_id,
    base_market_id + 300,
    base_market_id + 600,
    base_market_id - 300,
]

poll_interval = 30  # Poll every 30 seconds
last_poll = 0

loop_count = 0

while time.time() - START_TIME < TEST_DURATION:
    loop_count += 1
    elapsed = time.time() - START_TIME
    
    # Poll for new markets every 30 seconds
    if elapsed - last_poll >= poll_interval:
        last_poll = elapsed
        
        log(f"\n[{loop_count}] Polling for BTC 5m markets (elapsed: {int(elapsed)}s)...")
        
        # Try to discover new markets
        for market_id in market_ids_to_poll:
            try:
                url = f"https://gamma-api.polymarket.com/markets/{market_id}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    market = json.loads(response.read())
                    
                    slug = market.get('slug', '')
                    question = market.get('question', '')
                    yes_price = float(market.get('outcomePrices', [0.5])[0])
                    
                    # Check if BTC market
                    if 'btc' in slug.lower() and 'updown' in slug.lower():
                        if market_id not in [m['id'] for m in markets_found]:
                            log(f"  ✅ FOUND: {slug}")
                            log(f"     YES Price: ${yes_price:.3f}")
                            
                            markets_found.append({
                                'id': market_id,
                                'slug': slug,
                                'question': question,
                                'yes_price': yes_price,
                                'discovered_at': elapsed
                            })
                            
                            # Get token IDs for this market
                            token_ids = json.loads(market.get('clobTokenIds', '[]'))
                            if token_ids:
                                log(f"     Token IDs: {token_ids}")
                                
                                # Try to get order book
                                try:
                                    req_book = urllib.request.Request(
                                        f"https://clob.polymarket.com/book?token_id={token_ids[0]}",
                                        headers={'User-Agent': 'Mozilla/5.0'}
                                    )
                                    with urllib.request.urlopen(req_book, timeout=5) as response_book:
                                        book = json.loads(response_book.read())
                                        
                                        bids = book.get('bids', [])
                                        asks = book.get('asks', [])
                                        
                                        log(f"     Order Book: {len(bids)} bids, {len(asks)} asks")
                                        
                                        # Log order book data
                                        with open(ORDERBOOK_LOG, "a") as f:
                                            f.write(json.dumps({
                                                "timestamp": datetime.now().isoformat(),
                                                "market_id": market_id,
                                                "token_id": token_ids[0],
                                                "bid_count": len(bids),
                                                "ask_count": len(asks),
                                                "best_bid": float(bids[0].get('price', 0)) if bids else None,
                                                "best_ask": float(asks[0].get('price', 0)) if asks else None
                                            }) + "\n")
                                        
                                        orderbooks_collected += 1
                                
                                except Exception as e:
                                    log(f"     Order book error: {e}")
            
            except urllib.error.URLError:
                pass
            except Exception as e:
                pass
    
    # Collect Binance price every iteration (continuous)
    try:
        req = urllib.request.Request(
            "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            price_data = json.loads(response.read())
            btc_price = float(price_data.get('price', 0))
            
            # Log price
            with open(PRICE_LOG, "a") as f:
                f.write(json.dumps({
                    "timestamp": datetime.now().isoformat(),
                    "source": "binance",
                    "symbol": "BTCUSDT",
                    "price": btc_price
                }) + "\n")
            
            prices_collected += 1
    
    except Exception:
        pass
    
    # Sleep a bit before next iteration
    time.sleep(2)

# ============================================================================
# Summary
# ============================================================================

elapsed_total = time.time() - START_TIME

log("\n" + "=" * 100)
log("✅ 5-MINUTE TEST COMPLETE")
log("=" * 100)

log(f"\n⏱️ Total elapsed: {int(elapsed_total)} seconds")
log(f"📊 Markets found: {len(markets_found)}")
log(f"💰 Price samples collected: {prices_collected}")
log(f"📦 Order book snapshots: {orderbooks_collected}")

if markets_found:
    log("\nMarkets discovered:")
    for m in markets_found:
        log(f"  - {m['slug']} (YES: ${m['yes_price']:.3f}, found at +{int(m['discovered_at'])}s)")

log("\n📁 Data files created:")
log(f"  - {PRICE_LOG}")
log(f"  - {ORDERBOOK_LOG}")
log(f"  - {RESOLUTION_LOG}")
log(f"  - {LOG_FILE}")

log("\n" + "=" * 100)
print(f"\n✅ TEST COMPLETE at {datetime.now().isoformat()}")

