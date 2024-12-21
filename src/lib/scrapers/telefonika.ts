import { Product, ScrapingResult, SearchRequest } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';

export class TelefonikaScraper {
  private readonly store = 'Telefonika' as const;
  private readonly baseUrl = 'https://telefonika.com';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    try {
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[TelefonikaScraper] Starting search for: ${request.query}`);
      
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

      // Telefonika product grid - WooCommerce format
      $('.product.type-product').each((_, element) => {
        const productElement = $(element);
        const link = productElement.find('a.woocommerce-loop-product__link');
        const title = productElement.find('.woocommerce-loop-product__title').text().trim();
        const priceText = productElement.find('.price .amount').text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const productUrl = link.attr('href') || '';
        const imageUrl = productElement.find('img.attachment-woocommerce_thumbnail').attr('src') || '';

        // Check if title contains any of the search terms
        const searchTerms = request.query.toLowerCase().split(/\s+/);
        const titleLower = title.toLowerCase();
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
            productUrl: productUrl.startsWith('http') ? productUrl : `${this.baseUrl}${productUrl}`,
            imageUrl: imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`,
            store: this.store,
            rating: null,
            reviews: null
          });
        }
      });

      console.log(`[TelefonikaScraper] Found ${products.length} products`);
      return {
        success: true,
        products: products.sort((a, b) => a.price - b.price),
        error: null
      };
    } catch (error) {
      console.error('Error scraping Telefonika:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const telefonikaScraper = new TelefonikaScraper();
