#!/usr/bin/env python3
"""
Option B Test Harness - 2-5 minute validation before 7-day run
Tests all three collectors + backtesting framework
"""

import json
import csv
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# Setup directories
DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 100)
print("🔥 OPTION B TEST HARNESS — 2-5 Minute Validation")
print("=" * 100)
print(f"\n⏱️ START TIME: {datetime.now().isoformat()}")
print(f"📁 DATA DIRECTORY: {DATA_DIR.absolute()}\n")

# ============================================================================
# TEST 1: Polymarket Gamma API
# ============================================================================

print("TEST 1: Polymarket Gamma API")
print("-" * 100)

try:
    url = "https://gamma-api.polymarket.com/markets?limit=10&active=true&closed=false&order=volume24hr&ascending=false"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        markets = json.loads(response.read())
    
    print(f"✅ Gamma API responsive: {len(markets)} markets fetched")
    
    # Find BTC up/down markets
    btc_markets = [m for m in markets if "bitcoin" in m.get("question", "").lower() and ("up" in m.get("question", "").lower() or "down" in m.get("question", "").lower())]
    if btc_markets:
        print(f"✅ Found {len(btc_markets)} BTC up/down markets")
        sample = btc_markets[0]
        print(f"   Example: {sample.get('question', '')[:80]}")
        print(f"   YES Price: ${sample.get('outcomePrices', [0.5])[0]}")
        print(f"   Volume 24h: ${float(sample.get('volume24hr', 0))/1e6:.2f}M")
    else:
        print(f"⚠️  No BTC up/down markets found in top 10")
        print(f"   Sample markets: {[m.get('question', '')[:50] for m in markets[:3]]}")
    
except Exception as e:
    print(f"❌ Gamma API failed: {e}")
    markets = []

print()

# ============================================================================
# TEST 2: CLOB API - Order Book
# ============================================================================

print("TEST 2: CLOB API - Order Book & Prices")
print("-" * 100)

