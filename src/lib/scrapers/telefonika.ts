import { Product, ScrapingResult, SearchRequest } from './types';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

export class TelefonikaScraper {
  private readonly baseUrl = 'https://telefonika.com';
  private readonly store = 'Telefonika';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`;
  }

  private calculateRelevancyScore(title: string, query: string): number {
    const searchTerms = query.toLowerCase().split(' ');
    const titleTerms = title.toLowerCase().split(' ');
    let score = 0;

    // Exact match bonus
    if (title.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    // Individual term matches
    const termMatches = searchTerms.filter(term => 
      titleTerms.some(titleTerm => titleTerm === term || titleTerm.includes(term))
    ).length;
    score += (termMatches / searchTerms.length) * 3;

    // Brand name matches
    const commonBrands = ['iphone', 'samsung', 'huawei', 'xiaomi', 'tecno', 'infinix'];
    const brandMatches = searchTerms.filter(term =>
      commonBrands.includes(term) && titleTerms.some(titleTerm => titleTerm.includes(term))
    ).length;
    score += brandMatches * 2;

    // Penalize accessories
    const accessoryIndicators = ['case', 'cover', 'protector', 'charger', 'cable'];
    if (accessoryIndicators.some(word => title.toLowerCase().includes(word))) {
      score *= 0.3;
    }

    return score / 10;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      console.log(`[TelefonikaScraper] Starting search for: ${request.query}`);
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[TelefonikaScraper] Searching URL: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      
      // Wait for either products or no results message with longer timeout
      try {
        await Promise.race([
          page.waitForSelector('.products.elements-grid', { timeout: 45000 }),
          page.waitForSelector('.woocommerce-info', { timeout: 45000 })
        ]);
      } catch (error) {
        console.log('[TelefonikaScraper] Timeout waiting for results, checking page content...');
      }

      // Extract products
      const products = await page.evaluate((store, currency) => {
        const items = document.querySelectorAll('.product-grid-item');
        return Array.from(items).map(item => {
          try {
            const titleElement = item.querySelector('.product-title a, .wd-entities-title a');
            const priceElement = item.querySelector('.price .amount, .price ins .amount, .price > .woocommerce-Price-amount');
            const linkElement = item.querySelector('.product-title a, .wd-entities-title a');
            const imageElement = item.querySelector('.product-image-link img, .attachment-woocommerce_thumbnail');

            const title = titleElement?.textContent?.trim() || '';
            const priceText = priceElement?.textContent?.trim() || '';
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;
            const productUrl = linkElement?.getAttribute('href') || '';
            const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';

            if (!title || !price || !productUrl) {
              console.log('[TelefonikaScraper] Skipping product due to missing data:', { title, price, productUrl });
              return null;
            }

            return {
              title,
              price,
              productUrl,
              imageUrl,
              store,
              currency,
              rating: null,
              reviews: null,
              availability: true
            };
          } catch (error) {
            console.error('[TelefonikaScraper] Error processing product:', error);
            return null;
          }
        }).filter(Boolean);
      }, this.store, this.currency);

      // Filter and process products
      const processedProducts = products
        .map((product: any) => {
          if (!product || !product.title || !product.price) return null;

          const relevancyScore = this.calculateRelevancyScore(product.title, request.query);
          if (relevancyScore < 0.3) return null;

          return {
            id: uuidv4(),
            ...product,
            metadata: {
              searchQuery: request.query,
              relevancyScore
            }
          };
        })
        .filter((product): product is Product => 
          product !== null && 
          typeof product === 'object' &&
          'id' in product &&
          'title' in product &&
          'price' in product
        );

      console.log(`[TelefonikaScraper] Found ${processedProducts.length} products`);
      
      return {
        success: true,
        products: processedProducts,
        error: null
      };

    } catch (error) {
      console.error('[TelefonikaScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const telefonikaScraper = new TelefonikaScraper();
