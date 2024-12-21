import { NextRequest, NextResponse } from 'next/server';
import { jumiaScraper } from '@/lib/scrapers/jumia';
import { compuGhanaScraper } from '@/lib/scrapers/compughana';
import { Product } from '@/lib/scrapers/types';
import { scrapeWithRehydration } from '@/lib/scrapers/rehydration-scraper';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log(`[Search API] Searching for: ${query}`);

    // Run scrapers in parallel
    const [jijiProducts, jumiaResults, compuGhanaResults] = await Promise.all([
      // Use scrapeWithRehydration for Jiji
      scrapeWithRehydration(`https://jiji.com.gh/search?query=${encodeURIComponent(query)}`),
      jumiaScraper.scrape({ query }),
      compuGhanaScraper.scrape({ query }),
    ]);

    // Combine all products
    let allProducts: Product[] = [
      ...jijiProducts,
      ...(jumiaResults.success ? jumiaResults.products : []),
      ...(compuGhanaResults.success ? compuGhanaResults.products : [])
    ];

    // Log results
    console.log(`[Search API] Found ${allProducts.length} total products:`);
    console.log(`- Jiji: ${jijiProducts.length} products`);
    console.log(`- Jumia: ${jumiaResults.success ? jumiaResults.products.length : 0} products`);
    console.log(`- CompuGhana: ${compuGhanaResults.success ? compuGhanaResults.products.length : 0} products`);

    return NextResponse.json({
      success: true,
      products: allProducts,
      errors: {
        jiji: jijiProducts.length === 0 ? 'No products found' : null,
        jumia: jumiaResults.error,
        compughana: compuGhanaResults.error,
      }
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
