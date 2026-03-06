#!/usr/bin/env python3
"""
Option B Collection v6: OPTIMIZED INTERVALS
- Prices: Every iteration (continuous)
- Order books: Every 10 seconds (rich data on active markets)
- Resolutions: Every 5 minutes (align with market closure cycle)
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

PRICE_LOG = DATA_DIR / "prices_v6.jsonl"
ORDERBOOK_LOG = DATA_DIR / "orderbooks_v6.jsonl"
RESOLUTION_LOG = DATA_DIR / "resolutions_v6.csv"
LOG_FILE = DATA_DIR / "option_b_v6_log.txt"

START_TIME = time.time()

def log(msg):
    """Log to file and console"""
    ts = datetime.now().isoformat()
    print(f"{ts} | {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("=" * 100)
log("🚀 OPTION B COLLECTION V6 STARTED (OPTIMIZED INTERVALS)")
log("=" * 100)

# Initialize resolution CSV
with open(RESOLUTION_LOG, "w") as f:
    f.write("timestamp,slug,outcome,yes_price,no_price\n")

# ============================================================================
# Autonomous Collection Loop
# ============================================================================

prices_collected = 0
orderbooks_collected = 0
resolutions_recorded = 0

last_ob_check = 0
last_market_discovery = 0
last_resolution_check = 0

tracked_markets = {}

ob_interval = 10  # Every 10 seconds
market_discovery_interval = 10  # Every 10 seconds
resolution_interval = 300  # Every 5 minutes (align with market closure cycle)

try:
    while True:
        elapsed = time.time() - START_TIME
        
        # === CALCULATE CURRENT MARKET ID ===
        unix_time = int(time.time())
        current_market_id = (unix_time // 300) * 300
        
        # === COLLECT BINANCE PRICES (EVERY ITERATION) ===
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
                        "price": btc_price
                    }) + "\n")
                
                prices_collected += 1
        except:
            pass
        
        # === DISCOVER MARKETS (Sliding window: current ± 3 offsets) ===
        if elapsed - last_market_discovery >= market_discovery_interval:
            last_market_discovery = elapsed
            
            # Check current and nearby markets (sliding window)
            for offset in [-900, -600, -300, 0, 300, 600]:
                test_id = current_market_id + offset
                slug = f"btc-updown-5m-{test_id}"
                
                # Skip if already tracking
                if slug in tracked_markets:
                    continue
                
                try:
                    url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    
                    with urllib.request.urlopen(req, timeout=5) as response:
                        markets = json.loads(response.read())
                    
                    if markets:
                        market = markets[0]
                        is_active = market.get('active', False)
                        is_closed = market.get('closed', False)
                        
                        tracked_markets[slug] = {
                            'found': True,
                            'active': is_active,
                            'closed': is_closed,
                            'resolved': False,
                            'token_ids': json.loads(market.get('clobTokenIds', '[]')),
                            'question': market.get('question', '')
                        }
                        
                        log(f"📍 Market discovered: {slug} ({'ACTIVE' if is_active else 'CLOSED'})")
                
                except:
                    pass
        
        # === GET ORDER BOOKS FROM ACTIVE MARKETS (every 10 seconds) ===
        if elapsed - last_ob_check >= ob_interval:
            last_ob_check = elapsed
            
            # Get order books from ALL tracked markets that are still active
            # (not just first 3) to maximize coverage during their 5-min window
            for slug, market_data in list(tracked_markets.items()):
                # Skip if closed (no longer trading)
                if market_data['closed']:
                    continue
                
                if not market_data['token_ids']:
                    continue
                
                try:
                    token_id = market_data['token_ids'][0]
                    
                    req_book = urllib.request.Request(
                        f"https://clob.polymarket.com/book?token_id={token_id}",
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
                                "bid_count": len(bids),
                                "ask_count": len(asks),
                                "best_bid": float(bids[0].get('price', 0)) if bids else None,
                                "best_ask": float(asks[0].get('price', 0)) if asks else None
                            }) + "\n")
                        
                        orderbooks_collected += 1
                
                except:
                    pass
        
        # === CHECK FOR RESOLUTIONS (every 5 minutes) ===
        if elapsed - last_resolution_check >= resolution_interval:
            last_resolution_check = elapsed
            
            for slug, market_data in list(tracked_markets.items()):
                if market_data['resolved']:
                    continue
                
                try:
                    url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    
                    with urllib.request.urlopen(req, timeout=5) as response:
                        markets = json.loads(response.read())
                    
                    if markets:
                        market = markets[0]
                        is_closed = market.get('closed', False)
                        
                        # Record when closed + not yet recorded
                        if is_closed and not market_data['resolved']:
                            outcome_prices = market.get('outcomePrices', [])
                            if isinstance(outcome_prices, str):
                                outcome_prices = json.loads(outcome_prices)
                            
                            try:
                                yes_price = float(outcome_prices[0])
                                no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0
                                outcome = "YES" if yes_price > no_price else "NO"
                                
                                with open(RESOLUTION_LOG, "a") as f:
                                    f.write(f"{datetime.now().isoformat()},{slug},{outcome},{yes_price},{no_price}\n")
                                
                                tracked_markets[slug]['resolved'] = True
                                resolutions_recorded += 1
                                
                                log(f"✅ Resolution: {slug} → {outcome}")
                            except:
                                pass
                
                except:
                    pass
        
        # === PROGRESS REPORT (every 60 seconds) ===
        if int(elapsed) % 60 == 0 and int(elapsed) > 0:
            log(f"[{int(elapsed)}s] Prices: {prices_collected} | Order books: {orderbooks_collected} | Resolutions: {resolutions_recorded}")
        
        time.sleep(1)

except KeyboardInterrupt:
    log("🛑 Collection stopped by user")
except Exception as e:
    log(f"❌ Fatal error: {e}")

