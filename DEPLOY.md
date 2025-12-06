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
5. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/erp-stock-sales.git`)

### 2. Push to GitHub

Run these commands (replace YOUR_USERNAME and REPO_NAME):

```bash
cd "/Users/abdulrahmanbathhish/Documents/erp abdulrahman for sh all v 0.2.4"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

### 3. Deploy on Render.com

1. Go to https://render.com and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub account (if not already connected)
4. Select your repository: `erp-stock-sales`
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
- **Database**: SQLite data resets on restart/deploy. For persistent data, use Render PostgreSQL (free tier available)
- **Auto-deploy**: Every git push to main branch automatically redeploys

## Troubleshooting

- If deployment fails, check the logs in Render dashboard
- Make sure all environment variables are set correctly
- First deployment takes longer (5-10 minutes)

