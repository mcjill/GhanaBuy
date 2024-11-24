import { compuGhanaScraper } from './compughana';
import { telefonikaScraper } from './telefonika';
import { jumiaScraper } from './jumia';
import type { Product, ScrapingResult } from './types';
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

  // Scrape from all sources in parallel
  const results = await Promise.allSettled([
    retry(() => compuGhanaScraper.scrape(cleanQuery)),
    retry(() => telefonikaScraper.scrape(cleanQuery)),
    retry(() => jumiaScraper.scrape(cleanQuery))
  ]);

  const products: Product[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.products.length > 0) {
      const source = ['CompuGhana', 'Telefonika', 'Jumia'][index];
      const sourceProducts = result.value.products;
      
      // Cache the results
      productCache.set(cleanQuery, source, sourceProducts);
      
      products.push(...sourceProducts);
    }
  });

  return products.sort((a, b) => a.price - b.price);
}

export type { Product, ScrapingResult };
