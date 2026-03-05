#!/usr/bin/env python3
"""
Option B: Autonomous Long-Duration Collection
Runs continuously, collecting Binance prices + Polymarket order books + resolutions
No manual monitoring required
"""

import json
import urllib.request
import time
from datetime import datetime
from pathlib import Path
import sys

# ============================================================================
# Setup
# ============================================================================

DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

LOG_FILE = DATA_DIR / "option_b_autonomous_log.txt"
PRICE_LOG = DATA_DIR / "prices_autonomous.jsonl"
ORDERBOOK_LOG = DATA_DIR / "orderbooks_autonomous.jsonl"
RESOLUTION_LOG = DATA_DIR / "resolutions_autonomous.csv"

START_TIME = time.time()

def log(msg):
    """Log to file"""
    ts = datetime.now().isoformat()
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("=" * 100)
log("🚀 OPTION B AUTONOMOUS COLLECTION STARTED")
log("=" * 100)
log(f"Start time: {datetime.now().isoformat()} UTC")

# Initialize CSV
with open(RESOLUTION_LOG, "w") as f:
    f.write("timestamp,slug,outcome,yes_price,no_price\n")

# ============================================================================
# Autonomous Collection Loop
# ============================================================================

prices_collected = 0
orderbooks_collected = 0
resolutions_recorded = 0

last_ob_check = 0
last_resolution_check = 0
markets_seen = {}

ob_interval = 10  # Check order books every 10 seconds
resolution_interval = 10  # Check resolutions every 10 seconds

try:
    while True:
        elapsed = time.time() - START_TIME
        
        # === COLLECT BINANCE PRICES (EVERY SECOND) ===
        try:
            req = urllib.request.Request(
                "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=3) as response:
                price_data = json.loads(response.read())
                btc_price = float(price_data.get('price', 0))
                
                with open(PRICE_LOG, "a") as f:
                    f.write(json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "price": btc_price,
                        "elapsed_sec": int(elapsed)
                    }) + "\n")
                
                prices_collected += 1
        except:
            pass
        
        # === DISCOVER AND MONITOR MARKETS ===
        if elapsed - last_resolution_check >= resolution_interval:
            last_resolution_check = elapsed
            
            # Try to find active/recent markets
            for offset in range(0, 5):
                test_id = 1772738400 + (offset * 300)
                slug = f"btc-updown-5m-{test_id}"
                
                try:
                    url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    
                    with urllib.request.urlopen(req, timeout=5) as response:
                        markets = json.loads(response.read())
                    
                    if markets:
                        market = markets[0]
                        
                        # Track this market
                        if slug not in markets_seen:
                            markets_seen[slug] = {'found': True, 'closed': False}
                        
                        is_closed = market.get('closed', False)
                        was_closed = markets_seen[slug]['closed']
                        
                        # If just closed, record resolution
                        if is_closed and not was_closed:
                            markets_seen[slug]['closed'] = True
                            
                            outcome_prices = market.get('outcomePrices', [])
                            if isinstance(outcome_prices, str):
                                outcome_prices = json.loads(outcome_prices)
                            
                            try:
                                yes_price = float(outcome_prices[0])
                                no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0
                                outcome = "YES" if yes_price > no_price else "NO"
                                
                                with open(RESOLUTION_LOG, "a") as f:
                                    f.write(f"{datetime.now().isoformat()},{slug},{outcome},{yes_price},{no_price}\n")
                                
                                resolutions_recorded += 1
                            except:
                                pass
                
                except:
                    pass
        
        # === GET ORDER BOOKS (every 10 seconds) ===
        if elapsed - last_ob_check >= ob_interval:
            last_ob_check = elapsed
            
            # Get order books for recently active markets
            for slug in list(markets_seen.keys())[:3]:
                try:
                    url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    
                    with urllib.request.urlopen(req, timeout=5) as response:
                        markets = json.loads(response.read())
                    
                    if markets:
                        market = markets[0]
                        token_ids = json.loads(market.get('clobTokenIds', '[]'))
                        
                        if token_ids:
                            try:
                                req_book = urllib.request.Request(
                                    f"https://clob.polymarket.com/book?token_id={token_ids[0]}",
                                    headers={'User-Agent': 'Mozilla/5.0'}
                                )
                                with urllib.request.urlopen(req_book, timeout=5) as response_book:
                                    book = json.loads(response_book.read())
                                    
                                    bids = book.get('bids', [])
                                    asks = book.get('asks', [])
                                    
                                    with open(ORDERBOOK_LOG, "a") as f:
                                        f.write(json.dumps({
                                            "timestamp": datetime.now().isoformat(),
                                            "slug": slug,
                                            "elapsed_sec": int(elapsed),
                                            "bid_count": len(bids),
                                            "ask_count": len(asks),
                                            "best_bid": float(bids[0].get('price', 0)) if bids else None,
                                            "best_ask": float(asks[0].get('price', 0)) if asks else None
                                        }) + "\n")
                                    
                                    orderbooks_collected += 1
                            except:
                                pass
                except:
                    pass
        
        time.sleep(1)

except KeyboardInterrupt:
    log("\n🛑 Collection stopped by user")
except Exception as e:
    log(f"\n❌ Error: {e}")