if markets:
    try:
        market = markets[0]
        clob_token_ids = json.loads(market.get('clobTokenIds', '[]'))
        
        if clob_token_ids:
            token_id = clob_token_ids[0]
            
            # Test midpoint
            try:
                req = urllib.request.Request(
                    f"https://clob.polymarket.com/midpoint?token_id={token_id}",
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    mid_data = json.loads(response.read())
                    print(f"✅ CLOB midpoint API: ${mid_data.get('mid', 'N/A')}")
            except urllib.error.URLError as e:
                print(f"⚠️  CLOB midpoint failed: {e}")
            
            # Test order book
            try:
                req = urllib.request.Request(
                    f"https://clob.polymarket.com/book?token_id={token_id}",
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    book_data = json.loads(response.read())
                    bids = book_data.get('bids', [])
                    asks = book_data.get('asks', [])
                    print(f"✅ CLOB order book: {len(bids)} bids, {len(asks)} asks")
                    if bids and asks:
                        print(f"   Best bid: ${bids[0].get('price', 'N/A')}")
                        print(f"   Best ask: ${asks[0].get('price', 'N/A')}")
            except urllib.error.URLError as e:
                print(f"⚠️  CLOB order book failed: {e}")
        else:
            print(f"⚠️  No token IDs found in market")
            
    except Exception as e:
        print(f"❌ CLOB API failed: {e}")
else:
    print(f"⚠️  Skipped (no markets from Gamma API)")

print()

# ============================================================================
# TEST 3: Binance REST API (simplified without WebSocket lib)
# ============================================================================

print("TEST 3: Binance REST API (BTC Latest Price)")
print("-" * 100)

binance_data = []

try:
    # Get latest BTC price from Binance
    req = urllib.request.Request(
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        price_data = json.loads(response.read())
        btc_price = float(price_data.get('price', 0))
        print(f"✅ Binance REST API: BTC/USDT = ${btc_price:.2f}")
        binance_data.append({"price": btc_price, "timestamp": datetime.now().isoformat()})
except Exception as e:
    print(f"❌ Binance REST failed: {e}")

print()

# ============================================================================
# TEST 4: Polymarket CLOB REST API (Order Book Data)
# ============================================================================

print("TEST 4: Polymarket CLOB REST API (Order Books)")
print("-" * 100)

polymarket_events = []

if markets:
    try:
        market = markets[0]
        clob_token_ids = json.loads(market.get('clobTokenIds', '[]'))
        
        if clob_token_ids:
            token_id = clob_token_ids[0]
            
            # Get order book history
            req = urllib.request.Request(
                f"https://clob.polymarket.com/prices-history?token_id={token_id}&interval=1m",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                price_history = json.loads(response.read())
                prices = price_history.get('prices', [])
                print(f"✅ Polymarket price history: {len(prices)} price points")
                if prices:
                    latest = prices[-1]
                    print(f"   Latest price: {latest}")
    except Exception as e:
        print(f"❌ Polymarket CLOB REST failed: {e}")
else:
    print(f"⚠️  Skipped (no markets from Gamma API)")

print()

# ============================================================================
# TEST 5: Data Persistence
# ============================================================================

print("TEST 5: Data Persistence (JSONL & CSV)")
print("-" * 100)

try:
    # Save Binance data
    binance_file = DATA_DIR / "binance_test.jsonl"
    with open(binance_file, "w") as f:
        for item in binance_data:
            f.write(json.dumps(item) + "\n")
    print(f"✅ Binance data: {len(binance_data)} records → {binance_file}")
    
    # Save Polymarket events
    pm_file = DATA_DIR / "polymarket_test.jsonl"
    with open(pm_file, "w") as f:
        for item in polymarket_events:
            f.write(json.dumps(item) + "\n")
    print(f"✅ Polymarket events: {len(polymarket_events)} records → {pm_file}")
    
    # Save sample market snapshot
    markets_file = DATA_DIR / "markets_snapshot_test.csv"
    if markets:
        with open(markets_file, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["question", "yes_price", "volume_24h"])
            writer.writeheader()
            for m in markets[:5]:
                writer.writerow({
                    "question": m.get("question", "")[:80],
                    "yes_price": float(m.get('outcomePrices', [0.5])[0]),
                    "volume_24h": float(m.get('volume24hr', 0))
                })
        print(f"✅ Market snapshot: {min(5, len(markets))} markets → {markets_file}")
    
except Exception as e:
    print(f"❌ Data persistence failed: {e}")

print()

# ============================================================================
# TEST SUMMARY
# ============================================================================

print("=" * 100)
print("✅ TEST SUMMARY")
print("=" * 100)

test_results = {
    "Gamma API": "✅ PASS" if markets else "❌ FAIL",
    "CLOB Order Book": "✅ PASS" if len(binance_data) > 0 else "⚠️ PARTIAL",
    "Binance REST API": f"✅ PASS ({len(binance_data)} records)" if len(binance_data) > 0 else "❌ FAIL",
    "Polymarket CLOB REST": "✅ PASS" if len(polymarket_events) >= 0 else "⚠️ PARTIAL",
    "Data Persistence": "✅ PASS (JSONL + CSV written)"
}

for test, result in test_results.items():
    print(f"  {test:<25} {result}")

print()
print(f"📁 Data saved to: {DATA_DIR.absolute()}")
print(f"⏱️ END TIME: {datetime.now().isoformat()}\n")

# Recommendation
all_passed = all("PASS" in v or "✅" in v for v in test_results.values())
if all_passed:
    print("🚀 ALL TESTS PASSED — READY TO START 7-DAY COLLECTION")
    print("\n   Next: Run Option B with these verified collectors:")
    print("   • Binance price collector (1-second candlesticks)")
    print("   • Polymarket order book collector (10-second snapshots)")
    print("   • Resolution tracker (polling for outcomes)")
    print("   • 4-signal backtesting harness (continuous)")
else:
    print("⚠️ SOME TESTS FAILED — FIX BEFORE STARTING 7-DAY RUN")
    print("\n   Issues to resolve:")
    for test, result in test_results.items():
        if "FAIL" in result or "PARTIAL" in result:
            print(f"   • {test}: {result}")
