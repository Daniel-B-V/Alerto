# Alerto - Quick Start Guide 🚀

## Prerequisites Checklist

- ✅ Firebase Authentication enabled (Email/Password + Google)
- ✅ Firestore Database created
- ✅ Firebase credentials in `.env`
- ✅ OpenWeather API key in `.env`

## Environment Setup

Your `.env` file should contain:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDdJ33RmL_1vnM3AnRXhrkhdGCULiNDPnc
VITE_FIREBASE_AUTH_DOMAIN=alerto-966c7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alerto-966c7
VITE_FIREBASE_STORAGE_BUCKET=alerto-966c7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=380143166451
VITE_FIREBASE_APP_ID=1:380143166451:web:ba9e9126cff0c0f9396886

# Weather API
VITE_WEATHER_API_KEY=13616e53cdfb9b00c018abeaa05e9784
```

## Firebase Setup (One-Time)

### 1. Enable Authentication
1. Go to https://console.firebase.google.com/
2. Select project: `alerto-966c7`
3. Click **Authentication** → **Get started**
4. Enable **Email/Password** sign-in method
5. (Optional) Enable **Google** sign-in method

### 2. Create Firestore Database
1. Click **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select location: `asia-southeast1` (Singapore - closest to Philippines)
4. Click **Enable**

### 3. Set Up Firebase Storage
1. Click **Storage** → **Get started**
2. Start in **test mode**
3. Use default bucket: `alerto-966c7.firebasestorage.app`

## Running the Application

### Install Dependencies

**Frontend:**
```bash
cd C:\Users\vanjo\Alerto\Alerto
npm install
```

**Backend (for PAGASA forecast):**
```bash
cd backend
npm install
```

### Start Development Servers

**Option 1: Run Both Servers**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - PAGASA Proxy Server:
```bash
cd backend
npm run pagasa:dev
```

**Option 2: Frontend Only (without PAGASA forecasts)**
```bash
npm run dev
```

The frontend will open at: `http://localhost:3000`
The backend API runs at: `http://localhost:5000`

## First Login

1. Click **"Don't have an account? Sign up"**
2. Enter your details:
   - Full Name
   - Email
   - Password (min 6 characters)
3. Click **Create Account**
4. You'll be automatically logged in!

## Testing the Application

### Test Firebase Authentication
1. Create an account using the signup form
2. Log out (user menu in header)
3. Log back in with your credentials
4. Try "Sign in with Google" (if enabled)

### Test Weather API
Open browser console and run:
```javascript
await window.testWeatherAPI.runAllTests()
```

You should see:
```
✅ API Connection Successful!
📍 Location: Batangas PH
🌡️ Temperature: 28 °C
💧 Humidity: 75 %
```

## Dashboard Sections

After logging in, you can access:

1. **Dashboard** - Overview and statistics
2. **Community Feed** - User-submitted disaster reports
3. **Weather** - Real-time weather monitoring
4. **Analytics** - Data visualization
5. **Admin Panel** - User and report management (admin only)

## Project Structure

```
Alerto/
├── src/
│   ├── components/          # React components
│   │   ├── Login.jsx       # Authentication UI (NEW DESIGN!)
│   │   ├── WeatherPanel.jsx # Weather dashboard
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── SocketContext.jsx # Notifications
│   ├── firebase/            # Firebase services
│   │   ├── config.js       # Firebase initialization
│   │   ├── auth.js         # Authentication methods
│   │   ├── firestore.js    # Database operations
│   │   └── storage.js      # File uploads
│   ├── services/            # API services
│   │   ├── weatherService.js # OpenWeather integration
│   │   └── api.js          # General API calls
│   └── utils/               # Utilities
│       └── testWeatherAPI.js # Weather API testing
├── .env                     # Environment variables (CONFIGURED!)
├── package.json
└── README.md
```

## Key Features Implemented

### ✅ Authentication System
- Email/Password signup and login
- Google Sign-in
- Auto-logout after 30 minutes of inactivity
- Persistent sessions (stay logged in)
- Profile management
- Password reset functionality

### ✅ Weather Monitoring
- Real-time data for 8 Batangas cities
- Hourly forecast charts
- Weather alerts with risk levels
- Auto-refresh every 5 minutes
- Temperature, humidity, wind, rainfall data
- Beautiful weather icons

### ✅ Modern UI
- Animated gradient backgrounds
- Glass-morphism design
- Smooth transitions and hover effects
- Responsive layout
- Loading states
- Error handling

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new package
npm install <package-name>
```

## Troubleshooting

### "Firebase not initialized" error
- Make sure `.env` file exists
- Restart dev server after editing `.env`
- Check Firebase console for project settings

### "Weather data not loading"
- Open browser console
- Run: `window.testWeatherAPI.testCurrentWeather()`
- Check internet connection
- Verify API key is correct

### "Cannot sign up/login"
- Check Firebase Authentication is enabled
- Check browser console for errors
- Verify email format is correct
- Password must be 6+ characters

### Development server not starting
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (API keys) |
| `src/components/Login.jsx` | Login/Signup page |
| `src/contexts/AuthContext.jsx` | Authentication logic |
| `src/services/weatherService.js` | Weather API integration |
| `src/firebase/config.js` | Firebase configuration |
| `WEATHER_API_SETUP.md` | Weather API documentation |

## Security Notes

⚠️ **IMPORTANT**: Never commit `.env` file to Git!
- `.env` contains sensitive API keys
- It's already in `.gitignore`
- Use `.env.example` as a template for others

## Next Steps

1. ✅ Start the development server
2. ✅ Create your first account
3. ✅ Test weather data loading
4. 🔄 Enable Firebase Authentication methods
5. 🔄 Set up Firestore security rules
6. 🔄 Customize the dashboard
7. 🔄 Add real disaster reports

## Getting Help

- **Weather API Docs**: See `WEATHER_API_SETUP.md`
- **Project Overview**: See `CLAUDE.md`
- **Firebase Console**: https://console.firebase.google.com/
- **OpenWeather Docs**: https://openweathermap.org/api

---

**Status**: 🟢 Ready to Use
**Last Updated**: 2025-10-20

Happy coding! 🎉
