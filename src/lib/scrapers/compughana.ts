import { BaseScraper } from './base-scraper';
import type { Product, ScrapingResult, SearchRequest } from './types';
import * as cheerio from 'cheerio';

export class CompuGhanaScraper extends BaseScraper {
  protected readonly baseUrl = 'https://compughana.com';
  protected readonly store = 'CompuGhana';
  protected readonly selectors = {
    productGrid: '.products.wrapper.grid',
    productItem: '.item.product.product-item',
    title: '.product.name.product-item-name a',
    price: '.price',
    url: '.product.name.product-item-name a',
    image: '.product-image-photo'
  };

  protected cleanPrice(price: string): number {
    // Remove GH₵, ₵, commas, and other non-numeric characters
    const cleaned = price.replace(/[GH₵,\s]/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private buildSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `${this.baseUrl}/catalogsearch/result/?q=${encodedQuery}`;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    try {
      const { query, minBudget, maxBudget } = request;
      const searchUrl = this.buildSearchUrl(query);
      
      console.log(`[CompuGhana] Scraping: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const products: Product[] = [];

      $(this.selectors.productItem).each((index, element) => {
        try {
          const $element = $(element);
          
          const titleElement = $element.find(this.selectors.title);
          const title = titleElement.text().trim();
          
          // Try multiple price selectors for Magento
          let priceText = '';
          const priceSelectors = ['.price', '.regular-price', '.special-price', '.price-box .price'];
          for (const selector of priceSelectors) {
            const priceEl = $element.find(selector);
            if (priceEl.length) {
              priceText = priceEl.first().text().trim();
              break;
            }
          }
          
          const price = this.cleanPrice(priceText);
          
          const urlElement = $element.find(this.selectors.url);
          const productUrl = urlElement.attr('href') || '';
          
          const imageElement = $element.find(this.selectors.image);
          const imageUrl = imageElement.attr('src') || imageElement.attr('data-src') || '';

          // Skip if essential data is missing
          if (!title || !price || price <= 0) {
            console.log(`[CompuGhana] Skipping product - missing data:`, { title, price, priceText });
            return;
          }

          // Apply budget filter if specified
          if (minBudget && price < minBudget) return;
          if (maxBudget && price > maxBudget) return;

          const product: Product = {
            id: `compughana-${Date.now()}-${index}`,
            title,
            price,
            currency: 'GHS',
            productUrl,
            imageUrl,
            store: this.store,
            rating: null,
            reviews: null,
            availability: true,
            metadata: {
              scrapedAt: new Date().toISOString(),
              relevancyScore: 0.5 // Will be calculated later by the API
            }
          };

          products.push(product);
        } catch (error) {
          console.error(`[CompuGhana] Error processing product ${index}:`, error);
        }
      });

      console.log(`[CompuGhana] Found ${products.length} products for query: ${query}`);
      
      return {
        success: true,
        products,
        error: null
      };

    } catch (error) {
      console.error('[CompuGhana] Scraping error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const compuGhanaScraper = new CompuGhanaScraper();
