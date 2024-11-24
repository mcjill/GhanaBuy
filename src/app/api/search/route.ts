import { NextResponse } from 'next/server';
import { Product, SearchRequest, ScrapingResult } from '@/lib/scrapers/types';
import { jijiScraper } from '@/lib/scrapers/jiji';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    console.log(`Searching for: ${query}`);

    const jijiResults = await jijiScraper.search(query);

    if (!jijiResults.success) {
      console.error('Error from Jiji scraper:', jijiResults.error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    return NextResponse.json({ products: jijiResults.products });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Search request body:', body);

    const { query, budget, currency = 'GHS' } = body as SearchRequest;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Searching for: ${query} with budget: ${budget} in ${currency}`);

    const results = await jijiScraper.search(query);
    console.log('Jiji search results:', results);

    if (!results.success) {
      console.error('Error from Jiji scraper:', results.error);
      return NextResponse.json(
        { error: results.error || 'Failed to fetch results' },
        { status: 500 }
      );
    }

    let products = results.products.map(product => ({
      ...product,
      store: product.store || 'Jiji Ghana', // Ensure store is always set
      currency: product.currency || currency,
      availability: product.availability ?? true,
      rating: product.rating ?? 0,
      reviews: product.reviews ?? 0
    }));

    // Filter by budget if specified
    if (budget) {
      products = products.filter(product => product.price <= budget);
    }

    // Sort by price (lowest first)
    products.sort((a, b) => a.price - b.price);

    console.log(`Found ${products.length} products after filtering`);

    return NextResponse.json({
      success: true,
      products,
      totalResults: products.length,
      currency,
      budget
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
