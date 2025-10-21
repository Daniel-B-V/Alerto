# Alerto - Community Disaster Reporting & Weather Monitoring Dashboard

A real-time disaster reporting and weather monitoring system for Batangas Province, Philippines. Built with React, Firebase, and integrated with OpenWeather and PAGASA APIs.

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![React](https://img.shields.io/badge/react-18.0-blue)
![Firebase](https://img.shields.io/badge/firebase-integrated-orange)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Firebase account (for authentication)
- OpenWeather API key (provided)
- PAGASA API access (via proxy server)

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
cd ..
```

### Running the Application

**Terminal 1 - Frontend:**
```bash
npm run dev
```


Access the app at: **http://localhost:3000**

## ✨ Features

### 🔐 Authentication System
- Modern login/signup UI with animated gradient background
- Email/Password and Google Sign-in
- Auto-logout after 30 minutes of inactivity
- Persistent sessions across browser restarts

### 🌤️ Weather Monitoring (OpenWeather API)
- Real-time weather data for 8 Batangas cities
- 5-day forecast with 3-hour intervals
- Hourly forecast charts
- Temperature, humidity, wind speed, rainfall tracking
- Auto-refresh every 5 minutes

### 🎓 Class Suspension Prediction System
- **AI-powered prediction** based on real-time weather data
- **0-100% likelihood score** with color-coded risk levels
- **Multi-factor analysis**: rainfall, wind speed, temperature, weather conditions
- **City-by-city breakdown** for 8 Batangas cities
- **Actionable recommendations** for each risk level
- **Visual risk indicators** (Red/Orange/Yellow/Blue/Green)
- **Auto-refresh** every 10 minutes

### 🤖 NEW: AI-Powered Analytics System
- **Gemini AI Integration** for intelligent report analysis
- **Community Reports Analyzer**: Classifies reports as Critical, Medium, or Low priority
- **Suspension Advisory System**: Combines weather data + community reports
- **Smart Risk Scoring**: Weather Score + Reports Score = Combined Assessment
- **Automated Threat Detection**: Identifies flooding, landslides, strong winds, etc.
- **Location-Based Insights**: Reports breakdown by city/municipality
- **Priority Action Recommendations**: Step-by-step guidance for LGUs
- **Fallback System**: Works even without Gemini API key
- **Real-time Analysis**: Auto-updates every 10 minutes

### 📊 Analytics Dashboard
- Real-time class suspension predictions
- Weather-based risk assessment
- City-by-city weather conditions
- Province-wide statistics
- Performance metrics

### 📱 Community Features
- User-submitted disaster reports
- Real-time notifications
- Community feed
- Report verification system

## 📁 Project Structure

```
Alerto/
├── src/
│   ├── components/         # React components
│   │   ├── Login.jsx      # Authentication UI
│   │   ├── WeatherPanel.jsx
│   │   ├── AnalyticsPanel.jsx
│   │   └── PAGASAForecastCard.jsx
│   ├── services/          # API services
│   │   ├── weatherService.js    # OpenWeather integration
│   │   └── pagasaService.js     # PAGASA integration
│   ├── firebase/          # Firebase services
│   │   ├── config.js
│   │   ├── auth.js
│   │   └── firestore.js
│   └── contexts/          # React contexts
│       └── AuthContext.jsx
├── backend/
│   └── server-pagasa.js   # PAGASA proxy server
├── .env                   # Environment variables
└── Documentation/
    ├── QUICK_START.md
    ├── WEATHER_API_SETUP.md
    ├── PAGASA_INTEGRATION.md
    └── SETUP_COMPLETE.md
```

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Weather API
VITE_WEATHER_API_KEY=your-openweather-api-key

# Gemini AI API (for AI-powered analytics)
# Get your API key from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Backend API
VITE_API_URL=http://localhost:5000
```

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started quickly
- **[Weather API Setup](WEATHER_API_SETUP.md)** - OpenWeather integration details
- **[Class Suspension Predictor](CLASS_SUSPENSION_PREDICTOR.md)** - Prediction system guide
- **[AI Analytics Guide](AI_ANALYTICS_GUIDE.md)** - **NEW!** AI-powered analytics & advisory system
- **[Setup Complete](SETUP_COMPLETE.md)** - Full configuration checklist
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## 🧪 Testing

### Test Weather API
```javascript
// Open browser console
window.testWeatherAPI.runAllTests()
```

### Test PAGASA Proxy
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/test-pagasa
```

## 🌍 Monitored Cities

- Batangas City
- Lipa City
- Tanauan City
- Santo Tomas
- Taal
- Balayan
- Nasugbu
- Lemery

## 🔧 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **APIs**: OpenWeather, PAGASA GeoRisk Portal
- **Charts**: Recharts
- **UI Components**: Radix UI

## 📝 Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
npm run pagasa       # Start PAGASA proxy server
npm run pagasa:dev   # Start with auto-reload
```

## 🤝 Contributing

This is a community disaster reporting system. Contributions are welcome!

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Original Design**: [Figma](https://www.figma.com/design/3KO0055ALVieOyvx62k12H/Alerto-Dashboard-UI-Design--Copy-)
- **Firebase Console**: https://console.firebase.google.com/
- **OpenWeather API**: https://openweathermap.org/api
- **PAGASA**: https://www.pagasa.dost.gov.ph/

## 🚨 Important Notes

- Never commit `.env` file to version control
- Enable Firebase Authentication before first use
- PAGASA proxy server is required for rainfall forecasts
- See `SETUP_COMPLETE.md` for full configuration details

---

**Built with ❤️ for Batangas Province**
