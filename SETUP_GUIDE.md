# 🚀 Alerto Full-Stack Setup Guide

This guide will help you set up the complete Alerto system with a React frontend connected to a Node.js backend API and MongoDB database.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**
- **Git**

## 🏗️ Project Structure

```
Alerto/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth, Socket)
│   ├── services/          # API service layer
│   └── ...
├── backend/               # Node.js backend
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/        # Custom middleware
│   └── ...
├── package.json          # Frontend dependencies
└── backend/package.json  # Backend dependencies
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
```

**Edit `.env` file:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/alerto
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
WEATHER_API_KEY=your-openweathermap-api-key
```

### 2. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 3. Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Backend will be available at: `http://localhost:5000`

### 4. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install frontend dependencies
npm install

# Add environment variables
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env.local
```

### 5. Start Frontend Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/alerto

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Weather API (Optional)
WEATHER_API_KEY=your-openweathermap-api-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Reports
- `GET /api/reports` - Get all reports (with filtering)
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/like` - Like/unlike report

### Weather
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/forecast` - Get weather forecast
- `GET /api/weather/alerts` - Get weather alerts

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/reports` - Manage all reports
- `PUT /api/admin/reports/:id/status` - Update report status

## 🗄️ Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['user', 'reporter', 'admin', 'super_admin'],
  location: {
    barangay: String,
    city: String,
    province: String,
    coordinates: { lat: Number, lng: Number }
  },
  stats: {
    reportsSubmitted: Number,
    reportsVerified: Number,
    reputation: Number
  }
}
```

### Report
```javascript
{
  title: String,
  description: String,
  category: ['flooding', 'traffic', 'power', 'infrastructure', 'weather', 'emergency'],
  severity: ['low', 'medium', 'high', 'critical'],
  status: ['pending', 'verified', 'investigating', 'resolved', 'false_report'],
  location: {
    barangay: String,
    city: String,
    province: String,
    coordinates: { lat: Number, lng: Number }
  },
  reporter: ObjectId (ref: User),
  images: [{ url: String, filename: String }],
  interactions: {
    likes: [ObjectId],
    comments: [{ user: ObjectId, text: String, createdAt: Date }],
    shares: Number
  }
}
```

### WeatherData
```javascript
{
  location: {
    city: String,
    province: String,
    coordinates: { lat: Number, lng: Number }
  },
  current: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    rainfall: Number,
    conditions: String
  },
  forecast: [{ date: Date, temperature: Object, conditions: String }],
  alerts: [{ type: String, severity: String, title: String }]
}
```

## 🔐 Authentication Flow

1. **Registration/Login** → JWT token generated
2. **Token stored** in localStorage
3. **API requests** include token in Authorization header
4. **Backend validates** token and extracts user info
5. **Real-time updates** via WebSocket with user context

## 📱 Real-time Features

The system includes WebSocket support for:
- New report notifications
- Report status updates
- New comments
- Weather alerts
- Admin notifications

## 🧪 Testing the Setup

### 1. Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### 2. Test Frontend Connection
Open browser console and check for:
- No CORS errors
- Successful API calls
- WebSocket connection established

### 3. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "location": {
      "barangay": "Test Barangay",
      "city": "Test City",
      "province": "Test Province"
    }
  }'
```

## 🚀 Deployment

### Backend Deployment (Heroku)

1. **Create Heroku app:**
```bash
heroku create alerto-backend
```

2. **Set environment variables:**
```bash
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production
```

3. **Deploy:**
```bash
git subtree push --prefix backend heroku main
```

### Frontend Deployment (Vercel/Netlify)

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to Vercel:**
```bash
npx vercel --prod
```

3. **Set environment variables:**
```env
VITE_API_URL=https://your-backend-url.herokuapp.com/api
VITE_SOCKET_URL=https://your-backend-url.herokuapp.com
```

## 🔧 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure `FRONTEND_URL` is set correctly in backend `.env`
- Check that frontend URL matches exactly

**2. Database Connection Issues**
- Verify MongoDB is running (local) or Atlas connection string is correct
- Check network connectivity

**3. Authentication Issues**
- Ensure JWT_SECRET is set
- Check token format in localStorage

**4. File Upload Issues**
- Verify uploads directory exists
- Check file size limits
- Ensure proper file types

### Debug Mode

**Backend:**
```bash
DEBUG=* npm run dev
```

**Frontend:**
```bash
npm run dev -- --debug
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Context API](https://reactjs.org/docs/context.html)
- [Socket.io Documentation](https://socket.io/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Congratulations! Your Alerto system is now ready to use!**

For support, create an issue in the repository or contact the development team.
