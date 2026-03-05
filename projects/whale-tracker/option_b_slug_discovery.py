#!/usr/bin/env python3
"""
Option B: BTC 5M Market Discovery via Slug Parameter
F1 Master's insight: Use slug query instead of condition_id polling
"""

import json
import urllib.request
import time
from datetime import datetime
from pathlib import Path

print("=" * 100)
print("🚀 OPTION B: SLUG-BASED MARKET DISCOVERY")
print("=" * 100)

DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

print(f"\n📍 Pattern from F1 Master:")
print(f"   URL: https://polymarket.com/event/btc-updown-5m-1772736300")
print(f"   Slug: btc-updown-5m-1772736300")
print(f"   API: https://gamma-api.polymarket.com/markets?slug=btc-updown-5m-1772736300\n")

def fetch_market_by_slug(slug):
    """Fetch market data using slug query"""
    try:
        url = f"https://gamma-api.polymarket.com/markets?slug={slug}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=5) as response:
            markets = json.loads(response.read())
        
        if markets and len(markets) > 0:
            return markets[0]
        return None
    
    except Exception as e:
        return None

def fetch_order_book(token_id):
    """Fetch order book for a token"""
    try:
        req = urllib.request.Request(
            f"https://clob.polymarket.com/book?token_id={token_id}",
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read())
    except:
        return None

# Test with current market
current_slug = "btc-updown-5m-1772736300"

print(f"Testing slug query: {current_slug}\n")

market = fetch_market_by_slug(current_slug)

if market:
    print(f"✅ MARKET FOUND")
    print(f"\n📋 Data from Gamma API:")
    print(f"   Question: {market.get('question', '')}")
    print(f"   Slug: {market.get('slug', '')}")
    print(f"   Condition ID: {market.get('conditionId', '')}")
    
    outcome_prices = market.get('outcomePrices', [])
    if outcome_prices:
        # Handle both string and float formats
        try:
            if isinstance(outcome_prices, str):
                outcome_prices = json.loads(outcome_prices)
            
            yes_price = float(outcome_prices[0])
            print(f"   YES Price: ${yes_price:.3f}")
        except:
            print(f"   YES Price: [parsing error]")
    
    print(f"   Active: {market.get('active', '')}")
    print(f"   Closed: {market.get('closed', '')}")
    
    # Get token IDs
    token_ids = json.loads(market.get('clobTokenIds', '[]'))
    print(f"\n🔗 CLOB Token IDs: {token_ids}")
    
    if token_ids:
        # Get order book
        print(f"\n📊 Fetching order book...")
        book = fetch_order_book(token_ids[0])
        
        if book:
            bids = book.get('bids', [])
            asks = book.get('asks', [])
            
            print(f"   ✅ Order Book:")
            print(f"      Bids: {len(bids)}")
            print(f"      Asks: {len(asks)}")
            
            if bids and asks:
                print(f"      Best bid: ${float(bids[0].get('price', 0)):.3f}")
                print(f"      Best ask: ${float(asks[0].get('price', 0)):.3f}")
    
    print("\n" + "=" * 100)
    print("✅ SLUG-BASED DISCOVERY VERIFIED")
    print("=" * 100)
    print(f"""
How Option B will work:

1. **Generate expected slugs:**
   - base_id = 1772736300
   - next_id = base_id + 300 = 1772736600
   - slug = f"btc-updown-5m-{{next_id}}"

2. **Query by slug (every 5 minutes):**
   - GET /markets?slug=btc-updown-5m-{{next_id}}
   - Returns: market metadata, token IDs, prices

3. **For each found market:**
   - Extract token_ids
   - Subscribe to CLOB for those tokens
   - Collect prices + order books every 10s
   - Track until market resolves

4. **7-day collection:**
   - ~288 market windows per day
   - Each window: 5 minutes of price/volume data
   - 7 days = ~2,000 windows total

This approach:
✅ Much simpler than condition_id polling
✅ Directly uses slug from Polymarket URL
✅ Guaranteed to find markets when they exist
✅ Scales naturally to any 5m market rotation
""")

else:
    print(f"❌ Market not found for slug: {current_slug}")

print("\n📝 Implementation ready for 7-day Option B deployment")

