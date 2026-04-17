# Sub Debt Tracker — Deploy to Vercel

## One-time setup (~5 min)

### 1. Push to GitHub
Create a new repo on GitHub, then:
```
git init
git add .
git commit -m "init sub tracker"
git remote add origin https://github.com/YOUR_USERNAME/sub-tracker.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to vercel.com → New Project → import your GitHub repo
2. Click **Deploy** (defaults are fine for Next.js)

### 3. Add Vercel Postgres
1. In your Vercel project → **Storage** tab → **Create Database** → choose **Postgres**
2. Click **Connect** — Vercel will auto-add the env vars (`POSTGRES_URL`, etc.)

### 4. Add Vercel Blob
1. Still in **Storage** tab → **Create Database** → choose **Blob**
2. Click **Connect** — Vercel adds `BLOB_READ_WRITE_TOKEN` automatically

### 5. Redeploy
Go to **Deployments** → click the three dots on your latest deployment → **Redeploy**

That's it. Share the URL with your friends and start tracking. 🥖

## Local dev (optional)
```
npm install
vercel link        # links to your Vercel project
vercel env pull    # pulls env vars to .env.local
npm run dev        # http://localhost:3000
```
