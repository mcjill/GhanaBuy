import { Product, ScrapingResult, SearchRequest } from './types';
import * as cheerio from 'cheerio';

export class CompuGhanaScraper {
  private readonly baseUrl = 'https://compughana.com';
  private readonly store = 'CompuGhana';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalogsearch/result/?q=${encodeURIComponent(query)}`;
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
        // Check for exact term match or term as part of a word (e.g., "phone" in "iPhone")
        titleTerm === term || 
        (term.length > 3 && titleTerm.includes(term)) // Only allow partial matches for terms > 3 chars
      )
    ).length;

    // Calculate term match ratio (0 to 1)
    const termMatchRatio = termMatches / searchTerms.length;
    score += termMatchRatio * 3;

    // Brand name matches (specific to phones and electronics)
    const commonBrands = ['iphone', 'apple', 'samsung', 'huawei', 'xiaomi', 'oppo', 'tecno', 'infinix'];
    const brandMatches = searchTerms.filter(term =>
      commonBrands.includes(term) && 
      titleTerms.some(titleTerm => titleTerm.includes(term))
    ).length;
    score += brandMatches * 2;

    // Model number matches (e.g., "13", "14" in "iPhone 13")
    const modelMatches = searchTerms.filter(term =>
      /^\d+$/.test(term) && // Check if term is a number
      titleTerms.some(titleTerm => titleTerm === term)
    ).length;
    score += modelMatches * 2;

    // Penalize irrelevant categories
    const irrelevantTerms = ['case', 'cover', 'screen', 'protector', 'charger', 'cable', 'adapter'];
    const hasIrrelevantTerms = titleTerms.some(term => irrelevantTerms.includes(term));
    if (hasIrrelevantTerms) {
      score *= 0.5;
    }

    // Normalize score to be between 0 and 1
    const normalizedScore = score / (10 + (searchTerms.length * 2));
    
    // Set minimum threshold for relevancy
    return normalizedScore >= 0.3 ? normalizedScore : 0;
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

          // Check stock status
          const availability = !productElement.find('.stock.unavailable').length;

          // Calculate relevancy score
          const relevancyScore = this.calculateRelevancyScore(title, request.query);
          console.log('[CompuGhanaScraper] Relevancy score:', { title, score: relevancyScore });

          // Only add products with non-zero relevancy scores
          if (title && price > 0 && productUrl && relevancyScore > 0) {
            products.push({
              id: `compughana-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency: this.currency,
              productUrl,
              imageUrl,
              store: this.store,
              rating: null,
              reviews: null,
              availability,
              metadata: {
                searchQuery: request.query,
                originalTitle: title,
                relevancyScore
              }
            });
            console.log('[CompuGhanaScraper] Successfully added product:', title);
          } else {
            console.log('[CompuGhanaScraper] Skipped irrelevant product:', title);
          }
        } catch (error) {
          console.error('[CompuGhanaScraper] Error processing product:', error);
        }
      });

      // Sort products by relevancy score
      const sortedProducts = products.sort((a, b) => {
        const scoreA = a.metadata?.relevancyScore || 0;
        const scoreB = b.metadata?.relevancyScore || 0;
        return scoreB - scoreA;
      });

      console.log(`[CompuGhanaScraper] Successfully scraped ${sortedProducts.length} relevant products out of ${productElements.length} total`);
      
      // Log top 3 most relevant products
      if (sortedProducts.length > 0) {
        console.log('[CompuGhanaScraper] Top 3 most relevant products:');
        sortedProducts.slice(0, 3).forEach((product, index) => {
          console.log(`${index + 1}. "${product.title}" (Score: ${product.metadata?.relevancyScore})`);
        });
      }

      return {
        success: true,
        products: sortedProducts,
        error: null
      };

    } catch (error) {
      console.error('[CompuGhanaScraper] Error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const compuGhanaScraper = new CompuGhanaScraper();
