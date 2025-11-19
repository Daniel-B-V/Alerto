const fetch = require('node-fetch');
require('dotenv').config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function acceptAgreement() {
  console.log('📝 Accepting Llama 3.2 Vision model license agreement...');

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'agree'
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Successfully accepted Llama 3.2 Vision model agreement!');
      console.log('📋 Response:', data);
    } else {
      console.error('❌ Error accepting agreement:', response.status);
      console.error('📋 Details:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

acceptAgreement();
