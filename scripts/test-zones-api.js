// Simple script to test the zones API endpoint
const fetch = require('node-fetch');

async function testZonesApi() {
  try {
    console.log('Testing zones API endpoint...');
    
    // Make a request to the zones API
    const response = await fetch('http://localhost:3001/api/zones', {
      headers: {
        // Add a cookie with the session token if needed
        // 'Cookie': 'next-auth.session-token=your_session_token'
      }
    });
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} zones from API`);
    
    if (data.length > 0) {
      console.log('First zone:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No zones returned from API');
    }
  } catch (error) {
    console.error('Error testing zones API:', error);
  }
}

testZonesApi();
