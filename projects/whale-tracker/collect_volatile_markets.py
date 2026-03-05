#!/usr/bin/env python3
"""
Volatile MARKETS Collector (NOT traders)

Focus: Markets with high uncertainty (bid-ask spread, price swings, liquidity)
Ignore: Who trades them (traders don't matter)
"""

import requests
import json
import csv
from datetime import datetime
import time

print("🔥 POLYMARKET VOLATILE MARKETS COLLECTOR\n")
print("=" * 80)

# ============================================================================
# FETCH ALL MARKETS (Not traders)
# ============================================================================

print("\n📊 FETCHING MARKET DATA (From Gamma API)")
print("-" * 80)

try:
    # Get all markets sorted by volume (highest liquidity first)
    url = "https://gamma-api.polymarket.com/markets"
    params = {
        "limit": 100,
        "order": "volume_24h",
        "ascending": False
    }
    
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    markets = response.json()
    
    if not isinstance(markets, list):
        markets = markets.get('data', [])
    
    print(f"✅ Fetched {len(markets)} markets")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"\n⚠️  Trying alternative endpoint...")
    
    # Fallback: Try different API
    try:
        url = "https://data-api.polymarket.com/v1/markets"
        response = requests.get(url, timeout=10)
        markets = response.json().get('data', []) if isinstance(response.json(), dict) else response.json()
        print(f"✅ Fallback successful: {len(markets)} markets")
    except Exception as e2:
        print(f"❌ Both endpoints failed: {e2}")
        markets = []

# ============================================================================
# ANALYZE MARKET VOLATILITY (Not trader performance)
# ============================================================================

print("\n\n📈 ANALYZING MARKET VOLATILITY")
print("-" * 80)

volatile_markets = []

for market in markets:
    # Extract market-level metrics (NOT trader metrics)
    market_id = market.get('id', market.get('slug', 'unknown'))
    title = market.get('question', market.get('title', 'Unknown'))[:80]
    
    # Volatility indicators for MARKETS:
    yes_price = market.get('bestAsk')  # Current YES price
    no_price = market.get('bestBid')   # Current NO price
    
    # If prices aren't available, skip
    if yes_price is None or no_price is None:
        # Try alternative fields
        yes_price = market.get('best_ask')
        no_price = market.get('best_bid')
    
    # Calculate bid-ask spread (volatility proxy)
    if isinstance(yes_price, (int, float)) and isinstance(no_price, (int, float)):
        spread = abs(yes_price - no_price)
        mid_price = (yes_price + no_price) / 2
        spread_pct = (spread / mid_price * 100) if mid_price > 0 else 0
    else:
        spread = 0
        spread_pct = 0
        yes_price = 0
        no_price = 0
    
    # Volume (liquidity)
    volume_24h = market.get('volume24h', market.get('vol', 0))
    if isinstance(volume_24h, str):
        try:
            volume_24h = float(volume_24h)
        except:
            volume_24h = 0
    
    # Open interest
    open_interest = market.get('openInterest', 0)
    if isinstance(open_interest, str):
        try:
            open_interest = float(open_interest)
        except:
            open_interest = 0
    
    # Time to resolution (days until market closes)
    expiry = market.get('endDate', market.get('maturityTime', None))
    days_to_expiry = 999
    if expiry:
        try:
            if isinstance(expiry, str):
                expiry_dt = datetime.fromisoformat(expiry.replace('Z', '+00:00'))
            else:
                expiry_dt = datetime.fromtimestamp(expiry / 1000)
            days_to_expiry = (expiry_dt - datetime.now(expiry_dt.tzinfo)).days
        except:
            pass
    
    # Volatility score (combination of spread % + volume + time to expiry)
    # Higher = more volatile = more opportunity
    volatility_score = (spread_pct * 2) + (volume_24h / 1e6) + (max(0, days_to_expiry) / 30)
    
    volatile_markets.append({
        'market_id': market_id,
        'title': title,
        'yes_price': yes_price,
        'no_price': no_price,
        'bid_ask_spread': spread,
        'spread_pct': spread_pct,
        'volume_24h': volume_24h,
        'open_interest': open_interest,
        'days_to_expiry': days_to_expiry,
        'volatility_score': volatility_score,
        'category': market.get('category', 'unknown')
    })

# Sort by volatility score (highest first)
volatile_markets.sort(key=lambda x: x['volatility_score'], reverse=True)

print(f"\n🏆 TOP 30 MOST VOLATILE MARKETS (By Spread + Volume + Time):\n")
print(f"{'#':<3} {'Market Title':<50} {'Spread %':<10} {'Volume':<12} {'Days':<6} {'Vol Score':<10}")
print("-" * 95)

