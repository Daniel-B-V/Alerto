# Deployment Guide

This guide covers deploying **Alerto** to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Firebase Hosting](#firebase-hosting)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Environment Variables](#environment-variables)
- [Production Checklist](#production-checklist)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Completed local development and testing
- ✅ All environment variables configured
- ✅ Firebase project set up
- ✅ Production API keys ready
- ✅ Git repository with latest code

---

## Firebase Hosting

Firebase Hosting is recommended as it integrates seamlessly with Firebase services.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase Hosting

```bash
firebase init hosting
```

Select the following options:
- **What do you want to use as your public directory?** `dist`
- **Configure as a single-page app?** `Yes`
- **Set up automatic builds?** `No`

### Step 4: Build the Project

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 5: Deploy

```bash
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR-PROJECT-ID.web.app`

### Step 6: Configure Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps
4. Wait for SSL certificate provisioning (up to 24 hours)

---

## Vercel Deployment

Vercel offers zero-config deployment with automatic HTTPS.

### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables in Vercel dashboard
7. Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Follow the prompts to configure your project.

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable from your `.env` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_WEATHER_API_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_API_URL` (if using backend server)

3. Redeploy the project

---

## Netlify Deployment

### Method 1: Drag and Drop

1. Build your project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist/` folder onto the deployment zone

### Method 2: Git Integration

1. Push code to GitHub/GitLab/Bitbucket
2. Go to Netlify dashboard
3. Click "New site from Git"
4. Select your repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables
7. Click "Deploy site"

### Netlify Configuration File

Create `netlify.toml` in root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## Environment Variables

### Production Environment Variables

Create a `.env.production` file:

```env
# Firebase Production Configuration
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-prod-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-prod-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-prod-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-prod-sender-id
VITE_FIREBASE_APP_ID=your-prod-app-id

# Production APIs
VITE_WEATHER_API_KEY=your-production-weather-key
VITE_GEMINI_API_KEY=your-production-gemini-key
VITE_API_URL=https://your-backend-api.com
```

### Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use different API keys for production
- ✅ Restrict API key domains in Firebase Console
- ✅ Enable Firebase App Check for additional security
- ✅ Set up proper CORS policies

---

## Production Checklist

Before going live, verify:

### Firebase Configuration

- [ ] Authentication providers enabled
- [ ] Firestore security rules published
- [ ] Storage security rules configured
- [ ] Indexes created for queries
- [ ] Billing account set up (if needed)

### Performance

- [ ] Build size optimized (`npm run build`)
- [ ] Images optimized and compressed
- [ ] Lazy loading implemented
- [ ] API calls debounced/throttled
- [ ] Caching strategies in place

### Security

- [ ] Environment variables secured
- [ ] API keys restricted by domain
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation implemented

### Monitoring

- [ ] Firebase Analytics enabled
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Performance monitoring configured
- [ ] Uptime monitoring enabled

### SEO & Meta

- [ ] Meta tags configured
- [ ] Open Graph tags added
- [ ] Favicon set
- [ ] robots.txt configured
- [ ] sitemap.xml generated

---

## Post-Deployment

### Verify Deployment

1. **Test all features**:
   - User registration/login
   - Report submission
   - Weather data loading
   - Admin panel access
   - Image uploads

2. **Check Console**:
   - No errors in browser console
   - No network failures
   - API responses correct

3. **Test Different Browsers**:
   - Chrome
   - Firefox
   - Safari
   - Edge

4. **Test on Mobile Devices**:
   - iOS Safari
   - Android Chrome
   - Responsive design

### Monitor Performance

```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://your-app-url.com --view
```

### Set Up Continuous Deployment

#### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          # Add other env variables

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

### Environment Variables Not Loading

- Ensure variables start with `VITE_`
- Restart dev server after adding variables
- Check deployment platform's environment variable settings

### Firebase Connection Issues

- Verify API keys are correct
- Check Firebase project is active
- Ensure billing is enabled (for some features)
- Check firestore rules

### 404 Errors on Refresh

Add rewrite rules for Single Page Application:

**Firebase** (`firebase.json`):
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}
```

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Support

Need help with deployment?

- 📧 Email: deploy@alerto.ph
- 💬 Discord: [Join our server](https://discord.gg/alerto)
- 📖 Docs: [Full Documentation](https://docs.alerto.ph)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/alerto/issues)

---

**Happy Deploying!** 🚀
