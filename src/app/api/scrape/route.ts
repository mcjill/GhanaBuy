import { NextResponse } from 'next/server';
import { scrapeAll } from '@/lib/scrapers';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters long' },
        { status: 400 }
      );
    }

    console.log('Starting scrape for query:', query);
    const results = await scrapeAll(query);
    console.log('Scrape results:', {
      total: results.length,
      stores: results.reduce((acc, product) => {
        acc[product.store] = (acc[product.store] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product data' },
      { status: 500 }
    );
  }
}
