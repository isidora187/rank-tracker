const axios = require('axios');

async function testBrightData() {
  const responseId = 's3w11t1720540510427rlumevgudsmo'; // Use an actual response_id from your database
  const url = `https://api.brightdata.com/serp/get_result?output=json&customer=hl_49999f2f-zone-ranktracker&response_id=${responseId}`;
  const headers = { 'Authorization': 'Bearer 7f31962d-ad0c-4225-a8f9-431f10d09094' };

  try {
    const response = await axios.get(url, { headers });
    console.log('Bright Data Response:', response.data);
  } catch (error) {
    console.error('Error fetching from Bright Data:', error);
  }
}

testBrightData();
