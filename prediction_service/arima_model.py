"""
ARIMA Model for Suspension Probability Forecasting
Predicts the probability of class suspension for the next 7 days
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from statsmodels.tsa.arima.model import ARIMA
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')


class SuspensionPredictor:
    """
    ARIMA-based suspension probability predictor
    """

    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.historical_data = None

    def generate_sample_data(self, days=90):
        """
        Generate sample historical data for demonstration
        In production, replace with actual Firebase data
        """
        np.random.seed(42)
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')

        # Simulate suspension patterns (more suspensions during rainy months)
        base_prob = 0.15  # Base 15% chance
        seasonal_factor = np.sin(np.linspace(0, 4*np.pi, days)) * 0.2 + 0.2

        # Add randomness and trends
        noise = np.random.normal(0, 0.1, days)
        suspension_pattern = base_prob + seasonal_factor + noise
        suspension_pattern = np.clip(suspension_pattern, 0, 1)

        # Convert to binary (0 or 1) with probability
        suspensions = (np.random.random(days) < suspension_pattern).astype(int)

        # Add some realism - suspensions tend to cluster
        for i in range(1, len(suspensions)):
            if suspensions[i-1] == 1 and np.random.random() < 0.4:
                suspensions[i] = 1

        df = pd.DataFrame({
            'date': dates,
            'suspended': suspensions,
            'rainfall': np.random.lognormal(2, 1, days),  # mm/hour
            'wind_speed': np.random.lognormal(3, 0.5, days),  # km/h
        })

        return df

    def fetch_historical_data(self, city='Batangas City', days=90):
        """
        Fetch historical suspension data from Firebase
        For now, uses sample data

        TODO: Replace with actual Firebase query:
        db.collection('suspensions')
          .where('city', '==', city)
          .where('date', '>=', start_date)
          .get()
        """
        # Use sample data for now
        df = self.generate_sample_data(days)
        return df

    def preprocess_data(self, df):
        """
        Prepare data for ARIMA model
        """
        # Ensure date is index
        df = df.set_index('date')
        df = df.sort_index()

        # Create moving averages to smooth data
        df['suspension_ma3'] = df['suspended'].rolling(window=3, min_periods=1).mean()
        df['suspension_ma7'] = df['suspended'].rolling(window=7, min_periods=1).mean()

        return df

    def train_model(self, df, order=(5, 1, 2)):
        """
        Train ARIMA model on historical suspension data

        Parameters:
        - order: (p, d, q) ARIMA parameters
          p = autoregressive lag order (use past 5 days)
          d = differencing order (1 = make stationary)
          q = moving average order (2 terms)
        """
        # Use the 7-day moving average for smoother predictions
        train_data = df['suspension_ma7'].values

        try:
            # Train ARIMA model
            model = ARIMA(train_data, order=order)
            self.model = model.fit()

            print(f"[OK] Model trained successfully")
            print(f"   AIC: {self.model.aic:.2f}")
            print(f"   BIC: {self.model.bic:.2f}")

            return True
        except Exception as e:
            print(f"[ERROR] Error training model: {e}")
            return False

    def predict_suspension_probability(self, steps=7):
        """
        Generate suspension probability forecast for next N days

        Returns:
        - forecast: Predicted probabilities (0-1)
        - confidence_interval: Upper and lower bounds
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train_model() first.")

        try:
            # Generate forecast
            forecast_result = self.model.get_forecast(steps=steps)
            forecast = forecast_result.predicted_mean
            conf_int = forecast_result.conf_int(alpha=0.05)  # 95% confidence

            # Clip probabilities to [0, 1] range
            forecast = np.clip(forecast, 0, 1)

            # Handle conf_int whether it's DataFrame or array
            if hasattr(conf_int, 'iloc'):
                conf_int_lower = np.clip(conf_int.iloc[:, 0], 0, 1)
                conf_int_upper = np.clip(conf_int.iloc[:, 1], 0, 1)
            else:
                conf_int_lower = np.clip(conf_int[:, 0], 0, 1)
                conf_int_upper = np.clip(conf_int[:, 1], 0, 1)

            # Generate dates
            last_date = self.historical_data.index[-1]
            future_dates = pd.date_range(
                start=last_date + timedelta(days=1),
                periods=steps,
                freq='D'
            )

            # Create result dataframe
            result = pd.DataFrame({
                'date': future_dates,
                'probability': forecast,
                'lower_bound': conf_int_lower,
                'upper_bound': conf_int_upper
            })

            # Add risk level classification
            result['risk_level'] = result['probability'].apply(self._classify_risk)
            result['confidence'] = self._calculate_confidence(result)

            return result

        except Exception as e:
            print(f"[ERROR] Error generating forecast: {e}")
            return None

    def _classify_risk(self, probability):
        """
        Classify risk level based on probability
        """
        if probability >= 0.70:
            return 'critical'
        elif probability >= 0.50:
            return 'high'
        elif probability >= 0.30:
            return 'moderate'
        else:
            return 'low'

    def _calculate_confidence(self, result):
        """
        Calculate confidence level for each prediction
        Confidence decreases as we forecast further into future
        """
        n = len(result)
        confidence = []
        for i in range(n):
            # Confidence decreases by 5% each day
            conf = max(0.95 - (i * 0.05), 0.60)
            confidence.append('high' if conf > 0.80 else 'medium' if conf > 0.65 else 'low')
        return confidence

    def get_recommendation(self, forecast_df):
        """
        Generate actionable recommendation based on forecast
        """
        high_risk_days = forecast_df[forecast_df['risk_level'].isin(['critical', 'high'])]

        if len(high_risk_days) == 0:
            return {
                'action': 'monitor',
                'message': 'Low suspension risk for the next 7 days. Continue monitoring weather conditions.',
                'high_risk_days': []
            }

        # Find the earliest high-risk day
        first_risk_day = high_risk_days.iloc[0]
        days_until = (first_risk_day['date'] - datetime.now()).days

        if first_risk_day['risk_level'] == 'critical':
            if days_until <= 1:
                action = 'issue_now'
                message = f"CRITICAL: Issue suspension immediately. {int(first_risk_day['probability']*100)}% probability tomorrow."
            else:
                action = 'prepare'
                message = f"HIGH ALERT: Prepare suspension for {first_risk_day['date'].strftime('%A, %B %d')}. {int(first_risk_day['probability']*100)}% probability."
        else:
            action = 'monitor_closely'
            message = f"WATCH: Monitor conditions closely for {first_risk_day['date'].strftime('%A, %B %d')}. {int(first_risk_day['probability']*100)}% probability."

        return {
            'action': action,
            'message': message,
            'high_risk_days': high_risk_days[['date', 'probability', 'risk_level']].to_dict('records')
        }

    def calculate_accuracy(self, test_data):
        """
        Evaluate model accuracy on test data
        """
        if len(test_data) < 7:
            return None

        # Use last 7 days as test set
        test = test_data[-7:]
        train = test_data[:-7]

        # Retrain on training data
        model = ARIMA(train['suspension_ma7'].values, order=(5, 1, 2))
        fitted_model = model.fit()

        # Predict
        predictions = fitted_model.forecast(steps=7)
        predictions = np.clip(predictions, 0, 1)

        # Calculate metrics
        actual = test['suspended'].values
        predicted = (predictions > 0.5).astype(int)

        accuracy = np.mean(actual == predicted)

        return {
            'accuracy': float(accuracy),
            'predictions': predictions.tolist(),
            'actual': actual.tolist()
        }

    def run_full_pipeline(self, city='Batangas City', days=90, forecast_steps=7):
        """
        Complete pipeline: fetch data -> train model -> generate forecast
        """
        print(f"\n>> Starting ARIMA Suspension Prediction Pipeline")
        print(f"   City: {city}")
        print(f"   Training data: {days} days")
        print(f"   Forecast horizon: {forecast_steps} days\n")

        # Step 1: Fetch data
        print("[*] Fetching historical data...")
        df = self.fetch_historical_data(city, days)
        print(f"   [OK] Loaded {len(df)} days of data")

        # Step 2: Preprocess
        print("\n[*] Preprocessing data...")
        df = self.preprocess_data(df)
        self.historical_data = df
        print(f"   [OK] Data prepared")

        # Step 3: Train model
        print("\n[*] Training ARIMA model...")
        success = self.train_model(df)
        if not success:
            return None

        # Step 4: Generate forecast
        print(f"\n[*] Generating {forecast_steps}-day forecast...")
        forecast = self.predict_suspension_probability(forecast_steps)
        if forecast is None:
            return None
        print(f"   [OK] Forecast generated")

        # Step 5: Get recommendation
        print("\n[*] Generating recommendation...")
        recommendation = self.get_recommendation(forecast)
        print(f"   Action: {recommendation['action']}")
        print(f"   Message: {recommendation['message']}")

        # Step 6: Calculate accuracy
        print("\n[*] Calculating model accuracy...")
        accuracy_metrics = self.calculate_accuracy(df)
        if accuracy_metrics:
            print(f"   Accuracy: {accuracy_metrics['accuracy']*100:.1f}%")

        return {
            'forecast': forecast.to_dict('records'),
            'recommendation': recommendation,
            'accuracy': accuracy_metrics,
            'model_info': {
                'aic': float(self.model.aic),
                'bic': float(self.model.bic),
                'training_days': len(df)
            }
        }


def test_model():
    """
    Test the ARIMA model with sample data
    """
    predictor = SuspensionPredictor()
    result = predictor.run_full_pipeline(
        city='Batangas City',
        days=90,
        forecast_steps=7
    )

    if result:
        print("\n" + "="*50)
        print("FORECAST RESULTS")
        print("="*50)
        for day in result['forecast']:
            date = day['date']
            prob = day['probability']
            risk = day['risk_level']
            print(f"{date}: {prob*100:.1f}% ({risk})")

        print("\n" + "="*50)
        print("RECOMMENDATION")
        print("="*50)
        print(result['recommendation']['message'])


if __name__ == '__main__':
    test_model()
