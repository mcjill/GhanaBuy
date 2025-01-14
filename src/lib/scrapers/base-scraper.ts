import { Product, ScrapingResult, SearchRequest } from './types';
import * as cheerio from 'cheerio';
import { retry } from '../utils/retry';
import { v4 as uuidv4 } from 'uuid';

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
  protected readonly currency: string = 'GHS';
  protected readonly userAgent: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  protected abstract cleanPrice(price: string): number;
  
  protected getSearchUrl(query: string): string {
    return `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
  }

  protected getHeaders(): HeadersInit {
    return {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  protected filterByBudgetRange(products: Product[], minBudget?: number, maxBudget?: number): Product[] {
    return products.filter(product => {
      const price = product.price;
      if (!price) return false;
      
      // Check minimum budget if specified
      if (minBudget !== undefined && price < minBudget) {
        return false;
      }
      
      // Check maximum budget if specified
      if (maxBudget !== undefined && price > maxBudget) {
        return false;
      }
      
      return true;
    });
  }

  protected processProducts(products: Product[], request: SearchRequest): Product[] {
    let processedProducts = products
      .map(product => ({
        ...product,
        metadata: {
          ...product.metadata,
          relevancyScore: this.calculateRelevancyScore(product.title, request.query)
        }
      }))
      .filter(product => {
        const score = product.metadata?.relevancyScore ?? 0;
        return score > 0;
      })
      .sort((a, b) => (b.metadata?.relevancyScore ?? 0) - (a.metadata?.relevancyScore ?? 0));

    // Apply budget range filter if specified
    processedProducts = this.filterByBudgetRange(
      processedProducts, 
      request.minBudget, 
      request.maxBudget
    );

    return processedProducts;
  }

  protected calculateRelevancyScore(title: string, query: string): number {
    // TO DO: implement relevancy score calculation
    return 1;
  }

  async scrape(query: string, request: SearchRequest): Promise<ScrapingResult> {
    try {
      const searchUrl = this.getSearchUrl(query);
      console.log(`Scraping ${this.store} with URL: ${searchUrl}`);
      
      const response = await retry(
        async () => {
          const res = await fetch(searchUrl, {
            headers: this.getHeaders(),
            cache: 'no-store',
            credentials: 'omit',
            mode: 'cors',
            referrerPolicy: 'no-referrer'
          });
          
          if (!res.ok) {
            console.error(`Failed to fetch from ${this.store}:`, {
              status: res.status,
              statusText: res.statusText,
              url: searchUrl
            });
            throw new Error(`Failed to fetch from ${this.store}: ${res.statusText}`);
          }
          
          return res;
        },
        {
          maxAttempts: 3,
          delayMs: 1000,
          backoffFactor: 2,
          shouldRetry: (error) => {
            console.log(`Retrying ${this.store} scrape after error:`, error);
            return true;
          }
        }
      );

      const html = await response.text();
      const $ = cheerio.load(html);

      const products: Product[] = [];
      const items = $(this.selectors.productItem);

      console.log(`Found ${items.length} items on ${this.store}`);

      if (items.length === 0) {
        console.log(`No products found for query: ${query} on ${this.store}`);
        return { products: [], error: 'No products found', success: false };
      }

      items.each((_, item) => {
        try {
          const $item = $(item);
          const title = $item.find(this.selectors.title).text().trim();
          const priceText = $item.find(this.selectors.price).text().trim();
          const url = $item.find(this.selectors.url).attr('href') || '';
          const image = $item.find(this.selectors.image).attr('src') || 
                       $item.find(this.selectors.image).attr('data-src') || '';
          
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

          if (title && price > 0) {
            products.push({
              id: uuidv4(),
              title,
              price,
              currency: this.currency,
              productUrl: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
              imageUrl: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
              store: this.store,
              rating,
              reviews,
              availability: true,
              metadata: {}
            });
          }
        } catch (error) {
          console.error(`Error extracting product from ${this.store}:`, error);
        }
      });

      const processedProducts = this.processProducts(products, request);
      console.log(`Found ${processedProducts.length} valid products from ${this.store}`);

      return {
        success: processedProducts.length > 0,
        products: processedProducts,
        error: null
      };
    } catch (error) {
      console.error(`Error scraping ${this.store}:`, error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
