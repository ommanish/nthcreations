# Nthcreation - Complete Deployment Guide

## 🚀 Deployment Architecture

**3 Environments:**

- **Development**: Local (localhost:3000 + localhost:4000)
- **Staging**: Vercel + Railway/Render
- **Production**: Vercel + Railway/Render

---

## 📋 Quick Setup Checklist

### 1️⃣ Deploy API (Backend) - Railway or Render

#### Option A: Railway (Recommended)

1. **Create Railway Account**: https://railway.app
2. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   ```

3. **Login**:

   ```bash
   railway login
   ```

4. **Deploy Staging API**:

   ```bash
   cd apps/api
   railway init
   # Name: nthcreation-api-staging
   railway up
   ```

5. **Add Environment Variables**:

   ```bash
   railway variables set OPENAI_API_KEY=your_key_here
   railway variables set NODE_ENV=staging
   railway variables set PORT=4000
   ```

6. **Get URL**: Copy the Railway URL (e.g., `https://nthcreation-api-staging.railway.app`)

7. **Deploy Production API**: Repeat steps 4-6 with name `nthcreation-api-production`

#### Option B: Render

1. **Create Render Account**: https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings**:
   - Root Directory: `apps/api`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
4. **Environment Variables**:
   - `OPENAI_API_KEY`: your key
   - `NODE_ENV`: staging/production
   - `PORT`: 4000

### 2️⃣ Deploy Frontend - Vercel

1. **Create Vercel Account**: https://vercel.com
2. **Import GitHub Repository**: https://vercel.com/import

3. **Staging Deployment**:
   - Project Name: `nthcreation-staging`
   - Root Directory: `apps/web`
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Environment Variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-railway-staging-url.railway.app
     NODE_ENV=staging
     ```

4. **Production Deployment**:
   - Project Name: `nthcreation`
   - Root Directory: `apps/web`
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Environment Variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-railway-production-url.railway.app
     NODE_ENV=production
     ```

5. **Copy Deployment URLs**:
   - Staging: `https://nthcreation-staging.vercel.app`
   - Production: `https://nthcreation.vercel.app`

---

## 🌐 Environment URLs

After deployment, you'll have:

### Development (Local)

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Run**: `pnpm dev`

### Staging

- **Frontend**: https://nthcreation-staging.vercel.app
- **API**: https://nthcreation-api-staging.railway.app
- **Auto-deploys**: Push to `staging` branch

### Production

- **Frontend**: https://nthcreation.vercel.app
- **API**: https://nthcreation-api.railway.app
- **Auto-deploys**: Push to `main` branch

---

## 🔧 Update Frontend API URLs

After deploying the API, update these files with your actual URLs:

1. `apps/web/.env.staging`:

   ```
   NEXT_PUBLIC_API_URL=https://YOUR-ACTUAL-STAGING-URL.railway.app
   ```

2. `apps/web/.env.production`:
   ```
   NEXT_PUBLIC_API_URL=https://YOUR-ACTUAL-PRODUCTION-URL.railway.app
   ```

---

## 🔄 Automated Deployments with GitHub Actions

### Update Workflows

Your GitHub Actions are already configured but need deployment steps:

**For Production** (`.github/workflows/deploy.yml`):

- Triggers on push to `main`
- Vercel will auto-deploy on push

**For Staging** (`.github/workflows/staging.yml`):

- Triggers on push to `staging`/`develop`
- Vercel will auto-deploy on push

---

## ✅ Verification Steps

After deployment:

1. **Test API Health**:

   ```bash
   curl https://your-api-url.railway.app/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Test Frontend**:
   - Visit your Vercel URL
   - Upload a sample flow
   - Verify analysis works

3. **Check Logs**:
   - Railway: Dashboard → Deployments → Logs
   - Vercel: Dashboard → Deployments → Function Logs

---

## 💰 Cost Estimate

### Free Tier (Good for Starting)

- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Railway**: $5 credit/month (enough for light usage)
- **Render**: 750 hours/month free

### Paid (When You Scale)

- **Vercel Pro**: $20/month
- **Railway**: Usage-based (~$5-20/month)
- **OpenAI API**: ~$0.01-0.05 per analysis with GPT-4

---

## 🐛 Troubleshooting

### API Returns 500 Error

- Check Railway logs for errors
- Verify `OPENAI_API_KEY` is set correctly
- Check `PORT` environment variable

### Frontend Shows "Connection Refused"

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check Railway API is running
- Ensure CORS is enabled in API (already configured)

### Build Fails

- Check Node.js version (should be 20+)
- Verify all dependencies installed
- Check build logs in Vercel/Railway

---

## 🚦 Quick Commands

```bash
# Deploy everything to production
git push origin main

# Deploy to staging
git checkout -b staging
git push origin staging

# Local development
pnpm dev

# Run staging locally
pnpm dev:staging

# Run production build locally
pnpm dev:production
```

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Ready to deploy?** Start with Railway/Render for the API, then Vercel for the frontend! 🚀
