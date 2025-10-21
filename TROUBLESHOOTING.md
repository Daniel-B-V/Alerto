# Troubleshooting Guide - Alerto

## No Data Showing in Dashboard

### Issue 1: PAGASA Forecast Not Showing

**Symptoms:**
- Analytics page shows "Loading PAGASA rainfall forecast..." indefinitely
- Error message: "Cannot connect to PAGASA server"
- Browser console shows fetch errors

**Solution:**

#### Step 1: Check if Backend Server is Running
The PAGASA forecast requires a backend proxy server to be running.

Open a **new terminal** and run:
```bash
cd C:\Users\vanjo\Alerto\Alerto\backend
npm run pagasa:dev
```

You should see:
```
╔═══════════════════════════════════════╗
║   PAGASA Forecast Proxy Server       ║
╚═══════════════════════════════════════╝
🌧️  Server running on port 5000
```

#### Step 2: Verify Environment Variable
Check that `.env` file has:
```env
VITE_API_URL=http://localhost:5000
```

#### Step 3: Restart Frontend Server
After adding the environment variable, restart your frontend:
```bash
# Press Ctrl+C to stop
npm run dev
```

#### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for PAGASA-related logs:
   - 🌧️ Fetching PAGASA forecast
   - ✅ PAGASA data received
   - ❌ Any error messages

### Issue 2: OpenWeather Data Not Showing

**Symptoms:**
- Weather panel shows loading indefinitely
- No temperature/humidity data displayed

**Solution:**

#### Step 1: Check API Key
Verify `.env` has the correct API key:
```env
VITE_WEATHER_API_KEY=13616e53cdfb9b00c018abeaa05e9784
```

#### Step 2: Test API in Browser
Open this URL in your browser:
```
https://api.openweathermap.org/data/2.5/weather?q=Batangas,PH&appid=13616e53cdfb9b00c018abeaa05e9784&units=metric
```

You should see JSON weather data.

#### Step 3: Test via Console
In browser console, run:
```javascript
window.testWeatherAPI.runAllTests()
```

### Issue 3: Login Page Not Working

**Symptoms:**
- Cannot create account
- "Firebase not initialized" error
- Login button does nothing

**Solution:**

#### Step 1: Enable Firebase Authentication
1. Go to https://console.firebase.google.com/
2. Select project: `alerto-966c7`
3. Click **Authentication**
4. Click **Get started**
5. Click **Sign-in method** tab
6. Enable **Email/Password**
7. Click **Save**

#### Step 2: Check Firebase Credentials
Verify all Firebase variables in `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSyDdJ33RmL_1vnM3AnRXhrkhdGCULiNDPnc
VITE_FIREBASE_AUTH_DOMAIN=alerto-966c7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alerto-966c7
VITE_FIREBASE_STORAGE_BUCKET=alerto-966c7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=380143166451
VITE_FIREBASE_APP_ID=1:380143166451:web:ba9e9126cff0c0f9396886
```

#### Step 3: Check Browser Console
Look for Firebase errors:
- "Firebase App not initialized"
- "auth/operation-not-allowed"

## Common Errors & Solutions

### Error: "Failed to fetch"

**Cause:** Backend server not running

**Solution:**
```bash
cd backend
npm install  # If first time
npm run pagasa:dev
```

### Error: "CORS policy blocked"

**Cause:** CORS configuration issue

**Solution:** Already configured in `server-pagasa.js`. Make sure you're using the proxy server, not calling PAGASA directly.

### Error: "Cannot GET /api/batangas-forecast"

**Cause:** Wrong URL or backend not running

**Solution:**
1. Check backend is running on port 5000
2. Verify URL in browser: `http://localhost:5000/api/health`
3. Should return: `{"status":"ok",...}`

### Error: "Module not found"

**Cause:** Dependencies not installed

**Solution:**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Error: Port 5000 already in use

**Cause:** Another process using port 5000

**Solution:**
```bash
# Windows - Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in server-pagasa.js:
const PORT = process.env.PORT || 5001;  # Change to 5001

# Then update .env:
VITE_API_URL=http://localhost:5001
```

