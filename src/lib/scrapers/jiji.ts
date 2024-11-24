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

  private async getApiUrl(): Promise<string> {
    // For server-side rendering or development
    if (typeof window === 'undefined') {
      return 'http://localhost:3000';
    }
    // For client-side, use the current origin
    return window.location.origin;
  }

  async search(query: string): Promise<ScrapingResult> {
    try {
      console.log(`[JijiScraper] Starting search for: ${query}`);
      
      const host = await this.getApiUrl();
      const apiUrl = `${host}/api/jiji?query=${encodeURIComponent(query)}`;
      
      console.log(`[JijiScraper] Calling API: ${apiUrl}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal,
          cache: 'no-store',
          next: { revalidate: 0 }
        });

        clearTimeout(timeout);

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
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            products: [],
            error: 'Request timed out while fetching from Jiji'
          };
        }
        throw fetchError;
      }
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
