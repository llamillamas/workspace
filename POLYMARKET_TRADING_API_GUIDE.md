# Polymarket Trading API Guide — How to Place & Manage Trades

**Source:** https://github.com/RobotTraders/bits_and_bobs/blob/main/polymarket_python.ipynb  
**Status:** DOCUMENTED FOR PRODUCTION USE  
**Date:** March 5, 2026

---

## Quick Reference

### Installation
```bash
pip install py-clob-client requests
```

### Key Classes & Imports
```python
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, MarketOrderArgs, OrderType, OpenOrderParams, BalanceAllowanceParams, AssetType
from py_clob_client.order_builder.constants import BUY, SELL
```

### API Endpoints
```
Gamma API:  https://gamma-api.polymarket.com    (market metadata)
Data API:   https://data-api.polymarket.com      (user positions, leaderboard)
CLOB API:   https://clob.polymarket.com          (trading, order book)
```

---

## Section 1: AUTHENTICATION

### Step 1: Credentials Setup
```python
FUNDER_ADDRESS = "your-wallet-address"      # Ethereum address (from wallet)
PRIVATE_KEY = "your-private-key-here"       # Never commit to GitHub
SIGNATURE_TYPE = 1                           # 1 = Email/Magic wallet (most common)

# Signature types:
# 0 = EOA (MetaMask, hardware wallet)
# 1 = Email/Magic wallet (Polymarket's default)
# 2 = Browser wallet proxy
```

### Step 2: Initialize Authenticated Client
```python
auth_client = ClobClient(
    "https://clob.polymarket.com",
    key=PRIVATE_KEY,
    chain_id=137,                            # Polygon mainnet
    signature_type=SIGNATURE_TYPE,
    funder=FUNDER_ADDRESS
)

# Derive API credentials
creds = auth_client.derive_api_key()
auth_client.set_api_creds(creds)
```

### Step 3: Check Balance
```python
balance = auth_client.get_balance_allowance(
    BalanceAllowanceParams(asset_type=AssetType.COLLATERAL)
)
usdc_balance = int(balance['balance']) / 1e6
print(f"USDC Balance: ${usdc_balance:.2f}")
```

---

## Section 2: MARKET DISCOVERY

### Find Markets
```python
import requests

response = requests.get(
    "https://gamma-api.polymarket.com/markets",
    params={
        "limit": 50,
        "active": True,
        "closed": False,
        "order": "volume24hr",
        "ascending": False
    }
)
markets = response.json()

for m in markets[:5]:
    print(f"Market: {m['question']}")
    print(f"  Volume 24h: ${m.get('volume24hr', 0):,.0f}")
    print(f"  Liquidity: ${m.get('liquidityNum', 0):,.0f}")
    print(f"  Condition ID: {m['conditionId']}")
    print()
```

### Get Market Details
```python
market = markets[0]
condition_id = market['conditionId']

# Extract token IDs (YES and NO outcomes)
clob_token_ids = json.loads(market.get('clobTokenIds'))
yes_token_id = clob_token_ids[0]
no_token_id = clob_token_ids[1]

print(f"YES Token ID: {yes_token_id}")
print(f"NO Token ID:  {no_token_id}")
```

---

## Section 3: ORDER BOOK ANALYSIS

### Create Read-Only Client (for data)
```python
from py_clob_client.client import ClobClient

client = ClobClient("https://clob.polymarket.com")
```

### Get Order Book
```python
# Get order book for YES token
book = client.get_order_book(yes_token_id)

# Sort asks (people selling YES)
sorted_asks = sorted(book.asks, key=lambda x: float(x.price), reverse=False)

# Sort bids (people buying YES)
sorted_bids = sorted(book.bids, key=lambda x: float(x.price), reverse=True)

print("=== YES Token Order Book ===")
print("\nTop 5 Asks (prices to BUY at):")
for ask in sorted_asks[:5]:
    print(f"  ${ask.price} | {ask.size} shares")

print("\nTop 5 Bids (prices to SELL at):")
for bid in sorted_bids[:5]:
    print(f"  ${bid.price} | {bid.size} shares")
```

