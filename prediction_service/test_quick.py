"""
Quick test script for ARIMA prediction system
Run this to verify everything is working
"""

import sys
import requests
from arima_model import SuspensionPredictor

def test_model():
    """Test the ARIMA model locally"""
    print("\n" + "="*60)
    print("🧪 TEST 1: ARIMA Model")
    print("="*60)

    try:
        predictor = SuspensionPredictor()
        result = predictor.run_full_pipeline(
            city='Batangas City',
            days=30,  # Use less days for faster testing
            forecast_steps=3  # Just 3 days for quick test
        )

        if result:
            print("\n✅ Model test PASSED")
            print(f"   Generated {len(result['forecast'])} day forecast")
            print(f"   Model accuracy: {result['accuracy']['accuracy']*100:.1f}%")
            return True
        else:
            print("\n❌ Model test FAILED")
            return False

    except Exception as e:
        print(f"\n❌ Model test FAILED: {e}")
        return False


def test_api():
    """Test the Flask API"""
    print("\n" + "="*60)
    print("🧪 TEST 2: Flask API")
    print("="*60)

    try:
        # Test health endpoint
        print("\n📡 Testing health endpoint...")
        response = requests.get('http://localhost:5000/health', timeout=5)

        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False

        # Test forecast endpoint
        print("\n📡 Testing forecast endpoint...")
        response = requests.get(
            'http://localhost:5000/api/predictions/suspension-forecast',
            params={'city': 'Batangas City', 'days': 3},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print("   ✅ Forecast endpoint passed")
            print(f"   Received {len(data['forecast'])} days of predictions")
            print(f"   Recommendation: {data['recommendation']['action']}")
            return True
        else:
            print(f"   ❌ Forecast endpoint failed: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to API server")
        print("   Make sure Flask is running: python app.py")
        return False
    except Exception as e:
        print(f"\n❌ API test failed: {e}")
        return False


def main():
    print("\n" + "="*60)
    print("🚀 ARIMA Prediction System - Quick Test")
    print("="*60)

    # Test 1: Model
    model_ok = test_model()

    # Test 2: API (only if model works)
    if model_ok:
        print("\n⏳ Waiting for you to start Flask server...")
        print("   Run in another terminal: python app.py")
        print("   Press Enter when ready...")
        input()

        api_ok = test_api()
    else:
        api_ok = False

    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"   Model Test: {'✅ PASS' if model_ok else '❌ FAIL'}")
    print(f"   API Test:   {'✅ PASS' if api_ok else '❌ FAIL'}")
    print("="*60)

    if model_ok and api_ok:
        print("\n🎉 All tests passed! System is ready to use.")
        print("\nNext steps:")
        print("1. Keep Flask server running (python app.py)")
        print("2. Start React app (npm run dev)")
        print("3. Login as Test Role")
        print("4. Go to Analytics page")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check errors above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
