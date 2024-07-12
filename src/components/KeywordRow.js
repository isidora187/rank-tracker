import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

export default function KeywordRow({ keyword, domain, results: defaultResults }) {
  const [results, setResults] = useState(defaultResults || []);
  const [isComplete, setIsComplete] = useState(results.some(r => r.complete));
  const [rankExists, setRankExists] = useState(results.some(r => r.rank !== undefined));
  const [isFetching, setIsFetching] = useState(false);

  const reFetchResultIfNoRank = useCallback(async () => {
    if (isFetching) return;

    setIsFetching(true);

    try {
      const res = await axios.get(`/api/results?domain=${domain}&keyword=${keyword}`);
      console.log('Fetched data:', res.data); // Log the received data
      const newResults = res.data;
      setResults(newResults);
      const complete = newResults.some(r => r.complete);
      const rankExists = newResults.some(r => r.rank !== undefined);
      setIsComplete(complete);
      setRankExists(rankExists);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsFetching(false);
      if (!isComplete) {
        setTimeout(reFetchResultIfNoRank, 3000); // Retry fetching after 3 seconds if not complete
      }
    }
  }, [isFetching, domain, keyword, isComplete]);

  useEffect(() => {
    if (!isComplete) {
      reFetchResultIfNoRank();
    }
  }, [isComplete, reFetchResultIfNoRank]);

  return (
    <div className="flex gap-2 bg-white border border-blue-200 border-b-4 pr-0 rounded-lg items-center my-3">
      <Link href={`/domains/${domain}/${encodeURIComponent(keyword)}`} className="font-bold grow block p-4">
        {keyword}
      </Link>
      <div>
        <div className="min-h-[80px] w-[300px] flex items-center">
          {!rankExists && (
            <div className="block text-center w-full">
              {isComplete ? (
                <div>Not in top 100 :(</div>
              ) : (
                <div>Checking rank...</div>
              )}
            </div>
          )}
          {rankExists && (
            <div className="pt-2">
              <div>Rank data exists.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
