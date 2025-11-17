"""
Flask API Server for ARIMA Suspension Predictions
Provides REST endpoints for the frontend to fetch predictions
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from arima_model import SuspensionPredictor
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global predictor instance (cache)
predictor_cache = {}
last_training_time = {}


def get_or_train_predictor(city='Batangas City', force_retrain=False):
    """
    Get cached predictor or train a new one
    Retrains every 6 hours or if forced
    """
    cache_key = city
    current_time = datetime.now()

    # Check if we need to retrain
    needs_training = (
        force_retrain or
        cache_key not in predictor_cache or
        cache_key not in last_training_time or
        (current_time - last_training_time[cache_key]).total_seconds() > 6 * 3600
    )

    if needs_training:
        print(f"[*] Training new model for {city}...")
        predictor = SuspensionPredictor()
        result = predictor.run_full_pipeline(city=city, days=90, forecast_steps=7)

        if result:
            predictor_cache[cache_key] = {
                'predictor': predictor,
                'result': result
            }
            last_training_time[cache_key] = current_time
            print(f"[OK] Model cached for {city}")
        else:
            return None
    else:
        print(f"[OK] Using cached model for {city}")

    return predictor_cache[cache_key]


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'ARIMA Suspension Predictor',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/predictions/suspension-forecast', methods=['GET'])
def get_suspension_forecast():
    """
    Get 7-day suspension probability forecast

    Query Parameters:
    - city: City name (default: 'Batangas City')
    - days: Number of days to forecast (default: 7)
    - force_retrain: Force model retraining (default: false)

    Returns:
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
        },
        ...
      ],
      "recommendation": {
        "action": "prepare",
        "message": "...",
        "high_risk_days": [...]
      },
      "accuracy": {
        "accuracy": 0.78
      },
      "model_info": {
        "aic": 123.45,
        "bic": 234.56,
        "training_days": 90
      }
    }
    """
    try:
        # Get query parameters
        city = request.args.get('city', 'Batangas City')
        days = int(request.args.get('days', 7))
        force_retrain = request.args.get('force_retrain', 'false').lower() == 'true'

        # Get or train predictor
        cached_data = get_or_train_predictor(city, force_retrain)

        if cached_data is None:
            return jsonify({
                'error': 'Failed to train model',
                'message': 'Unable to generate predictions at this time'
            }), 500

        result = cached_data['result']

        # Format dates for JSON
        forecast = result['forecast']
        for item in forecast:
            if isinstance(item['date'], datetime):
                item['date'] = item['date'].strftime('%Y-%m-%d')

        recommendation = result['recommendation']
        if 'high_risk_days' in recommendation:
            for day in recommendation['high_risk_days']:
                if 'date' in day and isinstance(day['date'], datetime):
                    day['date'] = day['date'].strftime('%Y-%m-%d')

        response = {
            'city': city,
            'forecast': forecast[:days],  # Limit to requested days
            'recommendation': recommendation,
            'accuracy': result.get('accuracy'),
            'model_info': result.get('model_info'),
            'generated_at': datetime.now().isoformat()
        }

        return jsonify(response)

    except Exception as e:
        print(f"❌ Error in suspension_forecast: {e}")
        return jsonify({
            'error': str(e),
            'message': 'Error generating forecast'
        }), 500


@app.route('/api/predictions/model-info', methods=['GET'])
def get_model_info():
    """
    Get information about trained models

    Returns:
    {
      "models": [
        {
          "city": "Batangas City",
          "last_trained": "2025-01-17T10:30:00",
          "training_days": 90,
          "accuracy": 0.78
        }
      ]
    }
    """
    try:
        models = []
        for city, cache_data in predictor_cache.items():
            result = cache_data['result']
            models.append({
                'city': city,
                'last_trained': last_training_time[city].isoformat() if city in last_training_time else None,
                'training_days': result['model_info']['training_days'],
                'accuracy': result['accuracy']['accuracy'] if result.get('accuracy') else None,
                'aic': result['model_info']['aic'],
                'bic': result['model_info']['bic']
            })

        return jsonify({
            'models': models,
            'total_models': len(models)
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/api/predictions/retrain', methods=['POST'])
def retrain_model():
    """
    Force retrain model for a specific city

    POST Body:
    {
      "city": "Batangas City"
    }
    """
    try:
        data = request.get_json()
        city = data.get('city', 'Batangas City')

        print(f"🔄 Force retraining model for {city}...")

        # Force retrain
        cached_data = get_or_train_predictor(city, force_retrain=True)

        if cached_data is None:
            return jsonify({
                'success': False,
                'message': 'Failed to retrain model'
            }), 500

        return jsonify({
            'success': True,
            'message': f'Model retrained successfully for {city}',
            'trained_at': last_training_time[city].isoformat(),
            'model_info': cached_data['result']['model_info']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/predictions/test', methods=['GET'])
def test_prediction():
    """
    Test endpoint with quick prediction
    """
    try:
        predictor = SuspensionPredictor()

        # Quick test with 30 days of data
        df = predictor.generate_sample_data(days=30)
        df = predictor.preprocess_data(df)
        predictor.historical_data = df
        predictor.train_model(df)

        forecast = predictor.predict_suspension_probability(steps=3)

        return jsonify({
            'status': 'success',
            'message': 'Prediction test successful',
            'sample_forecast': forecast.to_dict('records')
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print(">> ARIMA Suspension Prediction API Server")
    print("="*60)
    print("\nAvailable Endpoints:")
    print("  GET  /health")
    print("  GET  /api/predictions/suspension-forecast?city=BatangasCity")
    print("  GET  /api/predictions/model-info")
    print("  POST /api/predictions/retrain")
    print("  GET  /api/predictions/test")
    print("\n" + "="*60)
    print("Starting server on http://localhost:5000")
    print("="*60 + "\n")

    # Pre-train model for Batangas City on startup
    print("[*] Pre-training model for Batangas City...")
    get_or_train_predictor('Batangas City')
    print("[OK] Ready to serve predictions!\n")

    app.run(host='0.0.0.0', port=5000, debug=True)
