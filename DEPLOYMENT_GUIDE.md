# Game-Gauntlet Deployment Guide
**Target:** Production deployment to Vercel (frontend) + Railway (backend)
**Time Required:** ~10 minutes
**Difficulty:** Easy (UI-based, no CLI required)

---

## Pre-Deployment Checklist ✅

- ✅ Backend API code: Complete and tested
- ✅ Frontend code: Built and ready
- ✅ Database: Neon PostgreSQL (already live)
- ✅ GitHub repos: Both pushed with clean history
- ✅ Environment vars: All configured

---

## Option A: Deploy to Vercel + Railway (Recommended)

### Step 1: Deploy Frontend to Vercel

**1.1 Go to Vercel Dashboard**
- Visit https://vercel.com/dashboard
- Sign in with your GitHub account (llamillamas)

**1.2 Import Project**
- Click "New Project"
- Select "Import Git Repository"
- Search for: `llamillamas/game-gauntlet-frontend`
- Click "Import"

**1.3 Configure Project**
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (default)
- **Build Command:** `next build` (auto)
- **Output Directory:** `.next` (auto)

**1.4 Environment Variables**
Click "Add Environment Variables":
```
NEXT_PUBLIC_API_URL = http://localhost:3001/api/v1  (TEMPORARY - update after backend deployed)
NEXT_PUBLIC_SOLANA_NETWORK = devnet
NEXT_PUBLIC_SOLANA_RPC_URL = https://devnet.helius-rpc.com/?api-key=856a17f3-b3f2-4fcb-9263-e3a31eabfe98
```

**1.5 Deploy**
- Click "Deploy"
- Wait 1–2 minutes
- You'll get a URL: `https://[random-name].vercel.app`
- Save this URL

---

### Step 2: Deploy Backend to Railway

**2.1 Go to Railway Dashboard**
- Visit https://railway.app/dashboard
- Sign in with your GitHub account

**2.2 Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Search for: `llamillamas/game-gauntlet`
- Select the repo

**2.3 Configure Service**
- **Root Directory:** `projects/game-gauntlet/backend`
- **Build Command:** `npm install && npm run build` (if needed, or leave default)
- **Start Command:** `node src/server.js`
- Click "Deploy"

**2.4 Add Environment Variables**
Once deployment starts, go to "Variables" tab:
```
DATABASE_URL = postgresql://neondb_owner:npg_pdCG0AmqcD8R@ep-royal-bonus-a1l69lp4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

SOLANA_RPC_URL = https://devnet.helius-rpc.com/?api-key=856a17f3-b3f2-4fcb-9263-e3a31eabfe98
SOLANA_NETWORK = devnet

GAME_REGISTRY_PROGRAM_ID = GGReg1111111111111111111111111111111111111111
BETTING_POOL_PROGRAM_ID = GGBet1111111111111111111111111111111111111111
RESULTS_SETTLEMENT_PROGRAM_ID = GGRes1111111111111111111111111111111111111111
USDC_MINT = EPjFWaJrgqAfkYF2zthencG2K6cqtjUWg3oqWXW9vLw

NODE_ENV = production
PORT = 3000
```

**2.5 Wait for Deployment**
- Railway will auto-deploy
- You'll get a public URL once deployment completes
- Format: `https://[service-name]-[random].railway.app`
- Save this URL

---

### Step 3: Link Frontend to Backend

**3.1 Update Frontend Environment Variables**
- Go back to Vercel dashboard
- Find the `game-gauntlet-frontend` project
- Go to "Settings" → "Environment Variables"
- Edit `NEXT_PUBLIC_API_URL`
- Change from `http://localhost:3001/api/v1` to:
  ```
  https://[railway-backend-url]/api/v1
  ```
  (Replace with your actual Railway URL from Step 2.5)
- Save

**3.2 Redeploy Frontend**
- Go to "Deployments" tab
- Click the three dots on the latest deployment
- Select "Redeploy"
- Wait for new deployment

