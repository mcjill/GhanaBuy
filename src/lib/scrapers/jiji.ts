import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';
import cheerio from 'cheerio';

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
      const searchUrl = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
      
      console.log(`[JijiScraper] Fetching URL: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Jiji: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const products: Product[] = [];
      const items = $(this.selectors.productItem);
      
      console.log(`[JijiScraper] Found ${items.length} items`);

      items.each((_, element) => {
        try {
          const $element = $(element);
          const title = $element.find(this.selectors.title).text().trim();
          const priceText = $element.find(this.selectors.price).text().trim();
          const price = this.cleanPrice(priceText);
          const imageUrl = $element.find(this.selectors.image).attr('data-src') || 
                          $element.find(this.selectors.image).attr('src');
          const productUrl = $element.find(this.selectors.url).attr('href');

          if (title && price && imageUrl && productUrl) {
            const product: Product = {
              title,
              price,
              currency: this.currency,
              imageUrl: this.normalizeImageUrl(imageUrl),
              productUrl: this.normalizeProductUrl(productUrl),
              store: this.store,
              rating: 0,
              reviews: 0,
              availability: true
            };
            console.log(`[JijiScraper] Found product:`, product);
            products.push(product);
          } else {
            console.log(`[JijiScraper] Skipping product due to missing data:`, {
              title,
              price,
              imageUrl,
              productUrl
            });
          }
        } catch (error) {
          console.error('[JijiScraper] Error processing item:', error);
        }
      });

      console.log(`[JijiScraper] Successfully scraped ${products.length} products`);
      return {
        success: products.length > 0,
        products,
        error: null,
      };
    } catch (error) {
      console.error('[JijiScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
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

  protected cleanPrice(price: string): number {
    // Remove currency symbol and any non-numeric characters except decimal point
    const numericString = price.replace(/[^0-9.]/g, '');
    const parsedPrice = parseFloat(numericString);
    return isNaN(parsedPrice) ? 0 : parsedPrice;
  }
}

// Create singleton instance
export const jijiScraper = new JijiScraper();
