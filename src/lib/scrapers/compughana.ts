import { Product, ScrapingResult, SearchRequest } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';

export class CompuGhanaScraper {
  private readonly store = 'CompuGhana' as const;
  private readonly baseUrl = 'https://compughana.com';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    try {
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[CompuGhanaScraper] Starting search for: ${request.query}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const products: Product[] = [];

      // CompuGhana product grid
      $('.item.product.product-item').each((_, element) => {
        const productElement = $(element);
        const link = productElement.find('.product-item-link');
        const title = link.text().trim();
        const priceText = productElement.find('.price').text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const productUrl = link.attr('href') || '';
        
        // Fix image URL extraction
        const imageElement = productElement.find('.product-image-photo');
        let imageUrl = imageElement.attr('src') || imageElement.attr('data-src') || '';
        
        // If we got a lazy-loaded URL, clean it up
        if (imageUrl.includes('/placeholder/')) {
          imageUrl = imageElement.attr('data-src') || '';
        }

        // Ensure image URL is absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${this.baseUrl}${imageUrl}`;
        }

        // Improved relevance check
        const searchTerms = request.query.toLowerCase().split(/\s+/);
        const titleLower = title.toLowerCase();
        
        // Check if all search terms are present in the title
        const allTermsPresent = searchTerms.every(term => {
          // Special handling for model numbers (e.g., "15" in "iPhone 15")
          if (/^\d+$/.test(term)) {
            return titleLower.includes(term) && 
              (titleLower.includes('iphone') || titleLower.includes('samsung') || titleLower.includes('pixel'));
          }
          return titleLower.includes(term);
        });

        if (title && price > 0 && allTermsPresent) {
          products.push({
            id: uuidv4(),
            title,
            price,
            currency: this.currency,
            productUrl,
            imageUrl,
            store: this.store,
            rating: null,
            reviews: null
          });
        }
      });

      console.log(`[CompuGhanaScraper] Found ${products.length} products`);
      return {
        success: true,
        products: products.sort((a, b) => a.price - b.price),
        error: null
      };
    } catch (error) {
      console.error('Error scraping CompuGhana:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const compuGhanaScraper = new CompuGhanaScraper();
