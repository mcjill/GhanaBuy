import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';

export class TelefonikaScraper extends BaseScraper {
  protected readonly store = 'Telefonika';
  protected readonly baseUrl = 'https://telefonika.com';
  protected readonly currency = 'GHS';
  
  protected readonly selectors: Selectors = {
    productGrid: '.products.wrapper.grid.products-grid',
    productItem: '.item.product.product-item',
    title: '.product-item-link',
    price: '[data-price-type="finalPrice"] .price',
    image: '.product-image-photo',
    url: '.product-item-link',
    rating: '.rating-summary',
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
    // Telefonika uses the same search URL structure as CompuGhana (both use Magento)
    const encodedQuery = encodeURIComponent(query.trim());
    return `${this.baseUrl}/catalogsearch/result/?q=${encodedQuery}`;
  }
}

// Create singleton instance
export const telefonikaScraper = new TelefonikaScraper();
