#!/usr/bin/env python3
"""
Find BTC up/down 5-minute markets and verify they match the pattern
from: https://polymarket.com/event/btc-updown-5m-{condition_id}
"""

import json
import urllib.request
import urllib.error
from datetime import datetime

print("=" * 100)
print("🔍 FINDING BTC UP/DOWN 5-MINUTE MARKETS")
print("=" * 100)
print(f"\nTarget URL pattern: https://polymarket.com/event/btc-updown-5m-{{condition_id}}\n")

# Query Gamma API for BTC up/down markets
try:
    url = "https://gamma-api.polymarket.com/markets?limit=100&active=true&closed=false&order=volume24hr&ascending=false"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    
    print("Querying Gamma API for markets...")
    with urllib.request.urlopen(req, timeout=10) as response:
        markets = json.loads(response.read())
    
    print(f"✅ Fetched {len(markets)} markets\n")
    
    # Filter for BTC up/down 5-minute markets
    btc_5m_markets = []
    
    for market in markets:
        question = market.get('question', '').lower()
        slug = market.get('slug', '').lower()
        
        # Look for patterns: "btc up" or "bitcoin up" or "btc down" or "bitcoin down"
        # AND 5-minute or 5m in the question/slug
        is_btc = 'bitcoin' in question or 'btc' in question or 'btc' in slug
        is_5m = '5m' in question or '5 min' in question or '5-min' in question or 'btc-updown-5m' in slug
        is_updown = ('up' in question and 'down' in question) or 'up/down' in question
        
        if is_btc and is_5m and is_updown:
            btc_5m_markets.append(market)
    
    print(f"Found {len(btc_5m_markets)} BTC up/down 5-minute markets:\n")
    
    if btc_5m_markets:
        for i, market in enumerate(btc_5m_markets[:10], 1):
            condition_id = market.get('conditionId', 'N/A')
            slug = market.get('slug', 'N/A')
            question = market.get('question', 'N/A')[:80]
            yes_price = float(market.get('outcomePrices', [0.5])[0])
            volume_24h = float(market.get('volume24hr', 0))
            
            print(f"{i}. Condition ID: {condition_id}")
            print(f"   Question: {question}")
            print(f"   Slug: {slug}")
            print(f"   YES Price: ${yes_price:.3f}")
            print(f"   Volume 24h: ${volume_24h/1e6:.2f}M")
            print(f"   URL: https://polymarket.com/event/{slug}")
            
            # Verify URL pattern
            if 'btc-updown-5m' in slug:
                print(f"   ✅ MATCHES PATTERN")
            else:
                print(f"   ⚠️  Pattern mismatch (slug={slug})")
            
            # Get token IDs for this market
            clob_token_ids = json.loads(market.get('clobTokenIds', '[]'))
            if clob_token_ids:
                print(f"   Token IDs: {clob_token_ids}")
            
            print()
    else:
        print("❌ No BTC up/down 5-minute markets found!")
        print("\nSearching for ANY 5-minute markets...\n")
        
        five_min_markets = [m for m in markets if '5m' in m.get('question', '').lower() or '5-min' in m.get('slug', '').lower()]
        
        if five_min_markets:
            for i, market in enumerate(five_min_markets[:5], 1):
                print(f"{i}. {market.get('question', '')[:80]}")
                print(f"   Slug: {market.get('slug', '')}")
                print()
    
    # Also test the specific market from F1 Master's URL
    print("\n" + "=" * 100)
    print("Testing F1 Master's specific market: condition_id = 1772735100")
    print("=" * 100 + "\n")
    
    # Search for this condition ID in our results
    f1_market = None
    for market in markets:
        if market.get('conditionId', '') == '1772735100':
            f1_market = market
            break
    
    if f1_market:
        print(f"✅ Found F1 Master's market!")
        print(f"   Question: {f1_market.get('question', '')}")
        print(f"   Slug: {f1_market.get('slug', '')}")
        print(f"   URL: https://polymarket.com/event/{f1_market.get('slug', '')}")
        print(f"   Condition ID: {f1_market.get('conditionId', '')}")
        
        clob_token_ids = json.loads(f1_market.get('clobTokenIds', '[]'))
        if clob_token_ids:
            print(f"   Token IDs: {clob_token_ids}")
            
            # Try to get order book for this market
            print(f"\n   Testing CLOB API for this market...")
            try:
                req = urllib.request.Request(
                    f"https://clob.polymarket.com/book?token_id={clob_token_ids[0]}",
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    book = json.loads(response.read())
                    bids = book.get('bids', [])
                    asks = book.get('asks', [])
                    print(f"   ✅ Order book: {len(bids)} bids, {len(asks)} asks")
                    if bids and asks:
                        print(f"      Best bid: ${bids[0].get('price', 'N/A')}")
                        print(f"      Best ask: ${asks[0].get('price', 'N/A')}")
            except Exception as e:
                print(f"   ❌ Order book fetch failed: {e}")
    else:
        print(f"⚠️  F1 Master's market (1772735100) not found in current top 100 markets")
        print(f"   (It may have resolved or rotated out)")
    
except Exception as e:
    print(f"❌ Failed to fetch markets: {e}")

print("\n" + "=" * 100)
print("SUMMARY FOR OPTION B")
print("=" * 100)
print("""
Option B needs to:
1. ✅ Query Gamma API every 5 minutes to find NEW condition_ids
2. ✅ Subscribe to the condition_ids that match: btc-updown-5m-* slug pattern
3. ✅ Get CLOB token_ids from those markets
4. ✅ Subscribe to token_ids in CLOB WebSocket
5. ✅ Collect order book + price data every 10 seconds
6. ✅ After each market resolves, capture: condition_id, timestamp, outcome (UP/DOWN)
7. ✅ Backtest 4 signals on ~2000 windows (7 days × 288 per day)

Key insight: These are ROTATING markets. A new market appears every 5 minutes.
The condition_id is what identifies each unique market window.
""")
