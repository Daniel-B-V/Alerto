# 🚀 Setup Guide for Judges

This guide will help you quickly set up and run **Alerto** for evaluation.

## ⏱️ Quick Setup (5 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/alerto.git
cd alerto

# Install dependencies and create .env
npm run setup
```

### Step 2: Configure API Keys

Open the `.env` file that was created and add your API keys:

```env
# Minimum required for basic functionality
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Optional but recommended
VITE_WEATHER_API_KEY=your-openweather-key
VITE_GEMINI_API_KEY=your-gemini-key
```

### Step 3: Run the Application

```bash
npm run dev
```

Open your browser at `http://localhost:5173`

---

## 🔑 Getting API Keys (Quick Links)

### Firebase (Required) - 5 minutes

1. **Go to**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Create new project** or select existing
3. **Add web app**: Click </> icon
4. **Copy config** values to `.env`
5. **Enable services**:
   - Authentication → Email/Password + Google
   - Firestore Database → Create database
   - Storage → Set up

**Important**: Copy the `firestore.rules` file contents and paste them in Firebase Console → Firestore → Rules → Publish

### OpenWeather API (Optional) - 2 minutes

1. **Go to**: [https://openweathermap.org/api](https://openweathermap.org/api)
2. **Sign up** for free account
3. **Get API key** from dashboard
4. **Paste** in `.env` file

### Google Gemini AI (Optional) - 2 minutes

1. **Go to**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Create API key**
3. **Paste** in `.env` file

**Note**: The app works without Weather and Gemini APIs but with limited features.

---

## 👤 Creating an Admin Account

After the app is running:

1. **Register** a new account in the app
2. **Go to Firebase Console** → Firestore Database
3. **Find `users` collection** → Your user document
4. **Add field**: `role: "admin"`
5. **Refresh** the app and log in again

You'll now see the admin dashboard!

---

## ✅ Feature Checklist

Test these features to evaluate the app:

### As a User
- [ ] Register new account
- [ ] Login with email/password
- [ ] View user dashboard
- [ ] Submit a report (with photos)
- [ ] Track report status
- [ ] View class suspensions
- [ ] Check weather conditions

### As an Admin
- [ ] Login with admin account
- [ ] View admin dashboard
- [ ] See all community reports
- [ ] View AI analysis (if Gemini API is configured)
- [ ] Manage suspension status
- [ ] View analytics
- [ ] Check weather monitoring

---

## 📊 Test Data

The app includes a database seeder for testing. Open browser console and run:

```javascript
// Seed with test data
import { resetDatabase } from './src/utils/seedDatabase';
resetDatabase('fullDataset');
```

Or access the Test Data page in the admin panel.

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Kill process on port 5173 (Mac/Linux)
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Environment Variables Not Loading

```bash
# Restart the dev server
Ctrl+C
npm run dev
```

### Firebase Connection Issues

- Double-check API keys in `.env`
- Ensure no extra spaces in `.env` values
- Check Firebase project is active
- Verify Firestore rules are published

### Build Fails

```bash
# Clean and reinstall
npm run reinstall
npm run dev
```

---

## 📁 Project Highlights

### Key Technologies
- **React 18** - Modern UI framework
- **Firebase** - Backend as a Service
- **Google Gemini AI** - Intelligent analysis
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling

### Code Quality
- ✅ Modular component structure
- ✅ Clean separation of concerns
- ✅ Reusable utility functions
- ✅ Comprehensive error handling
- ✅ Type-safe Firebase operations

### Features to Highlight
1. **Dual-role system** (Admin + User)
2. **AI-powered** report analysis
3. **Real-time** weather monitoring
4. **Photo upload** functionality
5. **Responsive** design
6. **Secure** authentication

---

## 💡 Demo Accounts

For quick testing, you can use these test accounts:

### Admin Account
- Email: `admin@alerto.local`
- Password: `Admin123!`
- Role: Administrator

### User Account
- Email: `user@alerto.local`
- Password: `User123!`
- Role: Community Member

**Note**: You'll need to create these manually or use your own Firebase authentication.

---

## 📞 Support

Need help? Contact us:
- 📧 Email: support@alerto.ph
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/alerto/issues)
- 📖 Full Documentation: [README.md](README.md)

---

## ⏰ Estimated Setup Time

- **Minimum (basic features)**: 5-10 minutes
- **Full setup (all APIs)**: 15-20 minutes
- **With test data**: +5 minutes

---

**Thank you for evaluating Alerto!** 🎉

We hope you enjoy exploring our disaster management platform. If you have any questions, feel free to reach out!
