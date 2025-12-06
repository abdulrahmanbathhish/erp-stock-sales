# PostgreSQL Setup for Data Persistence

## ⚠️ Important: Data Persistence

**Current Issue:** SQLite data is stored in files that get deleted on every Render deployment/restart.

**Solution:** Use Render's free PostgreSQL database for persistent storage.

## Step-by-Step Setup

### 1. Create PostgreSQL Database on Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `erp-database` (or your choice)
   - **Database:** `erp_db` (or your choice)
   - **User:** (auto-generated)
   - **Region:** Choose closest to your web service
   - **PostgreSQL Version:** 15 (or latest)
   - **Plan:** **Free** (90 days free trial, then $7/month)
4. Click **"Create Database"**
5. Wait 2-3 minutes for database to be created

### 2. Get Database Connection String

1. In your PostgreSQL service, click on it
2. Find **"Internal Database URL"** or **"Connection String"**
3. It looks like: `postgresql://user:password@host:5432/database`
4. **Copy this URL** - you'll need it in the next step

### 3. Add Database URL to Web Service

1. Go to your **Web Service** (erp-app)
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the PostgreSQL connection string you copied
5. Click **"Save Changes"**

### 4. Update Code (Already Done)

The code has been updated to automatically use PostgreSQL when `DATABASE_URL` is set.

### 5. Redeploy

1. Render will automatically redeploy when you save the environment variable
2. Or manually trigger: Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait 5-10 minutes for deployment

### 6. Verify

1. Check deployment logs - you should see: `📊 Using PostgreSQL database (production)`
2. Your data will now persist across deployments!

## Alternative: Keep SQLite (Data Will Reset)

If you want to keep using SQLite (free, but data resets):
- Don't set `DATABASE_URL`
- Data will reset on each deployment/restart
- Good for testing only

## Migration from SQLite to PostgreSQL

If you have existing SQLite data you want to migrate:

1. Export your SQLite data (use the export feature in your app)
2. Set up PostgreSQL as above
3. Re-import your data through the app's import feature

## Cost

- **PostgreSQL Free Tier:** 90 days free, then $7/month
- **SQLite:** Free but data resets (not recommended for production)

## Need Help?

- Render PostgreSQL Docs: https://render.com/docs/databases
- Check deployment logs if you see errors

