import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { doGoogleSearch, updateRank } from "@/libs/rankingFunctions";
import { Keyword } from "@/models/Keyword";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { URL } from 'url';
import { Result } from "../../../models/Result";

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export async function POST(req) {
  try {
    const data = await req.json();
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('Unauthorized: No session found');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Session:', session);
    console.log('Received data:', data);

    const keywordDoc = await Keyword.create({
      domain: data.domain,
      keyword: data.keyword,
      owner: session.user.email,
    });

    console.log('Keyword document created:', keywordDoc);

    const responseId = await doGoogleSearch(data.keyword);

    if (!responseId) {
      console.error('Failed to get responseId from Bright Data');
      return new Response('Failed to get responseId', { status: 500 });
    }

    const resultDoc = await Result.create({
      domain: data.domain,
      keyword: data.keyword,
      brightDataResponseId: responseId,
    });

    console.log('Result document created:', resultDoc);

    const rank = await updateRank(responseId, data.domain);

    if (rank !== null) {
      resultDoc.rank = rank;
      resultDoc.complete = true;
      await resultDoc.save();
      console.log(`Rank ${rank} saved for keyword ${data.keyword} and domain ${data.domain}`);
    } else {
      console.log(`No rank found for keyword ${data.keyword} and domain ${data.domain}`);
      resultDoc.complete = true;
      await resultDoc.save();
    }

    return new Response(JSON.stringify(keywordDoc), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST /api/keywords:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    const keyword = url.searchParams.get('keyword');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('Unauthorized: No session found');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Session:', session);

    const keywordsDocs = await Keyword.find(
      keyword
        ? { domain, keyword, owner: session.user.email }
        : { domain, owner: session.user.email }
    );

    console.log('Keyword documents found:', keywordsDocs);

    const resultsDocs = await Result.find({
      domain,
      keyword: keywordsDocs.map(doc => doc.keyword),
    });

    console.log('Result documents found:', resultsDocs);

    return new Response(JSON.stringify({
      keywords: keywordsDocs,
      results: resultsDocs,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/keywords:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    const keyword = url.searchParams.get('keyword');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('Unauthorized: No session found');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Session:', session);

    await Keyword.deleteOne({ domain, keyword, owner: session.user.email });
    console.log(`Keyword document deleted for domain ${domain} and keyword ${keyword}`);

    return new Response(JSON.stringify(true), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/keywords:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