### Get Prices
```python
# Midpoint price (fair value)
mid = client.get_midpoint(yes_token_id)
print(f"Midpoint: ${mid['mid']}")

# Best ask (what you'd pay to buy)
buy_price = client.get_price(yes_token_id, side="BUY")
print(f"Best ask (BUY at): ${buy_price['price']}")

# Best bid (what you'd get if you sell)
sell_price = client.get_price(yes_token_id, side="SELL")
print(f"Best bid (SELL at): ${sell_price['price']}")

# Spread (difference)
spread = client.get_spread(yes_token_id)
print(f"Spread: ${spread['spread']}")
```

---

## Section 4: PLACE A MARKET ORDER

**Market Order = Buy/Sell immediately at current best price**

```python
from py_clob_client.clob_types import MarketOrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# Create market order: Spend $5 on YES at market price
market_order = MarketOrderArgs(
    token_id=yes_token_id,
    amount=5.0,                              # Dollar amount to spend
    side=BUY,                                # BUY or SELL
    order_type=OrderType.FOK                 # Fill-or-Kill (all-or-nothing)
)

# Sign the order
signed_market_order = auth_client.create_market_order(market_order)

# Execute the order
response = auth_client.post_order(signed_market_order, OrderType.FOK)
print(f"Order executed! Response: {response}")
```

### Order Types
- **FOK (Fill-or-Kill):** Execute entire order or cancel. Used for market orders.
- **GTC (Good Till Cancelled):** Sit in order book until filled or manually cancelled. Used for limit orders.
- **IOC (Immediate-or-Cancel):** Fill what you can immediately, cancel rest.

---

## Section 5: PLACE A LIMIT ORDER

**Limit Order = Sit in order book, fill when price reaches your target**

```python
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# Create limit order: Buy 10 YES shares at $0.50 each
limit_order = OrderArgs(
    token_id=yes_token_id,
    price=0.50,                              # Price per share
    size=10.0,                               # Number of shares
    side=BUY                                 # BUY or SELL
)

# Sign the order
signed_order = auth_client.create_order(limit_order)

# Post the order (GTC = stays in book until filled)
response = auth_client.post_order(signed_order, OrderType.GTC)
print(f"Limit order placed! Response: {response}")
```

---

## Section 6: MANAGE OPEN ORDERS

### Get Your Open Orders
```python
from py_clob_client.clob_types import OpenOrderParams

open_orders = auth_client.get_orders(OpenOrderParams())
print(f"Open orders: {len(open_orders)}")

for order in open_orders[:5]:
    print(f"ID: {order['id'][:20]}...")
    print(f"  Side: {order['side']} | Price: ${order['price']} | Size: {order['original_size']}")
```

### Cancel a Specific Order
```python
if open_orders:
    order_id = open_orders[0]["id"]
    result = auth_client.cancel(order_id)
    print(f"Cancelled: {order_id[:20]}...")
```

### Cancel All Orders
```python
result = auth_client.cancel_all()
print("All orders cancelled!")
```

---

## Section 7: ADVANCED — REAL-TIME PRICE TRACKING

```python
import time

def track_price(token_id, duration_seconds=30, interval=5):
    """Track price changes in real-time."""
    client = ClobClient("https://clob.polymarket.com")
    start_time = time.time()
    prices = []
    
    while time.time() - start_time < duration_seconds:
        mid = client.get_midpoint(token_id)
        mid_price = float(mid['mid'])
        timestamp = time.strftime("%H:%M:%S")
        prices.append(mid_price)
        
        change = ""
        if len(prices) > 1:
            diff = prices[-1] - prices[-2]
            change = f" ({'+' if diff >= 0 else ''}{diff:.4f})"
        
        print(f"[{timestamp}] ${mid_price}{change}")
        time.sleep(interval)
    
    print(f"Total change: ${prices[-1] - prices[0]:.4f}")
    return prices

# Usage
prices = track_price(yes_token_id, duration_seconds=60, interval=2)
```

---

## Section 8: ADVANCED — GET USER POSITIONS

