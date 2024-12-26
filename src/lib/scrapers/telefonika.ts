import puppeteer, { Browser, Page } from 'puppeteer';
import { Product, Scraper, SearchRequest, ScrapingResult } from './types';

interface RawProduct {
  title: string;
  price: number;
  priceFormatted: string;
  productUrl: string;
  imageUrl: string;
}

export class TelefonikaScraper implements Scraper {
  readonly name = 'Telefonika';
  readonly baseUrl = 'https://telefonika.com';
  private readonly currency = 'GHS';
  private readonly maxRetries = 3;
  private readonly navigationTimeout = 60000; // Increased to 60s

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async configurePage(page: Page): Promise<void> {
    await page.setDefaultNavigationTimeout(this.navigationTimeout);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    });
  }

  protected calculateRelevancyScore(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    const matchedWords = queryWords.filter(word => titleLower.includes(word));
    const score = matchedWords.length / queryWords.length;

    // Penalize if it's not the right product category
    if (!titleLower.includes('iphone') && queryWords.includes('iphone')) {
      return score * 0.1; // Heavy penalty for non-iPhone products when searching for iPhone
    }

    // Penalize if it's an accessory
    if (titleLower.includes('case') || titleLower.includes('screen') || titleLower.includes('protector')) {
      return score * 0.3;
    }

    return score;
  }

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`;
  }

  private async getSearchResults(page: Page, minBudget: number, maxBudget: number): Promise<RawProduct[]> {
    // Wait for either products or no results message with longer timeout
    await Promise.race([
      page.waitForSelector('.products.wd-products, .products.elements-grid', { timeout: this.navigationTimeout }),
      page.waitForSelector('.woocommerce-info, .no-products-found, .no-results', { timeout: this.navigationTimeout })
    ]);

    // Get all products
    const rawProducts = await page.evaluate((minBudget, maxBudget) => {
      const items = document.querySelectorAll('.products.wd-products .product-grid-item, .product.type-product');
      console.log(`[TelefonikaScraper Browser] Found ${items.length} product items`);
      
      return Array.from(items).map(item => {
        try {
          const titleEl = item.querySelector('.wd-entities-title, .product-title');
          const priceEl = item.querySelector('.price .woocommerce-Price-amount');
          const linkEl = item.querySelector('a.product-image-link');
          const imgEl = item.querySelector('img');

          if (!titleEl || !priceEl || !linkEl) {
            console.log('[TelefonikaScraper Browser] Missing required elements');
            return null;
          }

          const title = titleEl.textContent?.trim() || '';
          const priceText = priceEl.textContent?.replace(/[^0-9.]/g, '') || '';
          const price = parseFloat(priceText);
          const productUrl = linkEl.href;
          const imageUrl = imgEl?.getAttribute('data-src') || imgEl?.src || '';

          console.log('[TelefonikaScraper Browser] Processing product:', {
            title: title.substring(0, 50),
            price,
            hasUrl: !!productUrl,
            hasImage: !!imageUrl
          });

          if (!title || !price || !productUrl) return null;
          if (minBudget && price < minBudget) return null;
          if (maxBudget && price > maxBudget) return null;

          return {
            title,
            price,
            priceFormatted: priceEl.textContent?.trim() || '',
            productUrl,
            imageUrl: imageUrl || '/placeholder.png'
          };
        } catch (error) {
          console.error('[TelefonikaScraper Browser] Error processing item:', error);
          return null;
        }
      }).filter(Boolean);
    }, minBudget, maxBudget);

    console.log(`[TelefonikaScraper] Found ${rawProducts.length} valid products`);
    return rawProducts;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    const { query, minBudget, maxBudget } = request;
    let browser: Browser | null = null;
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
        browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        });

        const page = await browser.newPage();
        await this.configurePage(page);

        const searchUrl = this.getSearchUrl(query);
        console.log(`[TelefonikaScraper] Accessing search URL: ${searchUrl}`);

        const response = await page.goto(searchUrl, { 
          waitUntil: 'networkidle0',
          timeout: this.navigationTimeout 
        });

        if (!response?.ok()) {
          throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        // Add a small delay to ensure dynamic content is loaded
        await this.delay(2000);

        const rawProducts = await this.getSearchResults(page, minBudget, maxBudget);
        
        await browser.close();
        browser = null;

        if (rawProducts.length === 0) {
          console.log('[TelefonikaScraper] No products found');
          return { success: true, products: [], error: null };
        }

        // Process and filter products
        const products = rawProducts
          .map(item => ({
            id: `telefonika-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            price: item.price,
            currency: this.currency,
            productUrl: item.productUrl,
            imageUrl: item.imageUrl,
            store: this.name,
            rating: null,
            reviews: null,
            availability: true,
            metadata: {
              originalPrice: item.priceFormatted,
              relevancyScore: this.calculateRelevancyScore(item.title, query)
            }
          }))
          .filter(product => {
            const score = product.metadata.relevancyScore;
            return score >= 0.5; // Only keep products with at least 50% relevancy
          })
          .sort((a, b) => (b.metadata.relevancyScore || 0) - (a.metadata.relevancyScore || 0));

        console.log(`[TelefonikaScraper] Successfully processed ${products.length} products`);
        return { success: true, products, error: null };

      } catch (error) {
        console.error(`[TelefonikaScraper] Error during attempt ${retryCount + 1}:`, error);
        if (browser) {
          await browser.close();
          browser = null;
        }
        
        retryCount++;
        if (retryCount < this.maxRetries) {
          console.log(`[TelefonikaScraper] Retrying... (${retryCount}/${this.maxRetries})`);
          await this.delay(2000 * retryCount); // Exponential backoff
        }
      }
    }

    return { 
      success: false, 
      products: [], 
      error: `Failed after ${this.maxRetries} attempts` 
    };
  }
}

export const telefonikaScraper = new TelefonikaScraper();