---

### Step 4: Test Deployment

**4.1 Test Backend API**
Open in browser:
```
https://[railway-backend-url]/health
```
Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T...",
  "version": "1.0.0",
  "service": "game-gauntlet-api"
}
```

**4.2 Test Frontend**
Visit:
```
https://[vercel-frontend-url]
```
Should load the Game-Gauntlet frontend without errors.

**4.3 Test API Call from Frontend**
In browser console, try:
```javascript
fetch('https://[railway-url]/api/v1/events')
  .then(r => r.json())
  .then(console.log)
```
Should return array of events.

---

## Option B: Deploy to Render + Netlify (Alternative)

### Frontend (Netlify)
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select `llamillamas/game-gauntlet-frontend`
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Add env vars (same as above)
7. Deploy

### Backend (Render)
1. Go to https://render.com/dashboard
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repo: `llamillamas/game-gauntlet`
5. Name: `game-gauntlet-backend`
6. Root Directory: `projects/game-gauntlet/backend`
7. Build command: `npm install && npm run build`
8. Start command: `node src/server.js`
9. Add environment variables (same as Railway above)
10. Deploy

---

## Troubleshooting

### Frontend won't load
- Check build logs in Vercel dashboard
- Ensure Node 18+ is selected
- Verify all env vars are set

### Backend returns 500 error
- Check Railway logs in dashboard
- Verify DATABASE_URL is correct
- Ensure SOLANA_RPC_URL is accessible
- Check all required env vars are set

### Frontend can't reach backend
- Verify NEXT_PUBLIC_API_URL in Vercel is correct
- Check CORS is enabled on backend (it is: `cors()` middleware)
- Verify backend service is running (check Railway logs)

### Database connection failed
- Copy exact DATABASE_URL from Neon dashboard
- Ensure all special characters are URL-encoded
- Test connection: `psql [DATABASE_URL]`

---

## Production Checklist

Before going live:

- [ ] Both services deployed and running
- [ ] API health check responds with 200
- [ ] Frontend loads without errors
- [ ] Frontend can call backend API
- [ ] Database queries work
- [ ] Mock Solana program IDs functional
- [ ] All env vars configured correctly
- [ ] CORS allows frontend domain
- [ ] Rate limiting configured (100/15min)
- [ ] Error logging working
- [ ] Monitoring alerts set up (optional but recommended)

---

## Post-Deployment

### Monitor Services
- Vercel: https://vercel.com/dashboard → Analytics
- Railway: https://railway.app → Logs & Metrics

### Update Docs
Once deployed, update README.md files with live URLs:
- Frontend: https://[vercel-url]
- Backend: https://[railway-url]
- API Docs: https://[railway-url]/api/docs

### Next Phase: Contract Deployment
Once frontend is live, deploy Solana contracts:
1. Fix Rust build environment
2. Build 3 programs
3. Deploy to devnet
4. Update backend .env with real program IDs
5. Uncomment contract TODOs in API routes
6. Redeploy backend

---

## Deployment Costs

### Monthly Estimate
- **Vercel (Frontend):** Free tier or $20/month Pro
- **Railway (Backend):** ~$5–20/month (pay-as-you-go)
- **Neon (Database):** ~$5–15/month (already deployed)
- **Total:** ~$30–50/month

### Cost Optimization
- Use Vercel free tier while traffic is low
- Railway bill resets monthly (use credits if available)
- Monitor and optimize database queries

---

## Support

If deployment fails:
1. Check service logs (Vercel/Railway dashboards)
2. Verify all environment variables
3. Ensure GitHub repos are pushed
4. Try redeploying
5. Check Discord in game-gauntlet channel

---

**Status: Ready to Deploy ✅**
**Next: Execute deployment steps above**
**Questions? Check BLOCKER_RESOLUTION_COMPLETE.md for architecture details**