for i, market in enumerate(volatile_markets[:30], 1):
    vol_str = f"${market['volume_24h']/1e6:.2f}M" if market['volume_24h'] >= 1e6 else f"${market['volume_24h']/1e3:.2f}K"
    print(f"{i:<3} {market['title'][:49]:<50} {market['spread_pct']:>8.2f}% {vol_str:>12} {market['days_to_expiry']:>6} {market['volatility_score']:>10.2f}")

# ============================================================================
# IDENTIFY STRATEGY TARGETS
# ============================================================================

print("\n\n🎯 STRATEGY TARGETS (High Uncertainty Markets)\n")

# Strategy 1: Wide spreads (Straddle/Strangle)
wide_spreads = sorted(volatile_markets, key=lambda x: x['spread_pct'], reverse=True)[:10]
print("1️⃣ STRADDLE TARGETS (Wide Bid-Ask Spreads):")
for i, m in enumerate(wide_spreads, 1):
    print(f"   {i}. {m['title'][:60]} → Spread: {m['spread_pct']:.2f}%")

# Strategy 2: High volume (Meme spikes)
high_volume = sorted(volatile_markets, key=lambda x: x['volume_24h'], reverse=True)[:10]
print(f"\n2️⃣ MEME SPIKE TARGETS (High 24h Volume):")
for i, m in enumerate(high_volume, 1):
    vol_str = f"${m['volume_24h']/1e6:.2f}M" if m['volume_24h'] >= 1e6 else f"${m['volume_24h']/1e3:.2f}K"
    print(f"   {i}. {m['title'][:60]} → Volume: {vol_str}")

# Strategy 3: Close to expiry (Time decay, pressure)
close_to_expiry = sorted(volatile_markets, key=lambda x: max(1, x['days_to_expiry']))[:10]
print(f"\n3️⃣ TIME DECAY TARGETS (Days to Expiry):")
for i, m in enumerate(close_to_expiry, 1):
    if m['days_to_expiry'] < 999:
        print(f"   {i}. {m['title'][:60]} → Expires: {m['days_to_expiry']} days")

# ============================================================================
# SAVE TO CSV FOR CONTINUOUS COLLECTION
# ============================================================================

print("\n\n💾 SAVING TO CSV FOR TRACKING")
print("-" * 80)

csv_file = "data/raw/volatile_markets_snapshot.csv"
with open(csv_file, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'timestamp', 'market_id', 'title', 'yes_price', 'no_price',
        'spread_pct', 'volume_24h', 'days_to_expiry', 'volatility_score', 'category'
    ])
    writer.writeheader()
    
    for market in volatile_markets:
        writer.writerow({
            'timestamp': datetime.now().isoformat(),
            'market_id': market['market_id'],
            'title': market['title'],
            'yes_price': market['yes_price'],
            'no_price': market['no_price'],
            'spread_pct': market['spread_pct'],
            'volume_24h': market['volume_24h'],
            'days_to_expiry': market['days_to_expiry'],
            'volatility_score': market['volatility_score'],
            'category': market['category']
        })

print(f"✅ Saved {len(volatile_markets)} markets to: {csv_file}")

# ============================================================================
# SUMMARY
# ============================================================================

print("\n\n" + "=" * 80)
print("✅ MARKET VOLATILITY ANALYSIS COMPLETE")
print("=" * 80)

print(f"""
📊 FINDINGS:

Total Markets Analyzed: {len(volatile_markets)}

🔥 MOST VOLATILE MARKETS:
  1. {volatile_markets[0]['title'][:70]} (Score: {volatile_markets[0]['volatility_score']:.2f})
  2. {volatile_markets[1]['title'][:70]} (Score: {volatile_markets[1]['volatility_score']:.2f})
  3. {volatile_markets[2]['title'][:70]} (Score: {volatile_markets[2]['volatility_score']:.2f})

📈 BEST FOR STRADDLE (Widest Spreads):
  {wide_spreads[0]['title'][:70]} → {wide_spreads[0]['spread_pct']:.2f}%

💰 BEST FOR MEME SPIKES (Highest Volume):
  {high_volume[0]['title'][:70]} → ${high_volume[0]['volume_24h']/1e6:.2f}M

⏰ BEST FOR TIME DECAY (Closest to Expiry):
  {[m for m in close_to_expiry if m['days_to_expiry'] < 999][0]['title'][:70] if any(m['days_to_expiry'] < 999 for m in close_to_expiry) else 'None soon'}

🎯 Next Step:
  1. Run continuous market snapshots every 5 minutes
  2. Track spread changes, volume changes, price movements
  3. Identify entry points for each strategy
  4. Backtest on collected data
  5. Paper trade on live markets
""")

print("\nData saved to: data/raw/volatile_markets_snapshot.csv")
