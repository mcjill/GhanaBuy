import type { Product, ScrapingResult, SearchRequest } from './types';
import puppeteer from 'puppeteer';

export class JumiaScraper {
  private readonly baseUrl = 'https://jumia.com.gh';
  private readonly store = 'Jumia';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalog/?q=${encodeURIComponent(query)}`;
  }

  private calculateRelevancyScore(title: string, query: string): number {
    const searchTerms = query.toLowerCase().split(' ');
    const titleTerms = title.toLowerCase().split(' ');
    let score = 0;

    // Exact match bonus (highest weight)
    if (title.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    // Individual term matches with strict checking
    const termMatches = searchTerms.filter(term => 
      titleTerms.some(titleTerm => 
        titleTerm === term || 
        (term.length > 3 && titleTerm.includes(term))
      )
    ).length;
    const termMatchRatio = termMatches / searchTerms.length;
    score += termMatchRatio * 3;

    // Brand name matches
    const commonBrands = ['iphone', 'samsung', 'huawei', 'xiaomi', 'tecno', 'infinix', 'oppo', 'vivo', 'realme'];
    const brandMatches = searchTerms.filter(term =>
      commonBrands.includes(term) && 
      titleTerms.some(titleTerm => titleTerm.includes(term))
    ).length;
    score += brandMatches * 2;

    // Model number matches
    const modelMatches = searchTerms.filter(term =>
      /^\d+$/.test(term) && 
      titleTerms.some(titleTerm => titleTerm === term)
    ).length;
    score += modelMatches * 2;

    // Penalize accessories and non-primary products
    const accessoryIndicators = ['case', 'cover', 'protector', 'charger', 'cable', 'adapter', 'holder'];
    if (accessoryIndicators.some(word => title.toLowerCase().includes(word))) {
      score *= 0.3;
    }

    // Normalize score (0 to 1)
    const normalizedScore = score / 10;
    
    // Return 0 if below minimum threshold
    return normalizedScore >= 0.3 ? normalizedScore : 0;
  }

  private sanitizeTitle(title: string): string {
    // Remove common noise words and standardize spacing
    const noiseWords = ['case', 'cover', 'protector', 'charger', 'cable', 'adapter', 'holder'];
    let sanitized = title.toLowerCase();
    noiseWords.forEach(word => {
      sanitized = sanitized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    return sanitized.replace(/\s+/g, ' ').trim();
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      console.log(`[JumiaScraper] Starting search for: ${request.query}`);
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
      
      // Set default navigation timeout
      page.setDefaultNavigationTimeout(60000);
      
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[JumiaScraper] Searching URL: ${searchUrl}`);

      // Navigate and wait for either the product grid or no results message
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      
      // Wait for either products or no results message
      try {
        await Promise.race([
          page.waitForSelector('article.prd', { timeout: 30000 }),
          page.waitForSelector('.no-results', { timeout: 30000 })
        ]);
      } catch (error) {
        console.log('[JumiaScraper] Timeout waiting for results, checking page content...');
      }

      // Extract products
      const products = await page.evaluate((baseUrl) => {
        const items = document.querySelectorAll('article.prd');
        return Array.from(items).map(item => {
          try {
            const titleElement = item.querySelector('h3.name');
            const priceElement = item.querySelector('div.prc');
            const ratingElement = item.querySelector('div.stars._s');
            const reviewsElement = item.querySelector('div.rev');
            const linkElement = item.querySelector('a.core');
            const imageElement = item.querySelector('img.img');

            const title = titleElement?.textContent?.trim() || '';
            const priceText = priceElement?.textContent?.trim() || '';
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;
            const rating = ratingElement ? parseFloat(ratingElement.getAttribute('data-stars') || '0') : null;
            const reviews = reviewsElement ? parseInt(reviewsElement.textContent?.replace(/[^0-9]/g, '') || '0') : null;
            const productUrl = linkElement?.getAttribute('href') || '';
            const imageUrl = imageElement?.getAttribute('data-src') || imageElement?.getAttribute('src') || '';

            return {
              title,
              price,
              rating,
              reviews,
              productUrl: productUrl.startsWith('http') ? productUrl : `${baseUrl}${productUrl}`,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`
            };
          } catch (error) {
            console.error('[JumiaScraper] Error processing product:', error);
            return null;
          }
        }).filter(Boolean);
      }, this.baseUrl);

      // Process and filter products
      const processedProducts = products
        .map((product: any) => {
          if (!product || !product.title || !product.price) return null;

          const sanitizedTitle = this.sanitizeTitle(product.title);
          const relevancyScore = this.calculateRelevancyScore(product.title, request.query);

          if (relevancyScore === 0) return null;

          return {
            id: `jumia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: product.title,
            price: product.price,
            currency: this.currency,
            productUrl: product.productUrl,
            imageUrl: product.imageUrl,
            store: this.store,
            rating: product.rating,
            reviews: product.reviews,
            availability: true,
            metadata: {
              searchQuery: request.query,
              originalTitle: product.title,
              sanitizedTitle,
              relevancyScore
            }
          };
        })
        .filter((item): item is Product => {
          return item !== null && 
                 typeof item === 'object' &&
                 'id' in item &&
                 'title' in item &&
                 'price' in item &&
                 'currency' in item &&
                 'productUrl' in item &&
                 'imageUrl' in item &&
                 'store' in item;
        });

      return {
        success: true,
        products: processedProducts,
        error: null
      };

    } catch (error) {
      console.error('[JumiaScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Failed to scrape Jumia'
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const jumiaScraper = new JumiaScraper();
