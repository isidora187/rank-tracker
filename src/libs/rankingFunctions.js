const axios = require('axios');
const { Result } = require('../models/Result');

export async function doGoogleSearch(keyword) {
  const data = { 'country': 'us', 'query': { 'q': keyword, num: 100 }, num: 100 };
  const url = 'https://api.brightdata.com/serp/req?customer=hl_49999f2f&zone=ranktracker';
  const headers = { 'Authorization': 'Bearer 7f31962d-ad0c-4225-a8f9-431f10d09094' };

  try {
    const response = await axios.post(url, data, { headers });
    const responseId = response.headers['x-response-id'];
    console.log('Bright Data response ID:', responseId);
    return responseId;
  } catch (error) {
    console.error('Error in doGoogleSearch:', error);
    return null;
  }
}

async function fetchRank(responseId, domain) {
  const url = `https://api.brightdata.com/serp/get_result?output=json&customer=hl_49999f2f-zone-ranktracker&response_id=${responseId}`;
  const headers = { 'Authorization': 'Bearer 7f31962d-ad0c-4225-a8f9-431f10d09094' };

  try {
    const response = await axios.get(url, { headers });
    const resultData = response.data;
    if (resultData?.status === 'pending') {
      return { status: 'pending' };
    }
    const rank = resultData?.organic?.find(result => result.link.includes(domain))?.rank;
    return { status: 'complete', rank };
  } catch (error) {
    console.error('Error in fetchRank:', error);
    return { status: 'error', error };
  }
}

export async function updateRank(responseId, domain) {
  const maxRetries = 10;
  const retryInterval = 30000; // 30 seconds

  let attempt = 0;
  let result;
  do {
    result = await fetchRank(responseId, domain);
    if (result.status === 'complete') {
      break;
    }
    attempt++;
    if (result.status === 'pending') {
      console.log(`Attempt ${attempt}: Request is still pending, retrying in ${retryInterval / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    } else {
      console.error(`Attempt ${attempt}: Error occurred: ${result.error}`);
      return null;
    }
  } while (attempt < maxRetries);

  const ourResultDoc = await Result.findOne({ brightDataResponseId: responseId });
  if (!ourResultDoc) {
    console.log('Result document not found for responseId:', responseId);
    return null;
  }

  ourResultDoc.complete = true;
  if (result.rank !== undefined) {
    ourResultDoc.rank = result.rank;
    console.log(`Rank ${result.rank} saved for domain ${domain}`);
  } else {
    console.log(`No rank found for domain ${domain}`);
  }
  await ourResultDoc.save();
  return result.rank !== undefined ? result.rank : null;
}
