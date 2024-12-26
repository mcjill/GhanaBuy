import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/utils/scrapers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const minPrice = searchParams.get('min') ? Number(searchParams.get('min')) : undefined;
    const maxPrice = searchParams.get('max') ? Number(searchParams.get('max')) : undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    console.log(`[Search API] Searching for "${query}" with price range: ${minPrice || 0} - ${maxPrice || 'unlimited'} GHS`);
    const results = await scrapeAllSources(query, minPrice, maxPrice);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in search-products route:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}