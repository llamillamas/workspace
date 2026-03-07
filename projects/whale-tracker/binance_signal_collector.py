#!/usr/bin/env python3
"""
Binance Signal Collector (REST-based)
Implements high-priority signals from Opus research:
- P1: Taker Buy/Sell Imbalance (from aggTrades endpoint)
- P2: Taker Buy Volume Ratio (from klines endpoint)
- P3: Micro-Price & Spread (from order book endpoint)

All signals stored with millisecond UTC timestamps, aligned to 1-second buckets.
Uses REST API with minimal weight consumption.
"""

import json
import urllib.request
import time
import threading
from datetime import datetime
from pathlib import Path
from collections import deque

# ============================================================================
# Setup
# ============================================================================

DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

SIGNALS_LOG = DATA_DIR / "binance_signals.jsonl"
KLINES_LOG = DATA_DIR / "binance_klines.jsonl"
AGGTRADES_LOG = DATA_DIR / "binance_aggtrades.jsonl"
LOG_FILE = DATA_DIR / "binance_signal_collector_log.txt"

START_TIME = time.time()

def log(msg):
    """Log to file and console"""
    ts = datetime.now().isoformat()
    print(f"{ts} | {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("=" * 100)
log("🚀 BINANCE SIGNAL COLLECTOR STARTED (REST-based)")
log("=" * 100)

# ============================================================================
# Signal State & Aggregation
# ============================================================================

# Track trades for 1-minute rolling window
trades_buffer = deque(maxlen=10000)

signals_collected = 0
klines_collected = 0
trades_processed = 0

# Last seen trade ID (for incremental collection)
last_trade_id = 0

# ============================================================================
# Signal Collection Functions
# ============================================================================

def collect_recent_trades():
    """P1: Collect recent trades and compute taker imbalance"""
    global last_trade_id, trades_processed
    
    try:
        # Get last 100 trades
        url = "https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=100"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=5) as response:
            trades = json.loads(response.read())
        
        # Process new trades
        for trade in trades:
            trade_id = trade.get('id')
            
            if trade_id > last_trade_id:
                is_buyer_maker = trade.get('isBuyerMaker', False)
                qty = float(trade.get('qty', 0))
                
                if is_buyer_maker:
                    trade_type = 'sell'
                else:
                    trade_type = 'buy'
                
                trades_buffer.append({
                    'timestamp': datetime.utcfromtimestamp(trade.get('time', 0) / 1000).isoformat(),
                    'id': trade_id,
                    'price': float(trade.get('price', 0)),
                    'qty': qty,
                    'type': trade_type,
                    'is_buyer_maker': is_buyer_maker
                })
                
                last_trade_id = trade_id
                trades_processed += 1
    
    except Exception as e:
        log(f"⚠️  Trades error: {e}")

def compute_taker_imbalance():
    """Compute taker buy/sell imbalance from recent trades"""
    
    if not trades_buffer:
        return None
    
    buy_volume = sum(t['qty'] for t in trades_buffer if t['type'] == 'buy')
    sell_volume = sum(t['qty'] for t in trades_buffer if t['type'] == 'sell')
    
    total_volume = buy_volume + sell_volume
    if total_volume == 0:
        return None
    
    imbalance = (buy_volume - sell_volume) / total_volume
    buy_ratio = buy_volume / total_volume
    
    return {
        'taker_buy_volume': buy_volume,
        'taker_sell_volume': sell_volume,
        'taker_imbalance': imbalance,
        'taker_buy_ratio': buy_ratio,
        'trades_in_window': len(trades_buffer)
    }

def collect_klines():
    """P2: Collect 1-minute klines and extract taker buy volume ratio"""
    global klines_collected
    
    try:
        # Get last 5 minutes of 1m klines
        url = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=5) as response:
            klines = json.loads(response.read())
        
        for kline in klines:
            kline_data = {
                'timestamp': datetime.utcfromtimestamp(kline[0] / 1000).isoformat(),
                'open': float(kline[1]),
                'high': float(kline[2]),
                'low': float(kline[3]),
                'close': float(kline[4]),
                'volume': float(kline[7]),
                'quote_asset_volume': float(kline[8]),
                'trades': int(kline[8]),
                'taker_buy_volume': float(kline[9]),
                'taker_buy_quote_volume': float(kline[10])
            }
            
            # Calculate taker buy ratio
            if kline_data['volume'] > 0:
                kline_data['taker_buy_ratio'] = kline_data['taker_buy_volume'] / kline_data['volume']
            else:
                kline_data['taker_buy_ratio'] = 0
            
            with open(KLINES_LOG, "a") as f:
                f.write(json.dumps(kline_data) + "\n")
            
            klines_collected += 1
    
    except Exception as e:
        log(f"⚠️  Klines error: {e}")

def collect_orderbook():
    """P3: Collect order book and compute micro-price, spread"""
    
    try:
        # Get order book (top 10 levels)
        url = "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=10"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=5) as response:
            ob_data = json.loads(response.read())
        
        bids = ob_data.get('bids', [])
        asks = ob_data.get('asks', [])
        
        if bids and asks:
            best_bid = float(bids[0][0])
            best_ask = float(asks[0][0])
            bid_qty = sum(float(b[1]) for b in bids)
            ask_qty = sum(float(a[1]) for a in asks)
            
            # Micro-price
            total_qty = bid_qty + ask_qty
            if total_qty > 0:
                micro_price = (best_bid * ask_qty + best_ask * bid_qty) / total_qty
            else:
                micro_price = (best_bid + best_ask) / 2
            
            # Spread
            spread = best_ask - best_bid
            spread_pct = (spread / best_bid * 100) if best_bid > 0 else 0
            
            # Top-of-book imbalance
            tob_imbalance = bid_qty / (bid_qty + ask_qty) if (bid_qty + ask_qty) > 0 else 0.5
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'best_bid': best_bid,
                'best_ask': best_ask,
                'micro_price': micro_price,
                'spread': spread,
                'spread_pct': spread_pct,
                'tob_imbalance': tob_imbalance,
                'bid_qty': bid_qty,
                'ask_qty': ask_qty
            }
    
    except Exception as e:
        log(f"⚠️  Order book error: {e}")
    
    return None

# ============================================================================
# Main Collection Loop
# ============================================================================

try:
    while True:
        elapsed = time.time() - START_TIME
        
        # Collect trades continuously (every 1 second)
        collect_recent_trades()
        
        # Every 10 seconds: compute and store aggregated signals
        if int(elapsed) % 10 == 0 and int(elapsed) > 0:
            
            # Compute taker imbalance
            imbalance = compute_taker_imbalance()
            
            # Get order book snapshot
            ob_snapshot = collect_orderbook()
            
            # Collect latest klines
            collect_klines()
            
            # Combine all signals
            signal_packet = {
                'timestamp': datetime.utcnow().isoformat(),
                'elapsed_sec': int(elapsed)
            }
            
            if imbalance:
                signal_packet.update(imbalance)
            
            if ob_snapshot:
                signal_packet.update(ob_snapshot)
            
            # Store
            with open(SIGNALS_LOG, "a") as f:
                f.write(json.dumps(signal_packet) + "\n")
            
            signals_collected += 1
            
            # Progress report every 60 seconds
            if int(elapsed) % 60 == 0:
                log(f"[{int(elapsed)}s] Signals: {signals_collected} | Klines: {klines_collected} | Trades: {trades_processed}")
        
        time.sleep(1)

except KeyboardInterrupt:
    log("🛑 Collection stopped by user")
except Exception as e:
    log(f"❌ Fatal error: {e}")

