import { BaseScraper, Selectors } from './base-scraper';
import type { Product, ScrapingResult } from './types';
import * as cheerio from 'cheerio';

export class JijiScraper extends BaseScraper {
  protected readonly store = 'Jiji Ghana';
  protected readonly baseUrl = 'https://jiji.com.gh';
  protected readonly currency = 'GHS';
  
  protected readonly selectors: Selectors = {
    productGrid: '.b-list-items__wrapper',
    productItem: '.b-list-items__item',
    title: '.qa-advert-title',
    price: '.qa-advert-price',
    image: '.b-list-advert__thumb-image img',
    url: '.b-list-advert__link',
    rating: undefined,
    reviews: undefined
  };

  protected getSearchUrl(query: string): string {
    // Jiji uses a different search URL structure
    const encodedQuery = encodeURIComponent(query.trim());
    return `${this.baseUrl}/search?query=${encodedQuery}`;
  }

  protected cleanPrice(priceText: string): number {
    try {
      // Remove currency symbol, commas, and any non-numeric characters except decimal point
      // Jiji typically shows prices like "GH₵ 1,234" or "₵1,234"
      const cleaned = priceText
        .replace(/[^\d.,]/g, '') // Remove all non-digit characters except . and ,
        .replace(/,/g, ''); // Remove commas
      
      const price = parseFloat(cleaned);
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.error('Error cleaning Jiji price:', error);
      return 0;
    }
  }

  async scrape(query: string): Promise<ScrapingResult> {
    try {
      const searchUrl = this.getSearchUrl(query);
      console.log(`Scraping Jiji with URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Jiji: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const products: Product[] = [];
      const items = $(this.selectors.productItem);

      console.log(`Found ${items.length} items on Jiji`);

      if (items.length === 0) {
        console.log(`No products found on Jiji for query: ${query}`);
        return { products: [], error: 'No products found on Jiji' };
      }

      items.each((_, item) => {
        try {
          const $item = $(item);
          const title = $item.find(this.selectors.title).text().trim();
          const priceText = $item.find(this.selectors.price).text().trim();
          const url = this.baseUrl + $item.find(this.selectors.url).attr('href');
          const image = $item.find(this.selectors.image).attr('data-src') || 
                       $item.find(this.selectors.image).attr('src') || 
                       '/placeholder.png';

          const price = this.cleanPrice(priceText);
          console.log(`Extracted product from Jiji:`, { title, price, url });

          if (title && price > 0) {
            products.push({
              title,
              price,
              currency: this.currency,
              url,
              image: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
              store: this.store,
              rating: 0,
              reviews: 0,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error(`Error extracting product from Jiji:`, error);
        }
      });

      const validProducts = products.filter(p => p.title && p.price > 0);
      console.log(`Successfully extracted ${validProducts.length} products from Jiji`);

      return {
        products: validProducts,
        source: this.store,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Error scraping Jiji:`, error);
      return {
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        source: this.store
      };
    }
  }
}

// Create singleton instance
export const jijiScraper = new JijiScraper();
