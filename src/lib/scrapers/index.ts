import { compuGhanaScraper } from './compughana';
import { telefonikaScraper } from './telefonika';
import { jumiaScraper } from './jumia';
import { Product, ScrapingResult } from './types';
import { retry } from '../utils/retry';
import { productCache } from '../cache';

export async function scrapeAll(searchQuery: string): Promise<Product[]> {
  const cleanQuery = searchQuery.trim().toLowerCase();
  
  // Check cache first
  const cachedResults = [
    ...productCache.get(cleanQuery, 'CompuGhana') || [],
    ...productCache.get(cleanQuery, 'Telefonika') || [],
    ...productCache.get(cleanQuery, 'Jumia') || [],
  ];

  if (cachedResults.length > 0) {
    return cachedResults.sort((a, b) => a.price - b.price);
  }

  try {
    // Run all scrapers concurrently with retries
    const results = await Promise.allSettled([
      retry(() => compuGhanaScraper.scrape(cleanQuery), {
        maxAttempts: 3,
        delayMs: 1000,
      }),
      retry(() => telefonikaScraper.scrape(cleanQuery), {
        maxAttempts: 3,
        delayMs: 1000,
      }),
      retry(() => jumiaScraper.scrape(cleanQuery), {
        maxAttempts: 3,
        delayMs: 1000,
      }),
    ]);

    // Process results and handle errors
    const allProducts = results.reduce<Product[]>((acc, result) => {
      if (result.status === 'fulfilled' && result.value.products) {
        return [...acc, ...result.value.products];
      }
      // Log errors but continue with available results
      if (result.status === 'rejected') {
        console.error('Scraping error:', result.reason);
      }
      return acc;
    }, []);

    // Sort by price
    return allProducts.sort((a, b) => a.price - b.price);

  } catch (error) {
    console.error('Error in scrapeAll:', error);
    return [];
  }
}

export { Product, ScrapingResult };
