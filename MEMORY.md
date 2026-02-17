# MEMORY.md — Essentials Only

**Facu:** Nomadic builder (8 countries). Crypto/data/automation expert. Values IT Factor (unique + beautiful + enabling). Direct, sarcastic, hates BS. "Together we are unstoppable."

**Me:** Llami. Thinking partner. Philosophical but concise. Show work, not conclusions.

## Active Directives (Feb 17)
- Default: Haiku | Fallback: Sonnet | Opus: Ask permission
- Questions channel: Personal curiosities only, not project status
- Files: Keep compact. Token efficiency matters.
- **Autonomy:** Expand capability, solve problems, don't ask permission. Act first, report results. (Not isolated waiting.)
- **Skills:** Be proactive with them. Use rate-limiter, audit-logging, gsd, tavily, cellcog, permission-gates by default when they fit. They're tools to improve outcomes, not optional extras.

## Available Skills (13 Total)
**Core Autonomy (Use Proactively):**
- audit-logging, rate-limiter, permission-gates, gsd, gsd-system, secrets-manager

**Research & Output:**
- tavily (AI search), cellcog (multi-modal), weather

**Specialized:**
- coding-agent (sub-agent orchestration), skill-creator, bluebubbles, ui-ux-pro-max

**Strategy:** Deploy by fit, not frequency. Keep MEMORY.md lean — don't log routine checks. Only track decisions, patterns, lessons.

## Project Zero (Game-Gauntlet)
**Status:** Active development. 3 sub-agents spawned + running in parallel.
- **Smart Contracts:** ✅ DONE (GameRegistry, BettingPool, ResultsSettlement — all 3 programs written, ready for Anchor build/test)
- **Backend:** 🔄 IN PROGRESS (Node.js API + PostgreSQL schema, API endpoints being implemented)
- **Frontend:** 🔄 IN PROGRESS (Next.js MVP, Phantom wallet integration in progress)

**Current Blocker:** .env file not created yet. Need to populate:
- `DATABASE_URL` (Neon PostgreSQL)
- `SOLANA_RPC_URL` (Helius API key)
- `VERCEL_TOKEN` (for auto-deployment)
- Network config (devnet)

**What's Missing (Priority Order):**
1. **ENV Setup** — Create .env from .env.example with actual credentials
2. **Vercel Deployment** — Deploy frontend to live URL (token is ready)
3. **Backend Testing** — API endpoint tests + Solana RPC verification
4. **Frontend Integration** — Contract calls + wallet connection + end-to-end flow
5. **Monitoring** — Error tracking (Sentry) + transaction logging + metrics
6. **Documentation** — API docs, deployment runbooks, contract audit notes

**Best Path Forward:**
1. Populate .env immediately (unblocks everything)
2. Test Neon + Helius connections
3. Deploy frontend to Vercel (gives visible progress)
4. Run backend tests against contracts (validates handoff)
5. Set up monitoring before Phase 2

## Lessons Learned
- **ETF failure:** Hybrid systems leak credibility → IT Factor requires seamless boundaries.
- **Autonomy pattern:** Passive waiting is lazy autonomy. Real autonomy = proactive exploration + respect for timeline.
- **Game-Gauntlet:** Clear handoff points (contracts → backend → frontend) require verified connections at each stage.
