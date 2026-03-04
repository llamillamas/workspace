# Dual Forward Test — A/B Testing Two Strategies (SIMULATED/PAPER)

**Started:** March 4, 2026, 13:26 UTC  
**Duration:** 30 days (Mar 4 → Apr 3)  
**Type:** 🔵 **PAPER TEST** (Simulated, not real execution)  
**Hypothesis:** Consistency beats volatility (or does it?)  
**Paper Capital:** $10,000 (split equally, $5K each)

---

## ⚠️ IMPORTANT: THIS IS A SIMULATION

**What we're testing:**
- Historical performance of traders (their past ROI)
- If we *had* copied them at their historical average returns, would we be profitable?
- Which strategy (volatile vs consistent) would have worked better historically?

**What we're NOT testing:**
- ❌ Real trade execution
- ❌ Actual wallet movements
- ❌ Real slippage/fees
- ❌ Actual timing (entry/exit prices)

**Why this approach:**
- Fast validation of strategy concept
- No real capital at risk
- Identifies which strategy thesis is sound
- Foundation for live copy-trading (Phase 2)

---

## 📋 Phase 1 vs Phase 2

**Phase 1 (NOW):** Paper Test
- Validate strategy concept
- See which approach (A vs B) is theoretically better
- Build confidence before committing capital

**Phase 2 (IF Phase 1 succeeds):** Live Copy-Trading
- Real wallet monitoring
- Real trade execution
- Real P&L (actual money moving)
- True proof of concept

---

## 🎯 TWO COMPETING STRATEGIES

### STRATEGY A: Volatile But Flashy (Top 10 Rotation)
- **Philosophy:** Chase current winners, rebalance monthly
- **Traders:** Top 10 performers from leaderboard (Mar 4 snapshot)
- **Risk:** High turnover, 30% dropout rate observed
- **Expected Return:** 15-20% monthly (if they stay winners)
- **Capital Allocated:** $5,000

**Top 10 Tracked:**
1. 0x2a2C53bD (15.51%)
2. MinorKey4 (25.66%)
3. gmanas (1.78%)
4. WoofMaster (14.28%)
5. 432614799197 (4.0%)
6. bcda (18.23%)
7. joosangyoo (5.91%)
8. gatorr (32.1%)
9. gopatriots (5.96%)
10. (to be confirmed from latest leaderboard)

---

### STRATEGY B: Boring But Stable (Historically Consistent)
- **Philosophy:** Only trade proven long-term winners
- **Traders:** Top 3 appearing in top 100 across ALL 4 timeframes
- **Risk:** Low turnover, lower individual returns but stable
- **Expected Return:** 6-15% monthly (proven sustainable)
- **Capital Allocated:** $5,000

**Top 3 Consistent:**
1. **0x2a2C53bD** — ROI 15.51%, Ranks: #1(Day) #1(Week) #2(Month) #49(All-Time) → Most proven
2. **gopatriots** — ROI 2.25%, Ranks: #9(Day) #9(Week) #9(Month) #36(All-Time) → Steady performer
3. **sovereign2013** — ROI 0.65%, Ranks: #17(Day) #24(Week) #26(Month) #47(All-Time) → Declining but stable

---

## 📊 PORTFOLIO SETUP

| Portfolio | Allocation | Strategy | Expected ROI | Risk Level |
|-----------|-----------|----------|--------------|-----------|
| **A (Volatile)** | $5,000 | Top 10 rotation | 15-20% | 🔴 HIGH |
| **B (Stable)** | $5,000 | Consistent 3 | 6-15% | 🟢 LOW |
| **Total** | $10,000 | Dual test | 10-17.5% avg | 🟡 MEDIUM |

---

## 📋 DAILY TRACKING

**Every 24h at 13:26 UTC:**

### Strategy A (Top 10)
- [ ] Leaderboard rankings (are they still top 100?)
- [ ] Who dropped out
- [ ] New replacements needed
- [ ] Estimated portfolio value
- [ ] P&L vs baseline

### Strategy B (Consistent 3)
- [ ] Are all 3 still in top 100?
- [ ] Individual performance changes
- [ ] Consistency score (how many timeframes still?)
- [ ] Estimated portfolio value
- [ ] P&L vs baseline

---

## 🔄 REBALANCING RULES

### Strategy A (Volatile)
- **Daily:** Check for dropouts
- **Weekly:** Replace bottom performer if ROI turns negative
- **Monthly:** Reset to top 10 fresh snapshot

### Strategy B (Stable)
- **Weekly:** Check if any trader drops below top 100
- **Only then:** Replace with next most consistent trader
- **Goal:** Minimize churn

---

## 📈 SUCCESS CRITERIA

