# Polymarket Trading API Learned & Documented (Mar 5, 17:38 UTC)

## What I Studied

**Source:** https://github.com/RobotTraders/bits_and_bobs/blob/main/polymarket_python.ipynb

**Key Learnings:**

### Authentication
```python
# Requires:
FUNDER_ADDRESS = "wallet-address"
PRIVATE_KEY = "private-key"
SIGNATURE_TYPE = 1  # Email/Magic wallet (most common)

# Initialize:
auth_client = ClobClient(CLOB_API, key=PRIVATE_KEY, chain_id=137, signature_type=1, funder=FUNDER_ADDRESS)
creds = auth_client.derive_api_key()
auth_client.set_api_creds(creds)
```

### Market Orders (Immediate Buy/Sell)
```python
from py_clob_client.clob_types import MarketOrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

market_order = MarketOrderArgs(
    token_id=yes_token_id,
    amount=5.0,  # Spend $5
    side=BUY,    # BUY or SELL
    order_type=OrderType.FOK  # Fill-or-Kill
)

signed = auth_client.create_market_order(market_order)
response = auth_client.post_order(signed, OrderType.FOK)
```

### Limit Orders (Wait for Price)
```python
limit_order = OrderArgs(
    token_id=yes_token_id,
    price=0.50,  # Buy at $0.50
    size=10.0,   # 10 shares
    side=BUY
)

signed = auth_client.create_order(limit_order)
response = auth_client.post_order(signed, OrderType.GTC)  # GTC = Good Till Cancelled
```

### Check Balance
```python
balance = auth_client.get_balance_allowance(BalanceAllowanceParams(asset_type=AssetType.COLLATERAL))
usdc_balance = int(balance['balance']) / 1e6
```

### Manage Orders
```python
# Get open orders
open_orders = auth_client.get_orders(OpenOrderParams())

# Cancel specific order
auth_client.cancel(order_id)

# Cancel all orders
auth_client.cancel_all()
```

### Order Book Data
```python
client = ClobClient(CLOB_API)  # Read-only

# Get order book
book = client.get_order_book(token_id)
sorted_asks = sorted(book.asks, key=lambda x: float(x.price))
sorted_bids = sorted(book.bids, key=lambda x: float(x.price), reverse=True)

# Get prices
mid = client.get_midpoint(token_id)
buy_price = client.get_price(token_id, side="BUY")
sell_price = client.get_price(token_id, side="SELL")
spread = client.get_spread(token_id)
```

### Key Classes
```python
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, MarketOrderArgs, OrderType, OpenOrderParams, BalanceAllowanceParams, AssetType
from py_clob_client.order_builder.constants import BUY, SELL
```

### API Endpoints
```
Gamma API:  https://gamma-api.polymarket.com      (market metadata)
Data API:   https://data-api.polymarket.com       (positions, leaderboard)
CLOB API:   https://clob.polymarket.com           (trading)
CLOB WS:    wss://ws-subscriptions-clob.polymarket.com/ws/market (real-time)
```

## What's Documented

**File Created:** `POLYMARKET_TRADING_API_GUIDE.md` (11.6 KB)

**Contents:**
1. Installation & imports
2. Authentication (3 steps)
3. Market discovery
4. Order book analysis
5. Market orders (with examples)
6. Limit orders (with examples)
7. Order management (open, cancel)
8. Real-time price tracking
9. User positions
10. Production checklist
11. Common errors & fixes
12. Integration example (BTC 5m strategy)

## Ready For

Once F1 Master provides API key, I can:
1. Create `polymarket_trading_client.py` — Authenticated client wrapper
2. Build `execute_trade_signal()` — Automated trade execution
3. Create `secrets.env` — Secure credential storage
4. Integrate with WebSocket pipeline + signal generator
5. Full automation: Signal → Order → Execution

## Integration Plan

**Current architecture:**
- WebSocket client → Real-time market data
- TradingAnalyzer → Composite signals
- (MISSING) Trade execution → Actually place orders

**With API key, will add:**
- Authenticated CLOB client → Places trades
- Position tracking → Monitor fills
- Risk management → Enforce limits
- Trade logging → Records all activity

## Status

✅ All trading API documented  
✅ Examples provided  
✅ Security best practices included  
✅ Error handling documented  
⏳ Awaiting API key to implement live trading
