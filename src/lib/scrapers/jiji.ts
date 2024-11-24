import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';

export class JijiScraper extends BaseScraper {
  protected readonly store = 'Jiji Ghana';
  protected readonly baseUrl = 'https://jiji.com.gh';
  protected readonly currency = 'GHS';
  protected readonly selectors: Selectors = {
    productGrid: '.qa-advert-list',
    productItem: '.qa-advert-list-item',
    title: '.qa-advert-title',
    price: '.qa-advert-price',
    url: 'a',
    image: 'img',
    rating: undefined,
    reviews: undefined
  };

  async search(query: string): Promise<ScrapingResult> {
    try {
      console.log(`[JijiScraper] Starting search for: ${query}`);
      
      // Get the current hostname
      const host = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const apiUrl = `${host}/api/jiji?query=${encodeURIComponent(query)}`;
      
      console.log(`[JijiScraper] Calling API: ${apiUrl}`);
      
      // Use the server-side API route with absolute URL
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[JijiScraper] API request failed:', error);
        throw new Error(`Failed to fetch from Jiji: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[JijiScraper] API response:`, data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch products from Jiji');
      }

      return {
        success: true,
        products: data.products,
        error: null
      };
    } catch (error) {
      console.error('[JijiScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  protected cleanPrice(price: string): number {
    const numericString = price.replace(/[^0-9.]/g, '');
    const parsedPrice = parseFloat(numericString);
    return isNaN(parsedPrice) ? 0 : parsedPrice;
  }

  private normalizeImageUrl(url: string): string {
    if (!url) return '/placeholder.png';
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return url;
  }

  private normalizeProductUrl(url: string): string {
    if (!url) return '#';
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return url;
  }
}

// Create singleton instance
export const jijiScraper = new JijiScraper();
