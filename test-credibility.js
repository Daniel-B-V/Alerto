/**
 * Test script to verify credibility scoring system
 * Run with: node test-credibility.js
 */

// Node.js 18+ has fetch built-in
const BACKEND_URL = 'http://localhost:5000';

async function testTextAnalysis() {
  console.log('\n🧪 Testing Text Analysis...');

  try {
    const response = await fetch(`${BACKEND_URL}/api/huggingface/text-sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Severe flooding on Main Street. Water level reached 2 feet. [SEP] This is coherent and well-structured'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Text Analysis Response:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Text Analysis Failed:', error.message);
    return false;
  }
}

async function testImageAnalysis() {
  console.log('\n🧪 Testing Image Analysis...');

  // Sample base64 image (1x1 transparent pixel for testing)
  const sampleImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    const response = await fetch(`${BACKEND_URL}/api/huggingface/image-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: sampleImage,
        candidateLabels: ['flooding', 'water', 'clear sky', 'sunny day'],
        hazardType: 'flood'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Image Analysis Response:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Image Analysis Failed:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🧪 Testing Health Check...');

  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Credibility System Tests...\n');
  console.log('Backend URL:', BACKEND_URL);

  const results = {
    health: await testHealthCheck(),
    textAnalysis: await testTextAnalysis(),
    imageAnalysis: await testImageAnalysis()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('  ✅ Health Check:', results.health ? 'PASSED' : 'FAILED');
  console.log('  ✅ Text Analysis:', results.textAnalysis ? 'PASSED' : 'FAILED');
  console.log('  ✅ Image Analysis:', results.imageAnalysis ? 'PASSED' : 'FAILED');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n🎉 All tests PASSED! Credibility scoring should work now.');
    console.log('\n📝 Next steps:');
    console.log('  1. Keep backend server running (already running)');
    console.log('  2. Start your frontend: npm run dev');
    console.log('  3. Submit a test report and check the credibility score');
  } else {
    console.log('\n⚠️  Some tests FAILED. Check error messages above.');
    console.log('\n🔍 Common issues:');
    console.log('  - Backend server not running (run: node backend/server.js)');
    console.log('  - Missing HUGGING_FACE_API_KEY in backend/.env');
    console.log('  - Invalid or expired Hugging Face API key');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
