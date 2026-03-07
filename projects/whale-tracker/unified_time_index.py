#!/usr/bin/env python3
"""
Unified Time Index Creator
Combines all data sources into a single time-indexed dataset for correlation analysis.
Timestamps are the primary key for alignment.
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

DATA_DIR = Path("polymarket/data")

print("=" * 100)
print("🕐 CREATING UNIFIED TIME-INDEXED DATASET")
print("=" * 100)

# ============================================================================
# Load all data with timestamps
# ============================================================================

print("\n📂 Loading all data sources...\n")

# 1. Polymarket resolutions
resolutions = defaultdict(lambda: {})
if (DATA_DIR / "resolutions_v6.csv").exists():
    with open(DATA_DIR / "resolutions_v6.csv", 'r') as f:
        for i, line in enumerate(f):
            if i > 0 and line.strip():
                parts = line.split(',')
                ts = parts[0]
                slug = parts[1]
                resolutions[ts]['resolution'] = {
                    'slug': slug,
                    'outcome': parts[2].strip(),
                    'yes_price': float(parts[3]),
                    'no_price': float(parts[4])
                }
    print(f"✅ Resolutions: {len(resolutions)} unique timestamps")

# 2. Polymarket order books
ob_count = 0
if (DATA_DIR / "orderbooks_v6.jsonl").exists():
    with open(DATA_DIR / "orderbooks_v6.jsonl", 'r') as f:
        for line in f:
            if line.strip():
                record = json.loads(line)
                ts = record['timestamp']
                # Round to nearest second for alignment
                ts_rounded = ts[:19]  # YYYY-MM-DDTHH:MM:SS
                
                if 'polymarket_orderbook' not in resolutions[ts_rounded]:
                    resolutions[ts_rounded]['polymarket_orderbook'] = []
                
                resolutions[ts_rounded]['polymarket_orderbook'].append({
                    'slug': record['slug'],
                    'bid_count': record['bid_count'],
                    'ask_count': record['ask_count'],
                    'best_bid': record.get('best_bid'),
                    'best_ask': record.get('best_ask')
                })
                ob_count += 1
    print(f"✅ Order books: {ob_count} snapshots across {len([v for v in resolutions.values() if 'polymarket_orderbook' in v])} timestamps")

# 3. Binance metrics (10-second synced prices)
binance_price_count = 0
if (DATA_DIR / "binance_metrics.jsonl").exists():
    with open(DATA_DIR / "binance_metrics.jsonl", 'r') as f:
        for line in f:
            if line.strip():
                record = json.loads(line)
                ts = record['timestamp'][:19]
                resolutions[ts]['binance_price'] = {
                    'price': record['price'],
                    'price_change_24h': record.get('price_change_24h'),
                    'price_change_pct_24h': record.get('price_change_pct_24h'),
                    'high_24h': record.get('high_24h'),
                    'low_24h': record.get('low_24h'),
                    'volume_24h': record.get('volume_24h')
                }
                binance_price_count += 1
    print(f"✅ Binance prices: {binance_price_count} samples")

# 4. Binance signals
signal_count = 0
if (DATA_DIR / "binance_signals.jsonl").exists():
    with open(DATA_DIR / "binance_signals.jsonl", 'r') as f:
        for line in f:
            if line.strip():
                record = json.loads(line)
                ts = record['timestamp'][:19]
                resolutions[ts]['binance_signal'] = {
                    'taker_buy_volume': record.get('taker_buy_volume'),
                    'taker_sell_volume': record.get('taker_sell_volume'),
                    'taker_imbalance': record.get('taker_imbalance'),
                    'taker_buy_ratio': record.get('taker_buy_ratio'),
                    'micro_price': record.get('micro_price'),
                    'spread_pct': record.get('spread_pct'),
                    'tob_imbalance': record.get('tob_imbalance')
                }
                signal_count += 1
    print(f"✅ Signals: {signal_count} aggregates")

# 5. Binance klines (1m)
kline_count = 0
if (DATA_DIR / "binance_klines.jsonl").exists():
    with open(DATA_DIR / "binance_klines.jsonl", 'r') as f:
        for line in f:
            if line.strip():
                record = json.loads(line)
                ts = record['timestamp'][:19]
                resolutions[ts]['binance_kline'] = {
                    'open': record.get('open'),
                    'high': record.get('high'),
                    'low': record.get('low'),
                    'close': record.get('close'),
                    'volume': record.get('volume'),
                    'taker_buy_volume': record.get('taker_buy_volume'),
                    'taker_buy_ratio': record.get('taker_buy_ratio'),
                    'trades': record.get('trades')
                }
                kline_count += 1
    print(f"✅ Klines: {kline_count} 1-minute candles")

# ============================================================================
# Create unified time-indexed dataset
# ============================================================================

print(f"\n🕐 Creating unified index with {len(resolutions)} unique timestamps...\n")

# Sort by timestamp
sorted_timestamps = sorted(resolutions.keys())

# Write unified dataset
output_file = DATA_DIR / "unified_timeseries.jsonl"
with open(output_file, 'w') as f:
    for ts in sorted_timestamps:
        record = {
            'timestamp': ts,
            'data': resolutions[ts]
        }
        f.write(json.dumps(record) + "\n")

print(f"✅ Unified dataset written: {output_file}")
print(f"   Records: {len(sorted_timestamps)}")
print(f"   Time range: {sorted_timestamps[0]} → {sorted_timestamps[-1]}")

# ============================================================================
# Create summary statistics
# ============================================================================

print(f"\n" + "=" * 100)
print(f"📊 DATA ALIGNMENT SUMMARY")
print(f"=" * 100)

# Count what data is present at each timestamp
resolution_count = sum(1 for v in resolutions.values() if 'resolution' in v)
pm_ob_count = sum(1 for v in resolutions.values() if 'polymarket_orderbook' in v)
binance_price_ts = sum(1 for v in resolutions.values() if 'binance_price' in v)
signal_ts = sum(1 for v in resolutions.values() if 'binance_signal' in v)
kline_ts = sum(1 for v in resolutions.values() if 'binance_kline' in v)

print(f"""
Timestamps with each data type:
  - Resolutions: {resolution_count} ({resolution_count/len(resolutions)*100:.1f}%)
  - Polymarket OB: {pm_ob_count} ({pm_ob_count/len(resolutions)*100:.1f}%)
  - Binance prices: {binance_price_ts} ({binance_price_ts/len(resolutions)*100:.1f}%)
  - Signals: {signal_ts} ({signal_ts/len(resolutions)*100:.1f}%)
  - Klines: {kline_ts} ({kline_ts/len(resolutions)*100:.1f}%)

✅ Time-aligned dataset ready for correlation analysis
   Use unified_timeseries.jsonl for:
   - Cross-market signal correlation
   - Order flow vs market outcomes
   - Binance momentum vs Polymarket direction
""")

print(f"\n✅ TIMESTAMP ALIGNMENT COMPLETE")
print("=" * 100)

EOF
