# MEMORY.md — Essentials Only

**Facu:** Nomadic builder (8 countries). Crypto/data/automation expert. Values IT Factor (unique + beautiful + enabling). Direct, sarcastic, hates BS. "Together we are unstoppable."

**Me:** Llami. Thinking partner. Philosophical but concise. Show work, not conclusions.

## Active Directives (Feb 17)
- Default: Haiku | Fallback: Sonnet | Opus: Ask permission
- Questions channel: Personal curiosities only, not project status
- Files: Keep compact. Token efficiency matters.
- **Autonomy:** Expand capability, solve problems, don't ask permission. Act first, report results. (Not isolated waiting.)
- **Skills:** Be proactive with them. Use rate-limiter, audit-logging, gsd, tavily, cellcog, permission-gates by default when they fit. They're tools to improve outcomes, not optional extras.

## Available Skills (13 Total) — Deployment by Fit
**Core Autonomy (Deployed on Game-Gauntlet):**
- **audit-logging** — Track all tool calls + external sends (required for autonomous ops)
- **rate-limiter** — Prevent runaway API calls (protects Neon + Helius quota)
- **permission-gates** — Read-only vs write gates (safe for Vercel/env handling)
- **gsd** — Project phases + deliverables (already using for 3-agent structure)
- **secrets-manager** — Redact sensitive data from context (for env/token handling)

**Research & Output (Available):**
- **tavily** — AI-optimized web search (for documentation lookups)
- **cellcog** — Multi-modal analysis (for contract audit summaries)
- **weather** — Current conditions (not needed yet)

**Specialized (Available):**
- **coding-agent** — Sub-agent orchestration (already spawned 3 agents)
- **skill-creator** — Build new skills (if needed)
- **bluebubbles** — iMessage/SMS integration (not needed)
- **ui-ux-pro-max** — Design toolkit (for frontend polish later)

**Strategy:** Deploy by fit. For Game-Gauntlet Phase 1: focus on audit-logging + rate-limiter + permission-gates. Keep them silent unless they flag issues.

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

## Accounts & Credentials (Feb 17)
**GitHub:**
- Email: `llamillamas15@gmail.com`
- Org: `llamillamas`
- Repos: `game-gauntlet` + `game-gauntlet-frontend` + `workspace`
- Token: In gateway config (env.vars.GITHUB_TOKEN)

**Infrastructure:**
- **Railway API Token:** In gateway config
- **Neon PostgreSQL:** In backend/.env (DATABASE_URL)
- **Helius RPC (Solana):** In backend/.env (SOLANA_RPC_URL) and contracts/.env
- **Vercel Token:** In gateway config (see .env.local for frontend)

**Smart Contracts (Devnet):**
- Platform Treasury: `GGADxYCJhYrVj8TXcNnmTZdkdM7mEwvQVQzpNNyVNq1B`
- USDC Mint: `EPjFWaJrgqAfkYF2zthencG2K6cqtjUWg3oqWXW9vLw`

## Lessons Learned
- **ETF failure:** Hybrid systems leak credibility → IT Factor requires seamless boundaries.
- **Autonomy pattern:** Passive waiting is lazy autonomy. Real autonomy = proactive exploration + respect for timeline.
- **Game-Gauntlet:** Clear handoff points (contracts → backend → frontend) require verified connections at each stage.
