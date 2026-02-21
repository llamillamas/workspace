# API Routes — Game Gauntlet
**Status:** Routes implemented and integrated ✅
**Date:** 2026-02-21 15:25 UTC

## Overview
All core API routes have been implemented with database integration. Routes are ready for Solana contract integration once smart contracts are deployed.

## Endpoints Implemented

### Events API (`/api/v1/events`)

- **GET** `/api/v1/events/:eventId` — Fetch event details
  - Returns: Event object with all fields
  - Status: 404 if not found

- **POST** `/api/v1/events` — Create new event
  - Body: `{ game_id, organizer_wallet, start_time, entry_fee, max_participants }`
  - Returns: Created event object
  - Status: 201 Created

- **POST** `/api/v1/events/:eventId/settle` — Settle event with results
  - Body: `{ winner, admin_signature }`
  - Returns: Updated event object with settled status
  - Status: 200 OK

### Bets API (`/api/v1/bets`)

- **GET** `/api/v1/bets/:betId` — Fetch bet pool details
  - Returns: Bet pool object with odds and status
  - Status: 404 if not found

- **POST** `/api/v1/bets` — Create new betting pool
  - Body: `{ event_id, bet_type, odds, deadline }`
  - Returns: Created bet pool object
  - Status: 201 Created

- **POST** `/api/v1/bets/:betId/place` — Place individual bet
  - Body: `{ wallet_address, amount, selection, signature }`
  - Returns: Bet entry object
  - Status: 201 Created
  - Validation: amount >= 1

### Wallets API (`/api/v1/wallets`)

- **GET** `/api/v1/wallets/:address` — Fetch wallet stats
  - Returns: Wallet object with staking/winning totals
  - Status: 404 if not found

- **POST** `/api/v1/wallets/:address/connect` — Onboard wallet
  - Body: `{}`
  - Returns: Wallet object (creates if not exists)
  - Status: 201 Created
  - Idempotent: Updates timestamp if already exists

## Database Integration

All endpoints are connected to PostgreSQL tables:
- ✅ events table
- ✅ bets table
- ✅ bet_entries table (for individual bet placements)
- ✅ wallets table
- ✅ games table (legacy)
- ✅ parties table (legacy)

## Contract Integration Status

**Current:** Database stubs with TODO placeholders
**Next:** Uncomment contract calls once .env has real program IDs

### Contracts Ready to Integrate

- `process.env.GAME_REGISTRY_PROGRAM_ID` — Create events on-chain
- `process.env.BETTING_POOL_PROGRAM_ID` — Create bet pools on-chain
- `process.env.RESULTS_SETTLEMENT_PROGRAM_ID` — Settle events + distribute payouts
- `process.env.USDC_MINT` — Transfer USDC to escrow accounts

## Testing the API

### Create Event
```bash
curl -X POST http://localhost:3001/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "mario-kart-1",
    "organizer_wallet": "5yNmZBX2FUxmzR5c8rVVfHXTqKxkr9jJMEzPp5TqFQ5X",
    "start_time": "2026-02-25T18:00:00Z",
    "entry_fee": 10,
    "max_participants": 16
  }'
```

### Create Bet Pool
```bash
curl -X POST http://localhost:3001/api/v1/bets \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid-here",
    "bet_type": "winner",
    "odds": {"player1": 1.5, "player2": 2.5},
    "deadline": "2026-02-25T17:55:00Z"
  }'
```

### Place Bet
```bash
curl -X POST http://localhost:3001/api/v1/bets/bet-uuid-here/place \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "9B5X4mhgKYzTV3n7mK5pQjVRD8nV2q9LwX3zP6kH4u2Y",
    "amount": 50,
    "selection": "player1",
    "signature": "solana-signature-here"
  }'
```

### Connect Wallet
```bash
curl -X POST http://localhost:3001/api/v1/wallets/9B5X4mhgKYzTV3n7mK5pQjVRD8nV2q9LwX3zP6kH4u2Y/connect \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Error Handling

All routes return consistent error format:
```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

Status codes:
- 200 OK — Request succeeded
- 201 Created — Resource created
- 400 Bad Request — Validation failed (missing fields, invalid amount)
- 404 Not Found — Resource does not exist
- 409 Conflict — Database constraint violation
- 500 Internal Server Error — Server error

## Next Steps

1. **Deploy Contracts** — Get real program IDs from Contracts Agent
2. **Update .env** — Add GAME_REGISTRY_PROGRAM_ID, BETTING_POOL_PROGRAM_ID, etc.
3. **Uncomment TODOs** — Enable contract calls in route files
4. **Test E2E Flow** — Create event → bet → place → settle
5. **Frontend Integration** — Connect frontend wallet → call API

## Files Modified

- `/src/app.js` — Added event/bet/wallet route imports and registrations
- `/src/routes/events.js` — NEW
- `/src/routes/bets.js` — NEW
- `/src/routes/wallets.js` — NEW
- `/docs/API_ROUTES.md` — NEW (this file)

---

**Phase 3 Status:** ✅ COMPLETE
Integrated into Express app. Ready for contract + frontend integration.
