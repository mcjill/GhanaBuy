import { Product, ScrapingResult } from './types';
import * as cheerio from 'cheerio';
import { retry } from '@/lib/utils/retry';

export interface Selectors {
  productGrid: string;
  productItem: string;
  title: string;
  price: string;
  url: string;
  image: string;
  rating?: string;
  reviews?: string;
}

export abstract class BaseScraper {
  protected abstract readonly baseUrl: string;
  protected abstract readonly selectors: Selectors;
  protected abstract readonly store: string;
  protected readonly currency: string = 'GHS'; // Default currency for Ghanaian stores

  protected abstract cleanPrice(price: string): number;
  
  protected getSearchUrl(query: string): string {
    return `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
  }

  async scrape(query: string): Promise<ScrapingResult> {
    try {
      const searchUrl = this.getSearchUrl(query);
      console.log(`Scraping ${this.store} with URL: ${searchUrl}`);
      
      const response = await retry(() => 
        fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from ${this.store}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const products: Product[] = [];
      const items = $(this.selectors.productItem);

      console.log(`Found ${items.length} items on ${this.store}`);

      if (items.length === 0) {
        console.log(`No products found for query: ${query} on ${this.store}`);
        return { products: [], error: 'No products found' };
      }

      items.each((_, item) => {
        try {
          const $item = $(item);
          const title = $item.find(this.selectors.title).text().trim();
          const priceText = $item.find(this.selectors.price).text().trim();
          const url = $item.find(this.selectors.url).attr('href') || '';
          const image = $item.find(this.selectors.image).attr('src') || $item.find(this.selectors.image).attr('data-src') || '';
          
          let rating = 0;
          let reviews = 0;

          if (this.selectors.rating) {
            const ratingEl = $item.find(this.selectors.rating);
            rating = parseFloat(ratingEl.attr('data-rating') || ratingEl.text().trim() || '0');
          }

          if (this.selectors.reviews) {
            const reviewsEl = $item.find(this.selectors.reviews);
            reviews = parseInt(reviewsEl.text().replace(/[^0-9]/g, '') || '0');
          }

          const price = this.cleanPrice(priceText);
          console.log(`Extracted product from ${this.store}:`, { title, price, url });

          if (title && price > 0) {
            products.push({
              title,
              price,
              currency: this.currency,
              url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
              image: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
              store: this.store,
              rating,
              reviews,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error(`Error extracting product from ${this.store}:`, error);
        }
      });

      const validProducts = products.filter(p => p.title && p.price > 0);
      console.log(`Successfully extracted ${validProducts.length} products from ${this.store}`);

      return {
        products: validProducts,
        source: this.store,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Error scraping ${this.store}:`, error);
      return {
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        source: this.store
      };
    }
  }
}
