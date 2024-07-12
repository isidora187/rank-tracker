import axios from "axios";
import mongoose from "mongoose";
import { Result } from "../../../models/Result";
import { URL } from 'url';

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export async function POST(req) {
  try {
    const data = await req.json();
    const response_id = data.response_id;
    const url = `https://api.brightdata.com/serp/get_result?output=json&customer=hl_49999f2f-zone-ranktracker&response_id=${response_id}`;
    const headers = { 'Authorization': 'Bearer 7f31962d-ad0c-4225-a8f9-431f10d09094' };

    const response = await axios.get(url, { headers });

    const ourResultDoc = await Result.findOne({ brightDataResponseId: response_id });

    if (ourResultDoc) {
      const domain = ourResultDoc.domain;
      const keyword = ourResultDoc.keyword;
      const rank = response.data.organic?.find(result => result.link.includes(domain))?.rank;
      
      ourResultDoc.complete = true;
      if (rank !== undefined) {
        ourResultDoc.rank = rank;
        console.log(`Rank ${rank} saved for keyword ${keyword} and domain ${domain}`);
      } else {
        console.log(`No rank found for keyword ${keyword} and domain ${domain}`);
      }
      await ourResultDoc.save();
    } else {
      console.log('Result document not found');
    }

    return new Response(JSON.stringify(true), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in POST /api/results:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    const keyword = url.searchParams.get('keyword');

    if (domain && keyword) {
      const results = await Result.find({ domain, keyword }).exec();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Bad Request', { status: 400 });
    }
  } catch (error) {
    console.error('Error in GET /api/results:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}