# Deployment Guide - Pizza Shop Dashboard

## 🚀 Quick Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Pizza Shop Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pizza-shop.git
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `pizza-shop` repository
4. Railway will auto-detect Next.js and deploy

### 3. Add Environment Variables in Railway

Go to your project → **Variables** tab and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://wiatjmcnljwatbbxvcsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SHOP_NAME=Tony's Pizza Palace
NEXT_PUBLIC_SHOP_ID=shop_001
```

### 4. Get Your Production URL

After deployment completes:
- Railway will provide a URL like: `https://pizza-shop-production.up.railway.app`
- Click **"Generate Domain"** if needed

### 5. Update Retell AI Webhook

Update your Retell AI custom function URL to:
```
https://your-railway-domain.up.railway.app/api/orders
```

## ✅ Deployment Checklist

- [x] `.env.local` is in `.gitignore` (secrets protected)
- [x] `.env.example` created for reference
- [x] All dependencies in `package.json`
- [x] Supabase tables created (orders, shop_settings)
- [x] API routes ready for production
- [x] Real-time subscriptions configured

## 🔒 Security Notes

- ✅ Service role key is server-side only (never exposed to client)
- ✅ Environment variables are protected
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Authentication required for dashboard access

## 📝 Post-Deployment

1. Test the login at your Railway URL
2. Update shop settings in the dashboard
3. Test Retell AI integration with production URL
4. Monitor orders in real-time

## 🆘 Troubleshooting

**Build fails on Railway:**
- Check that all environment variables are set
- Verify Supabase credentials are correct

**Can't log in:**
- Ensure user exists in Supabase Authentication
- Check Supabase URL and anon key are correct

**Orders not appearing:**
- Verify Retell AI is using HTTPS production URL
- Check Railway logs for errors
- Ensure `orders` table exists in Supabase

---

**Your app is production-ready!** 🍕
