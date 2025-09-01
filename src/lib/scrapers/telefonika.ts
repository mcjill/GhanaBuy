import { Product, ScrapingResult } from './types';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class TelefonikaPlaywrightScraper {
  private readonly baseUrl = 'https://telefonika.com';
  private readonly store = 'Telefonika';

  private buildSearchUrl(query: string): string {
    return `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`;
  }

  private cleanPrice(priceText: string): number {
    if (!priceText) return 0;
    const cleanedPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '');
    return parseFloat(cleanedPrice) || 0;
  }

  private calculateRelevancyScore(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(' ').filter(term => term.length > 2);
    
    let score = 0;
    let matchedTerms = 0;
    
    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        matchedTerms++;
        score += 1;
      }
    }
    
    // Exact match bonus
    if (titleLower.includes(queryLower)) {
      score += 2;
    }
    
    // Brand match bonus
    const brands = ['samsung', 'apple', 'lg', 'sony', 'hp', 'tecno', 'oppo', 'huawei'];
    for (const brand of brands) {
      if (queryTerms.includes(brand) && titleLower.includes(brand)) {
        score += 1;
      }
    }
    
    return Math.min(1, score / (queryTerms.length + 2));
  }

  async scrape({ query, minBudget, maxBudget }: { query: string; minBudget?: number; maxBudget?: number }): Promise<ScrapingResult> {
    try {
      console.log(`[Telefonika] Scraping for query: ${query}`);
      const searchUrl = this.buildSearchUrl(query);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const products: Product[] = [];

      // Try multiple product selectors
      const productSelectors = [
        '.product',
        '.woocommerce-loop-product__title',
        '.product-item',
        'li.product',
        '.product-wrapper'
      ];

      let productElements = $();
      
      for (const selector of productSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          productElements = elements;
          console.log(`[Telefonika] Found ${elements.length} products with selector: ${selector}`);
          break;
        }
      }

      if (productElements.length === 0) {
        console.log('[Telefonika] No products found');
        return { success: true, products: [], error: null };
      }

      productElements.each((index, element) => {
        try {
          const $el = $(element);
          
          // Extract title
          const titleSelectors = [
            '.woocommerce-loop-product__title',
            '.product-title',
            'h2 a',
            'h3 a',
            '.product-name',
            'a[href*="/product/"]'
          ];
          
          let title = '';
          for (const selector of titleSelectors) {
            title = $el.find(selector).first().text().trim();
            if (title) break;
          }
          
          if (!title) return;

          // Extract price
          const priceSelectors = [
            '.price .amount',
            '.woocommerce-Price-amount',
            '.price',
            '.product-price',
            '.price-current'
          ];
          
          let priceText = '';
          for (const selector of priceSelectors) {
            priceText = $el.find(selector).first().text().trim();
            if (priceText) break;
          }
          
          const price = this.cleanPrice(priceText);
          if (price === 0) return;

          // Budget filtering
          if (minBudget && price < minBudget) return;
          if (maxBudget && price > maxBudget) return;

          // Extract product URL
          const linkSelectors = [
            'a[href*="/product/"]',
            '.woocommerce-loop-product__title a',
            '.product-title a',
            'h2 a',
            'h3 a'
          ];
          
          let link = '';
          for (const selector of linkSelectors) {
            link = $el.find(selector).first().attr('href') || '';
            if (link && link.includes('/product/')) break;
          }
          
          const fullLink = link.startsWith('http') ? link : `${this.baseUrl}${link}`;

          // Extract image
          const imgSelectors = [
            'img',
            '.product-image img',
            '.woocommerce-loop-product__link img'
          ];
          
          let image = '';
          for (const selector of imgSelectors) {
            const imgEl = $el.find(selector).first();
            image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy') || '';
            if (image && !image.includes('placeholder')) break;
          }
          
          const fullImage = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

          // Calculate relevancy score
          const relevancyScore = this.calculateRelevancyScore(title, query);

          const product: Product = {
            id: `telefonika-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            price: price,
            currency: 'GHS',
            productUrl: fullLink,
            imageUrl: fullImage,
            store: 'Telefonika',
            rating: null,
            reviews: null,
            availability: true,
            metadata: {
              relevancyScore,
              source: 'telefonika-http'
            }
          };

          products.push(product);
        } catch (error) {
          console.error('[Telefonika] Error processing product:', error);
        }
      });

      console.log(`[Telefonika] Successfully scraped ${products.length} products`);
      return {
        success: true,
        products: products,
        error: null
      };

    } catch (error) {
      console.error('[Telefonika] Scraping failed:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const telefonikaScraper = new TelefonikaPlaywrightScraper();
