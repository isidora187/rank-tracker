const axios = require('axios');
const { Result } = require('../models/Result');

async function doGoogleSearch(keyword, domain) {
  const data = { 'country': 'us', 'query': { 'q': keyword, num: 100 }, num: 100 };
  const url = 'https://api.brightdata.com/serp/req?customer=hl_49999f2f&zone=ranktracker';
  const headers = { 'Authorization': 'Bearer 7f31962d-ad0c-4225-a8f9-431f10d09094' };

  try {
    const response = await axios.post(url, data, { headers });
    if (!response?.headers) {
      console.error('No header in response:', url);
      console.error(data);
      return null;
    } else {
      const responseId = response.headers['x-response-id'];
      console.log('responseId:', responseId);
      return responseId;
    }
  } catch (error) {
    console.error('Error in doGoogleSearch:', error);
    return null;
  }
}

async function updateRank(responseId) {
  const url = `https://api.brightdata.com/serp/get_result?output=json&customer=hl_49999f2f-zone-ranktracker&response_id=${responseId}`;
  const headers = { 'Authorization': 'Bearer 7f31962d-ad0c-4225-a8f9-431f10d09094' };

  try {
    const response = await axios.get(url, { headers });
    const ourResultDoc = await Result.findOne({
      brightDataResponseId: responseId,
    });

    if (ourResultDoc) {
      const domain = ourResultDoc.domain;
      const keyword = ourResultDoc.keyword;
      const rank = response?.data?.organic
        ?.find(result => result.link.includes(domain))?.rank;
      ourResultDoc.complete = true;
      if (rank) {
        ourResultDoc.rank = rank;
        console.log(`Rank ${rank} saved for keyword ${keyword} and domain ${domain}`);
      }
      await ourResultDoc.save();
    } else {
      console.log('Result not found for responseId:', responseId);
    }
  } catch (error) {
    console.error('Error in updateRank:', error);
  }
}

module.exports = {
  doGoogleSearch,
  updateRank,
};
