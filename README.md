# 🚨 Alerto - Community Disaster Reporting & Weather Monitoring System

<div align="center">

![Alerto Logo](https://img.shields.io/badge/🌤️-Alerto-blue?style=for-the-badge)

**Real-time disaster reporting and weather monitoring system for Batangas Province, Philippines**

[![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)](https://github.com/yourusername/alerto)
[![React](https://img.shields.io/badge/react-18.3.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-12.4.0-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Live Demo](#) • [Documentation](#-documentation) • [Features](#-features) • [Quick Start](#-quick-start)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Configuration](#-api-configuration)
- [Usage](#-usage)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Overview

**Alerto** is an intelligent disaster management platform designed to help communities in Batangas Province, Philippines respond quickly and effectively to weather-related emergencies. By combining real-time weather data, AI-powered analysis, and community-driven reporting, Alerto empowers both citizens and local government units (LGUs) to make informed decisions during critical situations.

### 🌟 Why Alerto?

The Philippines faces an average of **20 typhoons annually**, with Batangas Province being particularly vulnerable to flooding, landslides, and storm surges. Traditional disaster reporting systems are often:
- ❌ Slow to respond
- ❌ Lack real-time verification
- ❌ Don't integrate weather data
- ❌ Have no AI-powered risk assessment

**Alerto solves these problems** by providing a unified platform that combines:
- ✅ Real-time weather monitoring
- ✅ Community-driven disaster reporting
- ✅ AI-powered risk analysis using Google Gemini
- ✅ Automated class suspension recommendations
- ✅ Multi-role access (Admin & Community Users)

---

## 🔴 Problem Statement

During disasters and severe weather events:

1. **Information Fragmentation**: Weather data and community reports exist in silos
2. **Delayed Response**: Manual verification of reports takes too long
3. **Lack of AI Analysis**: No intelligent risk assessment combining multiple data sources
4. **Poor Community Engagement**: Citizens can't easily report localized incidents
5. **Manual Decision Making**: LGUs lack data-driven tools for class suspension decisions

---

## ✅ Solution

Alerto provides a comprehensive, AI-powered disaster management dashboard that:

### For Community Members:
- 📱 Submit real-time disaster reports with photos
- 🌤️ View weather conditions for their city
- 📊 Track their report status (Pending → Under Review → Resolved)
- 🔔 Receive class suspension notifications

### For Administrators (LGUs):
- 🗺️ Monitor all community reports in real-time
- 🤖 AI-powered report credibility analysis
- 📈 Weather-based risk assessment across 15+ cities
- 🎓 Automated class suspension recommendations
- 📊 Analytics dashboard with insights
- ✅ Report verification and status management

---

## ✨ Features

### 🔐 **Dual-Role Authentication System**
- Firebase Authentication (Email/Password + Google Sign-in)
- Role-based access control (Admin vs User)
- Auto-logout after 2 hours of inactivity
- Secure session management

### 🌤️ **Real-Time Weather Monitoring**
- Integration with **OpenWeather API**
- Live data for 15 Batangas cities
- 24-hour rainfall forecast visualization
- Temperature, humidity, wind speed, and rainfall tracking
- Auto-refresh every 5 minutes

### 🤖 **AI-Powered Risk Analysis** (Google Gemini Integration)
- **Intelligent Report Classification**: Automatically categorizes reports as Critical, High, Medium, or Low priority
- **Credibility Scoring**: AI analyzes report authenticity using multiple factors
- **Weather + Reports Fusion**: Combines weather data with community reports for comprehensive risk assessment
- **Suspension Advisory**: Provides data-driven recommendations for class suspensions
- **Natural Language Insights**: Generates actionable summaries in plain language

### 📱 **Community Reporting System**
- Users can submit incident reports with:
  - Category (Flooding, Power Outage, Road Accident, Fire, Landslide, etc.)
  - Description and location
  - Severity level
  - Photo uploads (up to 4 images)
- Real-time status tracking
- Search and filter capabilities

### 🎓 **Class Suspension Management**
- View suspension status for all Batangas cities
- Real-time weather-based risk indicators
- Filter by Suspended/Active status
- City-wise weather data cards

### 📊 **Analytics Dashboard**
- Total cities monitored
- Active class suspensions
- Community reports statistics
- Weather trends visualization

### 🔔 **Notification System**
- Real-time updates via Socket.IO
- Push notifications for critical alerts
- In-app notification center

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context API

### **Backend & Services**
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Real-time Communication**: Socket.IO (planned)

### **APIs & AI**
- **Weather Data**: OpenWeather API
- **AI Analysis**: Google Gemini AI (Generative AI)
- **Weather Forecasts**: PAGASA GeoRisk Portal

### **Deployment**
- **Frontend**: Firebase Hosting / Vercel
- **Database**: Firebase Cloud Firestore
- **Storage**: Firebase Cloud Storage

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/alerto.git
cd alerto
```

### Step 2: Install Dependencies

```bash
npm run setup
```

This command will:
1. Install all npm dependencies
2. Create a `.env` file from `.env.example`

### Step 3: Configure Environment Variables

Open the `.env` file and fill in your API keys:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Weather API
VITE_WEATHER_API_KEY=your-openweather-api-key

# AI Services
VITE_GEMINI_API_KEY=your-gemini-api-key
```

#### 🔑 Getting API Keys

<details>
<summary><b>Firebase Setup (Required)</b></summary>

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to **Project Settings** → **General**
4. Scroll to "Your apps" → Click **Web** icon (`</>`)
5. Copy the config values to your `.env` file
6. Enable **Authentication** → **Sign-in method** → Enable Email/Password and Google
7. Enable **Firestore Database** → Create database in production mode
8. Enable **Storage** → Set up Firebase Storage

</details>

<details>
<summary><b>OpenWeather API (Required)</b></summary>

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Create a free account
3. Navigate to **API Keys** section
4. Generate a new API key
5. Paste it in your `.env` file

</details>

<details>
<summary><b>Google Gemini AI (Recommended)</b></summary>

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Paste it in your `.env` file

**Note**: The app will work without Gemini API but will have limited AI analysis features.

</details>

### Step 4: Set Up Firebase Security Rules

1. Go to Firebase Console → **Firestore Database** → **Rules**
2. Paste the contents from `firestore.rules`
3. Publish the rules

### Step 5: Run the Application

```bash
npm run dev
```

The application will open at `http://localhost:5173` (or next available port).

### Step 6: Create Admin Account

1. Open the app and register a new account
2. Go to Firebase Console → **Firestore Database**
3. Find the `users` collection → Find your user document
4. Add a field: `role: "admin"`
5. Refresh the app and log in again

---

## 📁 Project Structure

```
Alerto/
├── public/                      # Static assets
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components (buttons, cards, etc.)
│   │   ├── AdminPanel.jsx       # Admin dashboard main component
│   │   ├── UserLayout.jsx       # User dashboard layout
│   │   ├── CommunityFeed.jsx    # Community reports feed (Admin view)
│   │   ├── UserReportsPage.jsx  # User report submission & tracking
│   │   ├── Header.jsx           # App header with notifications
│   │   ├── UserSidebar.jsx      # User navigation sidebar
│   │   ├── UserDashboard.jsx    # User dashboard overview
│   │   ├── UserSuspensionView.jsx  # Class suspension view for users
│   │   ├── SuspensionPanel.jsx  # Admin suspension management
│   │   └── AIReportsAnalyzer.jsx   # AI-powered report analysis
│   │
│   ├── contexts/                # React Context API
│   │   ├── AuthContext.jsx      # Authentication state management
│   │   └── SocketContext.jsx    # Real-time notifications
│   │
│   ├── firebase/                # Firebase configuration
│   │   ├── config.js            # Firebase initialization
│   │   ├── auth.js              # Authentication methods
│   │   ├── firestore.js         # Firestore operations
│   │   └── storage.js           # Firebase Storage operations
│   │
│   ├── services/                # External API services
│   │   └── weatherService.js    # OpenWeather API integration
│   │
│   ├── utils/                   # Utility functions
│   │   ├── seedDatabase.js      # Database seeding utilities
│   │   └── dummyData.js         # Test data generation
│   │
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
│
├── backend/                     # Backend services (optional)
│   └── server-pagasa.js         # PAGASA API proxy server
│
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore indexes
├── package.json                 # Node.js dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # Project documentation
```

---

## 🔧 API Configuration

### Firebase Firestore Collections

```
users/
  └── {userId}
      ├── email: string
      ├── displayName: string
      ├── role: string (admin | user)
      ├── province: string
      └── createdAt: timestamp

reports/
  └── {reportId}
      ├── userId: string
      ├── userName: string
      ├── userEmail: string
      ├── category: string
      ├── severity: string (low | medium | high | critical)
      ├── description: string
      ├── location: string
      ├── images: array
      ├── status: string (pending | reviewing | resolved | rejected)
      ├── createdAt: timestamp
      └── likes: array

weather/
  └── {cityId}
      ├── location: object
      ├── current: object
      ├── forecast: object
      └── lastUpdated: timestamp

suspensions/
  └── {suspensionId}
      ├── city: string
      ├── status: boolean
      ├── reason: string
      └── timestamp: timestamp
```

---

## 💻 Usage

### For Administrators

1. **Login** with admin credentials
2. **Dashboard Overview**: View real-time statistics
3. **Community Reports**: Review and manage user-submitted reports
4. **Suspension Management**: View weather data and manage class suspensions
5. **Analytics**: Access AI-powered insights

### For Community Users

1. **Register/Login** to access user dashboard
2. **Submit Reports**: Report disasters with photos and details
3. **Track Reports**: Monitor status of your submissions
4. **View Suspensions**: Check class suspension status for your city
5. **Dashboard**: View weather conditions and community stats

---

## 📸 Screenshots

*Screenshots will be added here*

---

## 🌐 Deployment

### Deploy to Firebase Hosting

```bash
# Build the project
npm run build

# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy
firebase deploy
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Frontend Developer**: [Your Name]
- **Backend Developer**: [Your Name]
- **UI/UX Designer**: [Your Name]

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Firebase** for backend services
- **OpenWeather** for weather data
- **Google Gemini AI** for intelligent analysis
- **PAGASA** for local weather forecasts
- **Figma Design**: [Original Design](https://www.figma.com/design/3KO0055ALVieOyvx62k12H)

---

## 📞 Support

For questions or support:
- 📧 Email: support@alerto.ph
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/alerto/issues)
- 📖 Docs: [Documentation](https://github.com/yourusername/alerto/wiki)

---

<div align="center">

**Built with ❤️ for Batangas Province**

⭐ Star this repository if you find it helpful!

</div>
