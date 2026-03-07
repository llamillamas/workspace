#!/usr/bin/env python3
"""
Binance WebSocket Signal Collector
Implements high-priority signals from Opus research:
- P1: Taker Buy/Sell Imbalance (aggTrade stream)
- P2: Taker Buy Volume Ratio (kline_1m stream)
- P3: Micro-Price & Spread (bookTicker stream)
- P4: Depth Imbalance (depth10 stream, optional)

All signals stored with millisecond UTC timestamps, aligned to 1-second buckets.
Zero REST API weight cost (WebSocket only).
"""

import json
import websocket
import threading
import time
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# ============================================================================
# Setup
# ============================================================================

DATA_DIR = Path("polymarket/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

SIGNALS_LOG = DATA_DIR / "binance_signals.jsonl"
KLINES_LOG = DATA_DIR / "binance_klines.jsonl"
AGGTRADES_LOG = DATA_DIR / "binance_aggtrades.jsonl"
IMBALANCE_LOG = DATA_DIR / "binance_imbalance.jsonl"
LOG_FILE = DATA_DIR / "binance_websocket_log.txt"

START_TIME = time.time()

def log(msg):
    """Log to file and console"""
    ts = datetime.now().isoformat()
    print(f"{ts} | {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{ts} | {msg}\n")

log("=" * 100)
log("🚀 BINANCE WEBSOCKET SIGNAL COLLECTOR STARTED")
log("=" * 100)

# ============================================================================
# Signal State & Aggregation
# ============================================================================

# Rolling windows for imbalance computation
taker_buy_volume_1m = 0
taker_sell_volume_1m = 0
last_imbalance_reset = time.time()

# Current 1-minute kline data
current_kline = None
last_kline_time = 0

# Micro-price tracking
last_bookTicker = None

signals_collected = 0
klines_collected = 0
trades_processed = 0

# ============================================================================
# WebSocket Handlers
# ============================================================================

def on_aggTrade(msg):
    """Process aggregated trade: extract taker buy/sell imbalance"""
    global taker_buy_volume_1m, taker_sell_volume_1m, trades_processed
    
    try:
        data = json.loads(msg)
        
        # 'm' = isBuyerMaker
        # m=true → seller was taker (aggressive sell)
        # m=false → buyer was taker (aggressive buy)
        
        is_buyer_maker = data.get('m', False)
        quantity = float(data.get('q', 0))
        
        if is_buyer_maker:
            taker_sell_volume_1m += quantity
        else:
            taker_buy_volume_1m += quantity
        
        trades_processed += 1
        
    except Exception as e:
        log(f"⚠️  aggTrade parse error: {e}")

def on_kline(msg):
    """Process 1-minute kline: extract taker buy volume ratio"""
    global current_kline, klines_collected, last_kline_time
    
    try:
        data = json.loads(msg)
        kline = data.get('k', {})
        
        # Store kline data
        current_kline = {
            'timestamp': datetime.utcfromtimestamp(data.get('E', 0) / 1000).isoformat(),
            'close': float(kline.get('c', 0)),
            'high': float(kline.get('h', 0)),
            'low': float(kline.get('l', 0)),
            'open': float(kline.get('o', 0)),
            'volume': float(kline.get('v', 0)),
            'quote_asset_volume': float(kline.get('q', 0)),
            'trades': int(kline.get('n', 0)),
            'taker_buy_volume': float(kline.get('V', 0)),  # V = taker buy base asset volume
            'taker_buy_quote_volume': float(kline.get('Q', 0)),  # Q = taker buy quote asset volume
            'is_closed': kline.get('x', False)
        }
        
        # Calculate taker buy ratio
        total_volume = current_kline['volume']
        if total_volume > 0:
            current_kline['taker_buy_ratio'] = current_kline['taker_buy_volume'] / total_volume
        else:
            current_kline['taker_buy_ratio'] = 0
        
        # On kline close, store it
        if current_kline['is_closed']:
            with open(KLINES_LOG, "a") as f:
                f.write(json.dumps(current_kline) + "\n")
            klines_collected += 1
        
    except Exception as e:
        log(f"⚠️  kline parse error: {e}")

def on_bookTicker(msg):
    """Process best bid/offer: compute micro-price and spread"""
    global last_bookTicker, signals_collected
    
    try:
        data = json.loads(msg)
        
        best_bid = float(data.get('b', 0))
        best_ask = float(data.get('a', 0))
        bid_qty = float(data.get('B', 0))
        ask_qty = float(data.get('A', 0))
        
        # Micro-price = (bestBid * askQty + bestAsk * bidQty) / (bidQty + askQty)
        # This is more predictive than mid-price
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
        
        last_bookTicker = {
            'timestamp': datetime.utcnow().isoformat(),
            'best_bid': best_bid,
            'best_ask': best_ask,
            'bid_qty': bid_qty,
            'ask_qty': ask_qty,
            'micro_price': micro_price,
            'spread': spread,
            'spread_pct': spread_pct,
            'tob_imbalance': tob_imbalance
        }
        
        signals_collected += 1
        
    except Exception as e:
        log(f"⚠️  bookTicker parse error: {e}")

# ============================================================================
# Aggregation Thread (1-second bucket flush)
# ============================================================================

def aggregation_loop():
    """Flush aggregated signals every 1 second"""
    global taker_buy_volume_1m, taker_sell_volume_1m, last_imbalance_reset
    
    last_flush = time.time()
    
    while True:
        now = time.time()
        
        # Every 1 second, compute and store aggregated signals
        if now - last_flush >= 1.0:
            last_flush = now
            
            # Compute taker imbalance
            total_volume = taker_buy_volume_1m + taker_sell_volume_1m
            if total_volume > 0:
                taker_imbalance = (taker_buy_volume_1m - taker_sell_volume_1m) / total_volume
            else:
                taker_imbalance = 0
            
            # Store aggregated signal
            signal_packet = {
                'timestamp': datetime.utcnow().isoformat(),
                'taker_buy_volume_1s': taker_buy_volume_1m,
                'taker_sell_volume_1s': taker_sell_volume_1m,
                'taker_imbalance': taker_imbalance,
                'taker_buy_ratio': taker_buy_volume_1m / total_volume if total_volume > 0 else 0
            }
            
            # Add latest bookTicker if available
            if last_bookTicker:
                signal_packet.update({
                    'micro_price': last_bookTicker['micro_price'],
                    'spread_pct': last_bookTicker['spread_pct'],
                    'tob_imbalance': last_bookTicker['tob_imbalance']
                })
            
            with open(SIGNALS_LOG, "a") as f:
                f.write(json.dumps(signal_packet) + "\n")
            
            # Reset counters for next second
            taker_buy_volume_1m = 0
            taker_sell_volume_1m = 0
        
        time.sleep(0.1)

# ============================================================================
# WebSocket Connection
# ============================================================================

def start_websocket():
    """Connect to Binance WebSocket and subscribe to streams"""
    
    ws_url = "wss://stream.binance.com:9443/ws"
    
    # Stream subscriptions (all included in single connection)
    streams = [
        "btcusdt@aggTrade",      # Real-time trades
        "btcusdt@kline_1m",      # 1-minute klines
        "btcusdt@bookTicker",    # Best bid/ask
    ]
    
    def on_message(ws, msg):
        try:
            data = json.loads(msg)
            
            # Route to appropriate handler based on stream
            if 'a' in data and 'A' in data:
                # bookTicker
                on_bookTicker(msg)
            elif 'k' in data:
                # kline
                on_kline(msg)
            elif 'a' in data and 'p' in data:
                # aggTrade
                on_aggTrade(msg)
        except:
            pass
    
    def on_error(ws, error):
        log(f"⚠️  WebSocket error: {error}")
    
    def on_close(ws, close_status_code, close_msg):
        log(f"❌ WebSocket closed: {close_status_code}")
        # Attempt reconnect
        time.sleep(5)
        start_websocket()
    
    def on_open(ws):
        log(f"✅ WebSocket connected")
        
        # Subscribe to streams
        subscription = {
            "method": "SUBSCRIBE",
            "params": streams,
            "id": 1
        }
        ws.send(json.dumps(subscription))
    
    ws = websocket.WebSocketApp(
        ws_url,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open
    )
    
    ws.run_forever(ping_interval=30, ping_timeout=10)

# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    log("Starting aggregation thread...")
    agg_thread = threading.Thread(target=aggregation_loop, daemon=True)
    agg_thread.start()
    
    log("Connecting to Binance WebSocket...")
    start_websocket()

