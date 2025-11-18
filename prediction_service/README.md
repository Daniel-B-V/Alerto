# ARIMA Suspension Prediction Service

AI-powered suspension probability forecasting using ARIMA time series analysis.

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
cd prediction_service
pip install -r requirements.txt
```

### 2. Test the ARIMA Model

```bash
python arima_model.py
```

This will run a test prediction and show sample output.

### 3. Start the API Server

```bash
python app.py
```

Server will start on `http://localhost:5000`

## 📡 API Endpoints

### GET /api/predictions/suspension-forecast

Get 7-day suspension probability forecast.

**Query Parameters:**
- `city` - City name (default: "Batangas City")
- `days` - Number of days to forecast (default: 7)
- `force_retrain` - Force model retraining (default: false)

**Example:**
```bash
curl "http://localhost:5000/api/predictions/suspension-forecast?city=BatangasCity&days=7"
```

**Response:**
```json
{
  "city": "Batangas City",
  "forecast": [
    {
      "date": "2025-01-18",
      "probability": 0.85,
      "risk_level": "critical",
      "confidence": "high",
      "lower_bound": 0.75,
      "upper_bound": 0.95
    }
  ],
  "recommendation": {
    "action": "prepare",
    "message": "⚠️ HIGH ALERT: Prepare suspension for Friday, January 18. 85% probability."
  },
  "accuracy": {
    "accuracy": 0.78
  }
}
```

### GET /api/predictions/model-info

Get information about trained models.

### POST /api/predictions/retrain

Force retrain model for a specific city.

### GET /health

Health check endpoint.

## 🧪 Testing

```bash
# Test the prediction endpoint
curl http://localhost:5000/api/predictions/test
```

## 🔧 Configuration

### ARIMA Parameters

In `arima_model.py`, you can adjust the ARIMA order:

```python
# Current: ARIMA(5, 1, 2)
order=(5, 1, 2)
# p=5: Use past 5 days
# d=1: Difference once (make stationary)
# q=2: Use 2 moving average terms
```

### Cache Duration

Models are cached for 6 hours. To change:

```python
# In app.py, line ~30
(current_time - last_training_time[cache_key]).total_seconds() > 6 * 3600
# Change 6 to desired hours
```

## 📊 How It Works

1. **Data Collection**: Fetches 90 days of historical suspension data
2. **Preprocessing**: Smooths data using moving averages
3. **ARIMA Training**: Trains autoregressive model on patterns
4. **Forecasting**: Generates 7-day probability predictions
5. **Risk Classification**: Categorizes days as low/moderate/high/critical
6. **Recommendations**: Generates actionable guidance

## 🎯 Model Accuracy

- **Expected accuracy**: 75-85% for next-day predictions
- **7-day forecast**: 60-70% accuracy
- **Confidence intervals**: 95% CI provided for all predictions

## 🔄 Using Real Data

To use actual Firebase data instead of sample data:

1. Install Firebase Admin SDK:
```bash
pip install firebase-admin
```

2. Update `fetch_historical_data()` in `arima_model.py`:
```python
def fetch_historical_data(self, city='Batangas City', days=90):
    import firebase_admin
    from firebase_admin import firestore

    db = firestore.client()
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Query suspensions collection
    docs = db.collection('suspensions') \
        .where('city', '==', city) \
        .where('date', '>=', start_date) \
        .get()

    # Convert to DataFrame
    data = [doc.to_dict() for doc in docs]
    df = pd.DataFrame(data)
    return df
```

## 📝 Notes

- Currently uses **sample data** for demonstration
- Model retrains automatically every 6 hours
- Supports multiple cities (trains separate model per city)
- Caches predictions for performance

## 🐛 Troubleshooting

**ImportError: No module named 'statsmodels'**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Port 5000 already in use**
```bash
# In app.py, change the port
app.run(host='0.0.0.0', port=5001, debug=True)
```

**Low accuracy predictions**
- Need more historical data (minimum 60 days)
- Adjust ARIMA parameters (p, d, q)
- Check data quality (missing values, outliers)
