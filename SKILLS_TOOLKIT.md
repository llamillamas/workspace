# SKILLS_TOOLKIT.md - Always-On Capabilities

**Read this at the start of every session.** This is your persistent toolkit documentation.

---

## ⚡ Core Skills (Auto-Load)

These 10 skills are always available in `/workspace/skills/`. Load relevant SKILL.md when task matches:

| Skill | Purpose | When to Use | SKILL.md |
|-------|---------|-------------|----------|
| **gsd** | Structured project planning & phase tracking | "Help me plan this project" | `/workspace/skills/gsd/SKILL.md` |
| **gsd-system** | Full context engineering (prevents rot, fresh 200k/task) | Complex multi-phase projects | `/workspace/skills/gsd-system/SKILL.md` |
| **coding-agent** | Autonomous code implementation in background | "Build this feature" (spawns sub-agent) | `/workspace/skills/coding-agent/SKILL.md` |
| **cellcog** | Multi-modal AI (files→reports, dashboards, videos) | "Analyze these PDFs and create a report" | `/workspace/skills/cellcog/SKILL.md` |
| **ui-ux-pro-max** | Design intelligence (styles, colors, fonts, charts) | "Lock design for SaaS dashboard" | `/workspace/skills/ui-ux-pro-max/SKILL.md` |
| **audit-logging** | Track all actions with timestamps | Used by other skills automatically | `/workspace/skills/audit-logging/SKILL.md` |
| **rate-limiter** | Prevent runaway operations | Used by other skills automatically | `/workspace/skills/rate-limiter/SKILL.md` |
| **secrets-manager** | Encrypt & redact sensitive data | Used by other skills automatically | `/workspace/skills/secrets-manager/SKILL.md` |
| **permission-gates** | Granular access control | Used by other skills automatically | `/workspace/skills/permission-gates/SKILL.md` |
| **tavily** | AI-optimized web search (beyond Brave) | "Research X using Tavily" | `/workspace/skills/tavily/SKILL.md` |

---

## 🚀 Workflow: How These Work Together

### **For Full-Stack Development**
```
1. /gsd:new-project
   → Describe your idea

2. /gsd:discuss-phase 1
   → Use /search "saas" --domain style  (UI/UX Pro Max)
   → Lock design decisions

3. /gsd:plan-phase 1
   → Get atomic task breakdown

4. /gsd:execute-phase 1
   → coding-agent spawns automatically
   → Fresh 200k tokens per task
   → Atomic commits per task
   → Fully audited
```

### **For Analysis Work**
```
1. "Analyze these PDFs"
   → Load cellcog/SKILL.md
   → Send files + request
   → Returns: report + dashboard + video summary
```

### **For Web Research**
```
1. "Research X with current data"
   → Load tavily/SKILL.md
   → Get AI-optimized results
   → Better than Brave for LLM consumption
```

---

## 🔐 Security Stack (Always Active)

These 4 skills protect all operations:

- **audit-logging** — Every action logged to `~/.openclaw/audit.log`
- **rate-limiter** — Max 10 tool calls/min, 5 external sends/min
- **secrets-manager** — API keys encrypted in `~/.openclaw/secrets/vault.enc`
- **permission-gates** — Confirmation required for deletions & config changes

✅ **No action needed** — these run automatically.

---

## 🔑 API Keys (Optional, For Advanced Features)

Store these to unlock full capabilities:

```bash
openclaw secret set CELLCOG_API_KEY "sk_..."
openclaw secret set TAVILY_API_KEY "..."
```

Check if set:
```bash
openclaw secret get CELLCOG_API_KEY
```

---

## 📋 Quick Decision Tree

**What do you want to do?**

| Goal | Use This Skill | Command/Action |
|------|----------------|----------------|
| Plan a project | `gsd` or `gsd-system` | `/gsd:new-project` |
| Design a UI | `ui-ux-pro-max` | `/search "saas" --domain style` |
| Build code | `coding-agent` | Spawn via gsd-execute or direct task |
| Analyze files | `cellcog` | Send files + request |
| Research something | `tavily` | "Research X with Tavily" |
| Lock design decisions | `ui-ux-pro-max` + `gsd` | Use during /gsd:discuss-phase |
| Iterate on code | `coding-agent` + `ralph` | Spawned automatically in loops |

---

## 🎯 Remember

- **These skills are ALWAYS available** — no setup needed (except optional API keys)
- **Read the relevant SKILL.md** when you match a task type (I will auto-detect)
- **They work together** — GSD orchestrates code-agent, ui-ux-pro-max, etc.
- **Fully audited & secured** — Every action logged, rate-limited, encrypted

---

**Location:** `/workspace/SKILLS_TOOLKIT.md`
**Updated:** February 16, 2026
**Status:** ✅ Active & persistent across all sessions/channels