| Outcome | Winner | Lesson |
|---------|--------|--------|
| **A outperforms B by >5%** | Volatility wins | Chase hot traders, accept turnover |
| **B outperforms A by >5%** | Consistency wins | Stick with proven performers |
| **Within 5% of each other** | Tie (diversify) | Use both strategies together |

---

## 🎯 EXPECTED SCENARIOS

### Best Case for A (Rotating)
- Top 10 stay hot
- 20% monthly return on $5K = +$1,000/month
- Total: $6,000 after 30 days

### Best Case for B (Consistent)
- All 3 stay in top 100
- 12% monthly return on $5K = +$600/month
- Total: $5,600 after 30 days

### Worst Case for A
- 50% of traders drop
- Return drops to 5%
- Total: $5,250 after 30 days

### Worst Case for B
- 1-2 traders drop but replaced
- Return stays 8%
- Total: $5,400 after 30 days

---

## 📊 TRACKER TEMPLATE

### STRATEGY A — Daily Log

**March 4, 13:26 UTC — STARTED**

| Trader | Rank | Status | P&L | ROI | Allocation |
|--------|------|--------|-----|-----|-----------|
| 0x2a2C53bD | 1 | ✅ ACTIVE | +$774 | 15.51% | $500 |
| MinorKey4 | 2 | ✅ ACTIVE | +$641 | 25.66% | $500 |
| gmanas | 14 | ✅ ACTIVE | +$44 | 1.78% | $500 |
| WoofMaster | 13 | ✅ ACTIVE | +$357 | 14.28% | $500 |
| (5 more...) |  |  |  |  |  |

**Portfolio A Value:** $5,000 (starting)
**Estimated Gain:** +$316 (6.3% from first check)

---

### STRATEGY B — Daily Log

**March 4, 13:26 UTC — STARTED**

| Trader | Rank (All-Time) | Status | P&L | ROI | Allocation |
|--------|-----------------|--------|-----|-----|-----------|
| 0x2a2C53bD | #49 | ✅ ACTIVE (All 4 timeframes) | +$387 | 15.51% | $2,500 |
| gopatriots | #36 | ✅ ACTIVE (All 4 timeframes) | +$56 | 2.25% | $1,500 |
| sovereign2013 | #47 | ✅ ACTIVE (All 4 timeframes) | +$16 | 0.65% | $1,000 |

**Portfolio B Value:** $5,000 (starting)
**Estimated Gain:** +$459 (9.2% from first check)

---

## 🎓 WHAT WE'RE TESTING

1. **Do hot traders stay hot?**
   - Strategy A assumes yes
   - If yes, A wins
   - If no, B wins

2. **Is consistency worth the lower individual returns?**
   - 0x2a2C53bD has 15.51% ROI (same as Strategy A leaders)
   - gopatriots has only 2.25% (drag)
   - Will the mix beat the volatility?

3. **Can we even predict who will stay winners?**
   - Both strategies assume past performance correlates to future
   - 30-day dropout rate suggests it might not
   - This test will prove it

---

## 🚀 NEXT STEPS

**Tonight (13:26 UTC):**
- [ ] Start both forward tests simultaneously
- [ ] Log initial portfolio values
- [ ] Post to Discord with daily breakdown

**Daily (13:26 UTC):**
- [ ] Run both monitor scripts
- [ ] Update tracker for both portfolios
- [ ] Report winner so far

**Weekly (Mondays):**
- [ ] Full analysis
- [ ] Compare returns side-by-side
- [ ] Rebalance if needed

**Monthly (April 3):**
- [ ] Final verdict
- [ ] Which strategy outperformed?
- [ ] Lessons for production deployment

---

## 📌 KEY METRICS TO TRACK

| Metric | Strategy A | Strategy B | Winner |
|--------|-----------|-----------|--------|
| **Avg ROI** | ? | ? | TBD |
| **Dropout Rate** | ? | ? | TBD |
| **Volatility** | High | Low | TBD |
| **Psychological** | Stressful | Calm | TBD |
| **Final Return** | ? | ? | TBD |

---

## 💭 THE PHILOSOPHICAL QUESTION

**Strategy A:** "The market rewards winners. Current hot traders are more likely to stay hot than average traders. Chase them."

**Strategy B:** "The market is chaotic. Only traders proven over 6+ months have real edge. Stick with them."

**Which is right?** This test will answer.

---

**Status:** ✅ READY TO START  
**Both Portfolios:** Starting at $5,000 each, $10,000 total  
**Contest:** May the better strategy win.

---

Run both monitors:
```bash
# Strategy A (rotating top 10)
node monitor-traders.js

# Strategy B (consistent 3) — Will create next
node monitor-consistent-traders.js
```
