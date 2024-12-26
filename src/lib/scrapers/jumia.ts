import type { Product, ScrapingResult, SearchRequest } from './types';
import puppeteer from 'puppeteer';

export class JumiaScraper {
  private readonly baseUrl: string = 'https://www.jumia.com.gh';
  private readonly store: string = 'Jumia';
  private readonly currency: string = 'GHS';
  private lastQuery: string | null = null;

  private getSearchUrl(query: string, minBudget?: number, maxBudget?: number): string {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    
    if (minBudget && maxBudget) {
      searchParams.append('price', `${minBudget}-${maxBudget}`);
    }
    
    return `${this.baseUrl}/catalog/?${searchParams.toString()}#catalog-listing`;
  }

  private calculateRelevancyScore(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ');
    const matchedWords = queryWords.filter(word => titleLower.includes(word));
    let score = matchedWords.length / queryWords.length;

    // Penalize if it's not a TV when searching for TV
    if (queryLower.includes('tv') && !titleLower.includes('tv')) {
      return score * 0.1; // Heavy penalty for non-TV products
    }

    // Penalize TV accessories and stands
    if (titleLower.includes('stand') || 
        titleLower.includes('mount') || 
        titleLower.includes('bracket') || 
        titleLower.includes('remote') ||
        titleLower.includes('legs') ||
        titleLower.includes('base')) {
      return score * 0.2;
    }

    // Boost exact brand matches
    if (queryLower.includes('samsung') && titleLower.includes('samsung')) {
      score *= 1.2;
    }
    if (queryLower.includes('lg') && titleLower.includes('lg')) {
      score *= 1.2;
    }
    if (queryLower.includes('tcl') && titleLower.includes('tcl')) {
      score *= 1.2;
    }

    // Boost if the model series matches (e.g., "UA32" for Samsung)
    if (queryLower.includes('samsung') && titleLower.match(/ua\d{2}/i)) {
      score *= 1.1;
    }

    // Cap the final score at 1.0
    return Math.min(1.0, score);
  }

  private async extractProducts(page: puppeteer.Page): Promise<Product[]> {
    try {
      // Add a delay to ensure dynamic content is loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const products = await this.getSearchResults(page);
      console.log(`[JumiaScraper] Found ${products.length} products before filtering`);

      // Filter and sort products by relevancy
      const filteredProducts = products
        .map(product => ({
          ...product,
          metadata: {
            ...product.metadata,
            relevancyScore: this.calculateRelevancyScore(product.title, this.lastQuery || '')
          }
        }))
        .filter(product => {
          const score = product.metadata.relevancyScore || 0;
          // Keep products with at least 50% relevancy
          return score >= 0.5;
        })
        .sort((a, b) => (b.metadata.relevancyScore || 0) - (a.metadata.relevancyScore || 0));

      console.log(`[JumiaScraper] Found ${filteredProducts.length} products after filtering`);

      return filteredProducts;
    } catch (error) {
      console.error('[JumiaScraper] Error extracting products:', error);
      return [];
    }
  }

  private async getSearchResults(page: puppeteer.Page): Promise<Product[]> {
    try {
      // Wait for product grid
      await page.waitForSelector('article.prd._fb.col.c-prd');
      
      // Get all products
      const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('article.prd._fb.col.c-prd'));
        console.log('Raw items found:', items.length);
        
        return items.map(item => {
          try {
            const titleEl = item.querySelector('h3.name');
            const priceEl = item.querySelector('div.prc');
            const linkEl = item.querySelector('a.core');
            const imgEl = item.querySelector('img.img');
            
            if (!titleEl || !priceEl || !linkEl) {
              console.log('Missing element:', { titleEl: !!titleEl, priceEl: !!priceEl, linkEl: !!linkEl });
              return null;
            }

            const title = titleEl.textContent?.trim() || '';
            const priceText = priceEl.textContent?.trim() || '';
            const productUrl = linkEl.getAttribute('href') || '';
            const imageUrl = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '';

            // Extract price number
            const priceMatch = priceText.match(/[\d,]+/);
            if (!priceMatch) {
              console.log('No price match for:', priceText);
              return null;
            }

            const price = parseFloat(priceMatch[0].replace(/,/g, ''));
            if (isNaN(price)) {
              console.log('Invalid price:', price);
              return null;
            }

            console.log('Found product:', { title, price, priceText });
            return {
              id: `jumia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              productUrl: productUrl.startsWith('http') ? productUrl : `https://www.jumia.com.gh${productUrl}`,
              imageUrl,
              currency: 'GHS',
              store: 'Jumia',
              rating: null,
              reviews: null,
              availability: true,
              metadata: {}
            };
          } catch (error) {
            console.error('Error processing product:', error);
            return null;
          }
        }).filter(Boolean);
      });

      console.log('[JumiaScraper] Raw products:', products);
      return products;
    } catch (error) {
      console.error('[JumiaScraper] Error getting search results:', error);
      return [];
    }
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    const { query, minBudget, maxBudget } = request;
    this.lastQuery = query;
    let browser = null;

    try {
      console.log(`[JumiaScraper] Starting search for: ${query}`);
      const searchUrl = this.getSearchUrl(query, minBudget, maxBudget);
      console.log(`[JumiaScraper] Accessing URL: ${searchUrl}`);

      browser = await puppeteer.launch({
        headless: "new",
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
      
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Set longer timeout for navigation and wait for network to be idle
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 60000 
      });

      // Wait for the page to fully load
      await page.waitForSelector('#catalog-listing', { timeout: 30000 });

      // Get the page content for debugging
      const content = await page.content();
      console.log(`[JumiaScraper] Page content length: ${content.length}`);

      const products = await this.extractProducts(page);
      console.log(`[JumiaScraper] Found ${products.length} products`);

      await browser.close();
      return { success: true, products };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error('[JumiaScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
}

export const jumiaScraper = new JumiaScraper();
