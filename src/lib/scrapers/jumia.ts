import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';

export class JumiaScraper extends BaseScraper {
  protected readonly store = 'Jumia' as const;
  protected readonly baseUrl = 'https://www.jumia.com.gh';
  protected readonly currency = 'GHS';
  
  protected readonly selectors: Selectors = {
    productGrid: 'div.-paxs',
    productItem: 'article.prd._fb.col.c-prd',
    title: 'h3.name',
    price: 'div.prc',
    image: 'img.img',
    url: 'a.core',
    rating: 'div.stars._s',
    reviews: 'div.rev'
  };

  protected getSearchUrl(query: string): string {
    // Ensure the query is properly encoded and the URL is correctly formatted
    const encodedQuery = encodeURIComponent(query.trim());
    return `${this.baseUrl}/catalog/?q=${encodedQuery}`;
  }

  protected cleanPrice(priceText: string): number {
    try {
      // Remove currency symbol, commas, and any non-numeric characters except decimal point
      const cleaned = priceText.replace(/[^\d.]/g, '');
      const price = parseFloat(cleaned);
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.error('Error cleaning price:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const jumiaScraper = new JumiaScraper();
