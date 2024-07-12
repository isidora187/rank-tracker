import { doGoogleSearch } from "@/libs/rankingFunctions";
import mongoose from "mongoose";
import { Keyword } from "../../../models/Keyword";
import { Result } from "../../../models/Result";

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const keywordsDocs = await Keyword.find();

    const googleSearchPromises = keywordsDocs.map(async keywordDoc => {
      try {
        const responseId = await doGoogleSearch(keywordDoc.keyword);
        const result = await Result.create({
          domain: keywordDoc.domain,
          keyword: keywordDoc.keyword,
          brightDataResponseId: responseId,
          complete: false, // Assuming initially incomplete
        });
        return result;
      } catch (error) {
        console.error(`Error processing keyword ${keywordDoc.keyword}:`, error);
        throw error;
      }
    });

    await Promise.allSettled(googleSearchPromises);

    return Response.json(true);
  } catch (error) {
    console.error('Error in GET /api/check-all-keywords:', error);
    return Response.json(false);
  }
}