## Debugging Steps

### 1. Check All Services Are Running

**Frontend:**
```bash
# Terminal 1
cd C:\Users\vanjo\Alerto\Alerto
npm run dev
```
Should open at: http://localhost:3000

**Backend:**
```bash
# Terminal 2
cd C:\Users\vanjo\Alerto\Alerto\backend
npm run pagasa:dev
```
Should show: Server running on port 5000

### 2. Test Each Component

**Test Backend Health:**
```bash
curl http://localhost:5000/api/health
```

**Test PAGASA API:**
```bash
curl http://localhost:5000/api/test-pagasa
```

**Test Specific Forecast:**
```bash
curl "http://localhost:5000/api/batangas-forecast?lat=13.7565&lon=121.0583&city=Batangas"
```

**Test Frontend Weather API:**
Open browser console:
```javascript
window.testWeatherAPI.runAllTests()
```

### 3. Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for:
   - `batangas-forecast` requests (red = failed)
   - `weather` requests (OpenWeather)
5. Click failed requests to see error details

### 4. Check Console Logs

Look for these logs:

**Good logs (working):**
```
🌧️ Fetching PAGASA forecast: ...
📡 PAGASA Response status: 200
✅ PAGASA data received: ...
📊 Parsed forecast: ...
```

**Error logs:**
```
❌ PAGASA API Error: ...
❌ Failed to fetch PAGASA data: ...
```

## Full Reset Procedure

If nothing works, try this:

### 1. Stop All Servers
```bash
# Press Ctrl+C in both terminals
```

### 2. Clean Install
```bash
# Frontend
cd C:\Users\vanjo\Alerto\Alerto
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### 3. Verify .env File
Make sure ALL these variables are set:
```env
VITE_FIREBASE_API_KEY=AIzaSyDdJ33RmL_1vnM3AnRXhrkhdGCULiNDPnc
VITE_FIREBASE_AUTH_DOMAIN=alerto-966c7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alerto-966c7
VITE_FIREBASE_STORAGE_BUCKET=alerto-966c7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=380143166451
VITE_FIREBASE_APP_ID=1:380143166451:web:ba9e9126cff0c0f9396886
VITE_WEATHER_API_KEY=13616e53cdfb9b00c018abeaa05e9784
VITE_API_URL=http://localhost:5000
```

### 4. Start Fresh
```bash
# Terminal 1 - Backend
cd backend
npm run pagasa:dev

# Terminal 2 - Frontend
npm run dev
```

### 5. Enable Firebase Auth
- Go to Firebase Console
- Enable Email/Password authentication

### 6. Test
- Open http://localhost:3000
- Check console for errors
- Check network tab for failed requests

## Quick Checklist

Before reporting issues, verify:

- [ ] `.env` file exists with all variables
- [ ] Backend server is running (`npm run pagasa:dev`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] Firebase Authentication is enabled
- [ ] Port 5000 is not blocked/in use
- [ ] No firewall blocking localhost:5000
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows successful API calls
- [ ] OpenWeather API key is valid

## Still Not Working?

### Check These Files

1. **`.env`** - All environment variables set
2. **`backend/server-pagasa.js`** - Server code exists
3. **`src/services/pagasaService.js`** - Service exists
4. **`src/components/PAGASAForecastCard.jsx`** - Component exists

### Console Commands to Try

```javascript
// Check if API URL is set
console.log(import.meta.env.VITE_API_URL)
// Should show: http://localhost:5000

// Check weather API key
console.log(import.meta.env.VITE_WEATHER_API_KEY)
// Should show your API key

// Test fetch manually
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
// Should show: {status: "ok", ...}
```

## Need More Help?

1. Check browser console for specific error messages
2. Check backend terminal for error logs
3. Take screenshot of error message
4. Note which section isn't working:
   - Login/Signup
   - Weather data
   - PAGASA forecast
   - All of the above

---

**Most Common Issue:** Backend server not running!

**Quick Fix:**
```bash
cd backend
npm run pagasa:dev
```

Then refresh the browser!