```python
import requests

def get_user_positions(wallet_address):
    """Get a user's current positions across all markets."""
    url = "https://data-api.polymarket.com/positions"
    params = {"user": wallet_address}
    response = requests.get(url, params=params)
    return response.json()

# Usage
positions = get_user_positions("0x1234567890123456789012345678901234567890")
for pos in positions:
    print(f"Market: {pos['market']}")
    print(f"  Position: {pos['position']} shares")
    print(f"  Value: ${pos['value']}")
```

---

## Section 9: PRODUCTION CHECKLIST

Before placing real trades:

### Security
- [ ] Store PRIVATE_KEY in environment variables (never in code)
- [ ] Use separate wallet for trading (not main holdings)
- [ ] Enable 2FA on email account (if using email wallet)

### Testing
- [ ] Test with $1-5 market orders first
- [ ] Verify balance updates correctly
- [ ] Confirm order fills at expected prices
- [ ] Cancel test orders successfully

### Risk Management
- [ ] Set maximum position size (e.g., 5% of capital per trade)
- [ ] Set maximum daily loss limit (e.g., 15% of capital)
- [ ] Use stop-loss orders (manually monitor)
- [ ] Track all trades in a spreadsheet

### Monitoring
- [ ] Check API rate limits (frequency of requests)
- [ ] Monitor order fill times
- [ ] Track slippage (price paid vs midpoint)
- [ ] Log all trades with timestamps

---

## Section 10: COMMON ERRORS & FIXES

### Error: "Invalid signature"
```
Cause: Wrong PRIVATE_KEY or SIGNATURE_TYPE
Fix: Double-check key format and verify SIGNATURE_TYPE matches your wallet type
```

### Error: "Insufficient balance"
```
Cause: Not enough USDC in wallet
Fix: Deposit more USDC to your Polymarket wallet
```

### Error: "Order rejected: Price out of bounds"
```
Cause: Limit order price too far from midpoint
Fix: Use price closer to current midpoint (within 10-20%)
```

### Error: "Rate limit exceeded"
```
Cause: Too many API calls too quickly
Fix: Add delays between requests (minimum 100ms between calls)
```

---

## Integration with BTC 5m Strategy

For automated trading on BTC up/down 5m markets:

```python
def execute_trade_signal(signal_score, yes_token_id, amount_usd):
    """Execute trade based on signal score."""
    
    if signal_score >= 2.0:
        # BUY YES (price going up)
        order = MarketOrderArgs(
            token_id=yes_token_id,
            amount=amount_usd,
            side=BUY,
            order_type=OrderType.FOK
        )
        signed = auth_client.create_market_order(order)
        response = auth_client.post_order(signed, OrderType.FOK)
        print(f"BUY YES: {response}")
        
    elif signal_score <= -2.0:
        # SELL YES (price going down)
        order = MarketOrderArgs(
            token_id=yes_token_id,
            amount=amount_usd,
            side=SELL,
            order_type=OrderType.FOK
        )
        signed = auth_client.create_market_order(order)
        response = auth_client.post_order(signed, OrderType.FOK)
        print(f"SELL YES: {response}")
    
    else:
        # No clear signal
        print("No edge signal, skip trade")

# Usage in main loop
signal = calculate_signal()  # Your signal logic
execute_trade_signal(signal, yes_token_id, amount_usd=10.0)
```

---

## Resources

- **Official Docs:** https://docs.polymarket.com/
- **Gamma API:** https://gamma-api.polymarket.com/ (market data)
- **Data API:** https://data-api.polymarket.com/ (user data)
- **CLOB API:** https://clob.polymarket.com/ (trading)
- **Python Client:** https://github.com/Polymarket/py-clob-client
- **Example Notebook:** https://github.com/RobotTraders/bits_and_bobs/blob/main/polymarket_python.ipynb

---

## File Locations in Workspace

When you provide API keys, I'll create:
- `polymarket_trading_client.py` — Authenticated trading class
- `trading_examples.py` — Ready-to-run examples
- `secrets.env` — API key storage (gitignored)

---

**Status:** READY FOR INTEGRATION  
**Next:** Awaiting API key from F1 Master to build automated trading system
