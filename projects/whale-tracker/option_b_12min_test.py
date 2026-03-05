#!/usr/bin/env python3
"""
Option B: 12-Minute Live Test with Resolution Capture
Test window: 1:55-2:00 PM (current) + 2:00-2:05 PM (next)
Expected: Capture real market closure and resolution
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

LOG_FILE = DATA_DIR / "option_b_12min_test_log.txt"
PRICE_LOG = DATA_DIR / "prices_12min.jsonl"
ORDERBOOK_LOG = DATA_DIR / "orderbooks_12min.jsonl"
RESOLUTION_LOG = DATA_DIR / "resolutions_12min.csv"

TEST_DURATION = 720  # 12 minutes
START_TIME = time.time()

print("=" * 100)
print("🚀 OPTION B: 12-MINUTE TEST WITH RESOLUTION CAPTURE")
print("=" * 100)
print(f"\n⏱️ START: {datetime.now().isoformat()} UTC")
print(f"📁 DATA DIR: {DATA_DIR.absolute()}")
print(f"⏲️  DURATION: 12 minutes ({TEST_DURATION} seconds)")
print(f"🎯 TEST GOAL: Capture real market resolution\n")

def log(msg):
    """Log to console and file"""
    ts = datetime.now().isoformat()
    print(f"{ts} | {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("Starting 12-minute test...")

# Initialize resolution CSV
with open(RESOLUTION_LOG, "w") as f:
    f.write("timestamp,slug,market_window,outcome,yes_price,no_price\n")

# ============================================================================
# Current Market (1:55-2:00 PM ET)
# ============================================================================

current_slug = "btc-updown-5m-1772736900"
next_slug = "btc-updown-5m-1772737200"

log(f"\nCurrent market: {current_slug}")
log(f"Next market: {next_slug}\n")

# ============================================================================
# Continuous Collection Loop
# ============================================================================

prices_collected = 0
orderbooks_collected = 0
resolutions_recorded = 0
markets_monitored = {}

last_ob_fetch = 0
ob_interval = 10

last_resolution_check = 0
resolution_check_interval = 5

while time.time() - START_TIME < TEST_DURATION:
    elapsed = time.time() - START_TIME
    
    # ========================================================================
    # Price Collection (every iteration, ~1 second)
    # ========================================================================
    
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
                    "price": btc_price,
                    "elapsed_sec": int(elapsed)
                }) + "\n")
            
            prices_collected += 1
    except:
        pass
    
    # ========================================================================
    # Order Book Collection (every 10 seconds)
    # ========================================================================
    
    if elapsed - last_ob_fetch >= ob_interval:
        last_ob_fetch = elapsed
        
        # Collect from current market
        for slug in [current_slug, next_slug]:
            try:
                url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    markets = json.loads(response.read())
                
                if markets:
                    market = markets[0]
                    token_ids = json.loads(market.get('clobTokenIds', '[]'))
                    
                    if token_ids:
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
    
    # ========================================================================
    # Resolution Monitoring (every 5 seconds)
    # ========================================================================
    
    if elapsed - last_resolution_check >= resolution_check_interval:
        last_resolution_check = elapsed
        
        for slug in [current_slug, next_slug]:
            try:
                url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    markets = json.loads(response.read())
                
                if markets:
                    market = markets[0]
                    is_closed = market.get('closed', False)
                    
                    # Track market status
                    if slug not in markets_monitored:
                        markets_monitored[slug] = {'closed': False, 'recorded': False}
                    
                    current_status = markets_monitored[slug]['closed']
                    
                    # Market just closed!
                    if is_closed and not current_status:
                        log(f"\n🎯 MARKET CLOSED: {slug}")
                        markets_monitored[slug]['closed'] = True
                        
                        # Get resolution data
                        outcome_prices = market.get('outcomePrices', [])
                        if isinstance(outcome_prices, str):
                            outcome_prices = json.loads(outcome_prices)
                        
                        try:
                            yes_price = float(outcome_prices[0])
                            no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0
                            
                            outcome = "YES" if yes_price > no_price else "NO"
                            
                            log(f"   YES Price: ${yes_price:.3f}")
                            log(f"   NO Price: ${no_price:.3f}")
                            log(f"   Outcome: {outcome}")
                            
                            # Record resolution
                            with open(RESOLUTION_LOG, "a") as f:
                                market_window = market.get('question', '')
                                f.write(f"{datetime.now().isoformat()},{slug},{market_window},{outcome},{yes_price},{no_price}\n")
                            
                            resolutions_recorded += 1
                            markets_monitored[slug]['recorded'] = True
                        
                        except Exception as e:
                            log(f"   Error parsing prices: {e}")
                    
                    elif is_closed and current_status and not markets_monitored[slug]['recorded']:
                        # Market is closed but we haven't recorded yet
                        log(f"   (Market {slug} remains closed)")
                    
                    elif not is_closed and current_status:
                        # Market reopened (shouldn't happen, but log it)
                        log(f"   ⚠️ Market {slug} reopened?")
            
            except:
                pass
    
    # Status update every 60 seconds
    if int(elapsed) % 60 == 0 and int(elapsed) > 0:
        log(f"[{int(elapsed)}s] Prices: {prices_collected}, Order Books: {orderbooks_collected}, Resolutions: {resolutions_recorded}")
    
    time.sleep(1)

# ============================================================================
# Summary
# ============================================================================

elapsed_total = time.time() - START_TIME

log(f"\n" + "=" * 100)
log(f"✅ 12-MINUTE TEST COMPLETE")
log(f"=" * 100)

log(f"\n⏱️ Total elapsed: {int(elapsed_total)} seconds")
log(f"💰 Binance price samples: {prices_collected}")
log(f"📊 Polymarket order books: {orderbooks_collected}")
log(f"🎯 Resolutions recorded: {resolutions_recorded}")

log(f"\nData files created:")
log(f"  ✅ {PRICE_LOG}")
log(f"  ✅ {ORDERBOOK_LOG}")
log(f"  ✅ {RESOLUTION_LOG}")
log(f"  ✅ {LOG_FILE}")

print(f"\n✅ Test complete at {datetime.now().isoformat()}\n")

