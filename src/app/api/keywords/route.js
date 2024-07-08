import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { doGoogleSearch } from "@/libs/rankingFunctions";
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
      return new Response('Unauthorized', { status: 401 });
    }
    
    const keywordDoc = await Keyword.create({
      domain: data.domain,
      keyword: data.keyword,
      owner: session.user.email,
    });

    const responseId = await doGoogleSearch(data.keyword);
    
    await Result.create({
      domain: data.domain,
      keyword: data.keyword,
      brightDataResponseId: responseId,
    });

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
      return new Response('Unauthorized', { status: 401 });
    }
    
    const keywordsDocs = await Keyword.find(
      keyword
        ? { domain, keyword, owner: session.user.email }
        : { domain, owner: session.user.email }
    );
    
    const resultsDocs = await Result.find({
      domain,
      keyword: keywordsDocs.map(doc => doc.keyword),
    });

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
      return new Response('Unauthorized', { status: 401 });
    }
    
    await Keyword.deleteOne({ domain, keyword, owner: session.user.email });
    return new Response(JSON.stringify(true), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/keywords:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
