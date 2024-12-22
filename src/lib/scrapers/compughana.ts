import { Product, ScrapingResult, SearchRequest } from './types';
import * as cheerio from 'cheerio';

export class CompuGhanaScraper {
  private readonly baseUrl = 'https://compughana.com';
  private readonly store = 'CompuGhana';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    try {
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[CompuGhanaScraper] Starting search for: ${request.query}`);
      console.log(`[CompuGhanaScraper] Search URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`[CompuGhanaScraper] HTTP error: ${response.status}`);
        return {
          success: false,
          products: [],
          error: `HTTP error: ${response.status}`
        };
      }

      const html = await response.text();
      console.log(`[CompuGhanaScraper] Received HTML response length: ${html.length}`);
      
      const $ = cheerio.load(html);
      const products: Product[] = [];

      // Debug: Log the HTML structure
      console.log('[CompuGhanaScraper] Page title:', $('title').text());
      
      // Try different selectors
      const productElements = $('.product-items .product-item');
      console.log(`[CompuGhanaScraper] Found ${productElements.length} products with .product-items .product-item`);

      if (productElements.length === 0) {
        // Try alternative selector
        const altProductElements = $('.item.product.product-item');
        console.log(`[CompuGhanaScraper] Found ${altProductElements.length} products with .item.product.product-item`);
      }

      // Process each product
      productElements.each((_, element) => {
        try {
          const productElement = $(element);
          
          // Extract product details with detailed logging
          const titleElement = productElement.find('.product-item-link');
          const title = titleElement.text().trim();
          console.log('[CompuGhanaScraper] Found title:', title);

          const priceElement = productElement.find('.price');
          const priceText = priceElement.first().text().trim();
          const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
          console.log('[CompuGhanaScraper] Found price:', { raw: priceText, parsed: price });

          const productUrl = titleElement.attr('href');
          console.log('[CompuGhanaScraper] Found URL:', productUrl);

          const imageElement = productElement.find('.product-image-photo');
          let imageUrl = imageElement.attr('src') || imageElement.attr('data-src') || '';
          console.log('[CompuGhanaScraper] Found image:', imageUrl);

          if (title && price > 0 && productUrl) {
            products.push({
              id: `compughana-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency: this.currency,
              productUrl,
              imageUrl,
              store: this.store,
              rating: null,
              reviews: null
            });
            console.log('[CompuGhanaScraper] Successfully added product:', title);
          }
        } catch (error) {
          console.error('[CompuGhanaScraper] Error processing product:', error);
        }
      });

      console.log(`[CompuGhanaScraper] Successfully scraped ${products.length} products`);
      return {
        success: true,
        products,
        error: null
      };

    } catch (error) {
      console.error('[CompuGhanaScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const compuGhanaScraper = new CompuGhanaScraper();
