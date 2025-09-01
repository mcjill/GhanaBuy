import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/utils/scrapers';
import { searchCache } from '@/lib/cache/search-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    let searchParams;
    try {
      // Validate request.url before constructing URL
      if (!request.url || typeof request.url !== 'string') {
        throw new Error('Request URL is missing or invalid');
      }
      searchParams = new URL(request.url).searchParams;
    } catch (error) {
      console.error('Invalid URL in request:', request.url, error);
      return NextResponse.json({ error: 'Invalid request URL' }, { status: 400 });
    }
    
    const query = searchParams.get('q');
    const minPrice = searchParams.get('min') ? Number(searchParams.get('min')) : undefined;
    const maxPrice = searchParams.get('max') ? Number(searchParams.get('max')) : undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResults = searchCache.get(query, minPrice, maxPrice);
    if (cachedResults) {
      console.log(`[Search API] Returning cached results for "${query}"`);
      return NextResponse.json(cachedResults);
    }

    console.log(`[Search API] Searching for "${query}" with price range: ${minPrice || 0} - ${maxPrice || 'unlimited'} GHS`);
    const results = await scrapeAllSources(query, minPrice, maxPrice);
    
    // Cache successful results
    if (results.success) {
      searchCache.set(query, results, minPrice, maxPrice);
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in search-products route:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}