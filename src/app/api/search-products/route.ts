import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/utils/scrapers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await scrapeAllSources(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in search-products route:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}