import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';
import cheerio from 'cheerio';

export class JijiScraper extends BaseScraper {
  protected readonly store = 'Jiji Ghana';
  protected readonly baseUrl = 'https://jiji.com.gh';
  protected readonly currency = 'GHS';
  protected readonly selectors: Selectors = {
    productItem: '.b-list-advert__item-wrapper',
    productTitle: '.qa-advert-title',
    productPrice: '.qa-advert-price',
    productImage: '.b-advert-link-wrapper img',
    productLink: '.b-advert-title-wrapper a',
  };

  async search(query: string): Promise<ScrapingResult> {
    try {
      const searchUrl = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
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

      items.each((_, element) => {
        const $element = $(element);
        const title = $element.find(this.selectors.productTitle).text().trim();
        const priceText = $element.find(this.selectors.productPrice).text().trim();
        const price = this.extractPrice(priceText);
        const imageUrl = $element.find(this.selectors.productImage).attr('data-src') || 
                        $element.find(this.selectors.productImage).attr('src');
        const productUrl = $element.find(this.selectors.productLink).attr('href');

        if (title && price && imageUrl && productUrl) {
          products.push({
            title,
            price,
            currency: this.currency,
            imageUrl: this.normalizeImageUrl(imageUrl),
            productUrl: this.normalizeProductUrl(productUrl),
            store: this.store,
          });
        }
      });

      return {
        success: true,
        products,
        error: null,
      };
    } catch (error) {
      console.error('Error scraping Jiji:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private normalizeImageUrl(url: string): string {
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return url;
  }

  private normalizeProductUrl(url: string): string {
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return url;
  }

  private extractPrice(priceText: string): number {
    const match = priceText.match(/[0-9,.]+/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/,/g, ''));
  }
}

// Create singleton instance
export const jijiScraper = new JijiScraper();
