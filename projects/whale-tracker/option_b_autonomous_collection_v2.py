#!/usr/bin/env python3
"""
Option B: Autonomous Long-Duration Collection v2
FIXED: Proper market discovery and order book collection
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

log("🚀 V2 AUTONOMOUS COLLECTION RESTARTED")

# Initialize CSV
with open(RESOLUTION_LOG, "a") as f:
    if f.tell() == 0:
        f.write("timestamp,slug,outcome,yes_price,no_price\n")

# ============================================================================
# Autonomous Collection Loop
# ============================================================================

prices_collected = 0
orderbooks_collected = 0
resolutions_recorded = 0

last_ob_check = 0
last_market_discovery = 0
active_markets = {}

ob_interval = 10
market_discovery_interval = 30

try:
    while True:
        elapsed = time.time() - START_TIME
        
        # === COLLECT BINANCE PRICES ===
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
        
        # === DISCOVER ACTIVE MARKETS ===
        if elapsed - last_market_discovery >= market_discovery_interval:
            last_market_discovery = elapsed
            
            # Calculate current market ID (increments by 300 every 5 min)
            current_time = int(datetime.now().timestamp())
            base_market_id = int(current_time // 300) * 300
            
            # Check this market and next few
            for offset in [0, 300, -300]:
                test_id = base_market_id + offset
                slug = f"btc-updown-5m-{test_id}"
                
                try:
                    url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    
                    with urllib.request.urlopen(req, timeout=5) as response:
                        markets = json.loads(response.read())
                    
                    if markets:
                        market = markets[0]
                        is_closed = market.get('closed', False)
                        
                        # Track market
                        if slug not in active_markets:
                            active_markets[slug] = {
                                'found': True,
                                'was_closed': is_closed,
                                'token_ids': json.loads(market.get('clobTokenIds', '[]'))
                            }
                        
                        # If just closed, record resolution
                        if is_closed and not active_markets[slug]['was_closed']:
                            active_markets[slug]['was_closed'] = True
                            
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
            
            # Get order books for active markets
            for slug, market_data in list(active_markets.items())[:3]:
                if market_data['token_ids']:
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
        
        time.sleep(1)

except KeyboardInterrupt:
    log("🛑 Collection stopped")
except Exception as e:
    log(f"❌ Error: {e}")

