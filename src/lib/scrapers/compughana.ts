import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';

export class CompuGhanaScraper extends BaseScraper {
  protected readonly store = 'CompuGhana';
  protected readonly baseUrl = 'https://compughana.com';
  protected readonly currency = 'GHS';
  
  protected readonly selectors: Selectors = {
    productGrid: '.products.list.items.product-items',
    productItem: '.item.product.product-item',
    title: '.product-item-link',
    price: '[data-price-type="finalPrice"] .price',
    image: '.product-image-photo',
    url: '.product-item-link',
    rating: '.rating-result',
    reviews: '.reviews-actions'
  };

  protected cleanPrice(priceText: string): number {
    try {
      // Remove currency symbol, commas and any non-numeric characters except decimal point
      const cleaned = priceText.replace(/[^\d.]/g, '');
      const price = parseFloat(cleaned);
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.error('Error cleaning price:', error);
      return 0;
    }
  }

  protected getSearchUrl(query: string): string {
    // CompuGhana uses a different search URL structure
    const encodedQuery = encodeURIComponent(query.trim());
    return `${this.baseUrl}/catalogsearch/result/?q=${encodedQuery}`;
  }
}

// Create singleton instance
export const compuGhanaScraper = new CompuGhanaScraper();
