#!/usr/bin/env python3
"""
BTC 5-Minute Market Discovery
Pattern: condition_id increments by 300 every 5 minutes
Strategy: Calculate expected IDs and poll Gamma API directly
"""

import json
import urllib.request
import urllib.error
import time
from datetime import datetime

print("=" * 100)
print("🔍 BTC 5M MARKET DISCOVERY — Direct Polling Strategy")
print("=" * 100)

# F1 Master's insight: condition_id increments by 300 every 5 minutes
# Current example: 1772735700 → +5min: 1772736000 → +10min: 1772736300

# Try to find a currently active market by polling expected IDs
def find_btc_5m_market(base_condition_id, max_retries=5):
    """
    Try to find a BTC 5M market starting from a base condition ID.
    Returns market data if found, None if all retries fail.
    """
    
    print(f"\nAttempting to find market starting from condition_id: {base_condition_id}")
    print(f"Will try: {base_condition_id}, +300, +600, -300, -600\n")
    
    # Try current and nearby IDs (markets might exist at +300 or -300)
    condition_ids_to_try = [
        base_condition_id,
        base_condition_id + 300,
        base_condition_id + 600,
        base_condition_id - 300,
        base_condition_id - 600,
    ]
    
    for cid in condition_ids_to_try:
        try:
            url = f"https://gamma-api.polymarket.com/markets/{cid}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            print(f"  Checking {cid}...", end=" ", flush=True)
            
            with urllib.request.urlopen(req, timeout=5) as response:
                market = json.loads(response.read())
                
                # Verify it's a BTC 5M market
                slug = market.get('slug', '').lower()
                question = market.get('question', '').lower()
                
                if 'btc' in slug and 'updown' in slug:
                    print(f"✅ FOUND!\n")
                    return market, cid
                else:
                    print(f"⚠️ Found but not BTC market (slug={slug})")
        
        except urllib.error.URLError as e:
            if "404" in str(e):
                print(f"404 (not created yet)")
            else:
                print(f"❌ {e}")
        except Exception as e:
            print(f"ERROR: {e}")
    
    print("\n❌ No BTC 5M market found in predicted range")
    return None, None

# Try with F1 Master's condition ID
market_data, found_cid = find_btc_5m_market(1772735700)

if market_data:
    print("\n" + "=" * 100)
    print("✅ MARKET FOUND — Details:")
    print("=" * 100)
    
    print(f"\nQuestion: {market_data.get('question', '')}")
    print(f"Slug: {market_data.get('slug', '')}")
    print(f"Condition ID: {found_cid}")
    print(f"YES Price: ${float(market_data.get('outcomePrices', [0.5])[0]):.3f}")
    
    token_ids = json.loads(market_data.get('clobTokenIds', '[]'))
    if token_ids:
        print(f"Token IDs: {token_ids}")
        
        # Get order book for first token
        try:
            req = urllib.request.Request(
                f"https://clob.polymarket.com/book?token_id={token_ids[0]}",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                book = json.loads(response.read())
                bids = book.get('bids', [])
                asks = book.get('asks', [])
                print(f"Order Book: {len(bids)} bids, {len(asks)} asks")
                
                if bids and asks:
                    print(f"  Best bid: ${bids[0].get('price', 'N/A')}")
                    print(f"  Best ask: ${asks[0].get('price', 'N/A')}")
        except Exception as e:
            print(f"Order book error: {e}")
else:
    print("\n" + "=" * 100)
    print("⚠️ MARKET NOT FOUND")
    print("=" * 100)
    
    print("""
Possible reasons:
1. Markets haven't been created yet (new markets appear every 5 minutes)
2. Markets are created in future (not retroactively)
3. Markets are on different API endpoint
4. Need different discovery method

Recommendations:
✅ Keep polling at 5-minute intervals
✅ When market appears in Gamma, grab token_ids immediately
✅ Subscribe to CLOB WebSocket for that token_id
✅ Track prices + order book until market resolves

Strategy for Option B:
  1. Start polling task that tries every 30 seconds
  2. Calculate next expected condition_id = current_time // 300 * 300
  3. When market found, add to active subscriptions
  4. Continue polling for next market (always looking ahead)
  5. By end of 7 days, will have captured hundreds of markets
""")

print("\n" + "=" * 100)
print("NEXT STEP FOR OPTION B")
print("=" * 100)

print("""
Instead of pre-finding all markets, use a POLLING DISCOVERY approach:

1. **Polling thread** (every 30 seconds):
   - Calculate expected next market condition_id
   - Query Gamma API for that ID
   - If found: grab token_ids, subscribe to CLOB

2. **CLOB WebSocket thread** (per token_id):
   - Subscribe to token_ids as they're discovered
   - Collect prices + order book every 10 seconds
   - Track volume, spreads, imbalances

3. **Resolution tracker** (every 5 minutes):
   - Poll Gamma API for recently updated markets
   - Identify which markets have resolved
   - Record: condition_id, timestamp, outcome (UP/DOWN), final_price

4. **Backtesting** (continuous):
   - For each resolved market, test 4 signals
   - Update win rates + statistics
   - Print interim results every 100 windows

This approach:
✅ Automatically discovers new markets as they appear
✅ No need to pre-compute market list
✅ Scales to any number of markets
✅ Handles market rotation naturally
""")

