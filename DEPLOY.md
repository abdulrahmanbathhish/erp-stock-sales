# Deployment Guide - Render.com

## ✅ Completed Steps
- Created `.gitignore`
- Created `render.yaml`
- Updated `server.js` for cloud deployment
- Updated `package.json` with Node.js version
- Initialized git repository
- Created initial commit

## Next Steps

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `erp-stock-sales` (or your choice)
3. **Don't** initialize with README, .gitignore, or license
4. Click "Create repository"
5. Copy the **full** repository URL (e.g., `https://github.com/abdulrahmanbathhish/erp-stock-sales.git`)

**Important:** The URL must include the repository name at the end!

### 2. Push to GitHub

**Option A: Use the helper script (Mac/Linux):**

```bash
./push-to-github.sh https://github.com/abdulrahmanbathhish/YOUR_REPO_NAME.git
```

Replace `YOUR_REPO_NAME` with your actual repository name (e.g., `erp-stock-sales`)

**Option B: Manual commands:**

```bash
git remote add origin https://github.com/abdulrahmanbathhish/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. Deploy on Render.com

1. Go to https://render.com and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub account (if not already connected)
4. Select your repository (the one you just created)
5. Configure:
   - **Name**: `erp-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Add Environment Variables:
   - `PORT` = `3000`
   - `NODE_ENV` = `production`
7. Click "Create Web Service"
8. Wait 5-10 minutes for first deployment

### 4. Access Your App

Your app will be available at:
```
https://erp-app.onrender.com
```
(or the name you chose)

## Important Notes

- **Free tier**: Spins down after 15min inactivity (wakes in ~30s)
- **Database**: ⚠️ **CRITICAL** - SQLite data resets on every deploy/restart! 
  - **You MUST set up PostgreSQL for data persistence** (see POSTGRES_SETUP.md)
  - Without PostgreSQL, all your sales/products data will be lost on each deployment
- **Auto-deploy**: Every git push to main branch automatically redeploys

## ⚠️ Data Persistence Setup Required

**Before using the app in production, you MUST set up PostgreSQL:**

1. See `POSTGRES_SETUP.md` for detailed instructions
2. Create a PostgreSQL database on Render (free tier available)
3. Add `DATABASE_URL` environment variable to your web service
4. Your data will then persist across deployments

## Troubleshooting

- If deployment fails, check the logs in Render dashboard
- Make sure all environment variables are set correctly
- First deployment takes longer (5-10 minutes)
- **GitHub URL must include the repository name!** Example: `https://github.com/abdulrahmanbathhish/erp-stock-sales.git`
