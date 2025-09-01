import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product, SearchRequest, ScrapingResult, Scraper } from './types';

function isWithinBudget(price: number, minBudget?: number, maxBudget?: number): boolean {
  if (minBudget !== undefined && price < minBudget) return false;
  if (maxBudget !== undefined && price > maxBudget) return false;
  return true;
}

class JijiHTTPScraper implements Scraper {
  readonly name = 'Jiji';
  readonly baseUrl = 'https://jiji.com.gh';

  cleanPrice(priceText: string): number {
    if (!priceText) return 0;
    const cleaned = priceText.replace(/[GH₵,\s]/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    const { query, minBudget, maxBudget } = request;
    try {
      // Map query to category URL to avoid redirects
      const categoryMap: { [key: string]: string } = {
        'television': 'tv-dvd-equipment',
        'smart tv': 'tv-dvd-equipment',
        'led tv': 'tv-dvd-equipment',
        'oled tv': 'tv-dvd-equipment',
        'qled tv': 'tv-dvd-equipment',
        'tv': 'tv-dvd-equipment',
        'smartphone': 'mobile-phones',
        'mobile phone': 'mobile-phones',
        'phone': 'mobile-phones',
        'mobile': 'mobile-phones', 
        'iphone': 'mobile-phones',
        'samsung phone': 'mobile-phones',
        'laptop': 'computers-laptops',
        'computer': 'computers-laptops',
        'tablet': 'tablets',
        'ipad': 'tablets',
        'headphone': 'headphones',
        'earphone': 'headphones',
        'speaker': 'audio-equipment',
        'bluetooth': 'audio-equipment',
        'camera': 'cameras-camcorders',
        'watch': 'watches',
        'gaming': 'video-games-consoles',
        'console': 'video-games-consoles',
        'keyboard': 'computer-accessories',
        'mouse': 'computer-accessories'
      };

      // Find matching category or use general search
      // Sort keys by length (descending) to prioritize more specific terms
      const sortedKeys = Object.keys(categoryMap).sort((a, b) => b.length - a.length);
      const category = sortedKeys.find(key => 
        query.toLowerCase().includes(key)
      );
      
      const searchUrl = category 
        ? `https://jiji.com.gh/${categoryMap[category]}?query=${encodeURIComponent(query)}`
        : `https://jiji.com.gh/search?query=${encodeURIComponent(query)}`;

      console.log(`[Jiji HTTP] Scraping: ${searchUrl}`);
      console.log(`[Jiji HTTP] Category matched: ${category} -> ${category ? categoryMap[category] : 'none'}`);

      // Make HTTP request with proper headers
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const products: Product[] = [];

      console.log(`[Jiji HTTP] Page title: ${$('title').text()}`);
      console.log(`[Jiji HTTP] Page length: ${response.data.length}`);

      // Use Jiji-specific selectors based on their actual HTML structure
      const productSelectors = [
        '.b-list-advert-base',
        '.qa-advert-list-item',
        '.js-advert-list-item',
        '.b-list-advert__gallery__item',
        '[class*="b-list-advert"]',
        '[class*="advert"]',
        'article'
      ];

      for (const selector of productSelectors) {
        const elements = $(selector);
        console.log(`[Jiji HTTP] Selector "${selector}": ${elements.length} elements`);
        
        if (elements.length > 0) {
          elements.slice(0, 30).each((index, element) => {
            try {
              const $el = $(element);
              const allText = $el.text().trim();
              
              if (allText.length < 10) return;
              
              // Extract title using Jiji-specific selectors
              let title = '';
              const titleSelectors = [
                '.b-list-advert-base__data__title',
                '.b-advert-title-inner',
                '.qa-advert-title',
                'a[href*="/mobile-phones/"]',
                'a[href*="/computers-laptops/"]', 
                'a[href*="/tablets/"]',
                'a[href*="/headphones/"]',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
              ];
              
              for (const titleSel of titleSelectors) {
                const titleText = $el.find(titleSel).first().text().trim();
                if (titleText && titleText.length > 10 && titleText.length < 200 && 
                    !titleText.includes('Quick reply') && 
                    !titleText.includes('Verified ID') &&
                    !titleText.includes('Sort by') &&
                    !titleText.includes('Search results') &&
                    !titleText.includes('GH₵')) {
                  title = titleText;
                  break;
                }
              }
              
              // Fallback: use first meaningful text, but filter noise
              if (!title) {
                const words = allText.split(/\s+/).slice(0, 15).join(' ');
                if (words.length > 10 && 
                    !words.includes('Quick reply') && 
                    !words.includes('Verified ID') &&
                    !words.includes('Sort by') &&
                    !words.includes('Search results')) {
                  title = words;
                }
              }
              
              if (!title || title.length < 10) return;
              
              // Extract price using Jiji-specific selectors first
              let price = 0;
              const priceSelectors = [
                '.b-list-advert-base__data__price',
                '.b-advert-price',
                '.qa-advert-price',
                '.b-list-advert__price',
                '[class*="price"]'
              ];
              
              // Try Jiji-specific price selectors first
              for (const priceSel of priceSelectors) {
                const priceEl = $el.find(priceSel);
                if (priceEl.length) {
                  const priceText = priceEl.text().trim();
                  const priceMatch = priceText.match(/[\d,]+(?:\.\d{2})?/);
                  if (priceMatch) {
                    price = parseFloat(priceMatch[0].replace(/,/g, ''));
                    if (price > 0) break;
                  }
                }
              }
              
              // Fallback: extract from all text
              if (price === 0) {
                const priceMatch = allText.match(/GH[S₵]?\s*[\d,]+(?:\.\d{2})?|[\d,]+(?:\.\d{2})?\s*GH[S₵]?|₵\s*[\d,]+(?:\.\d{2})?/i);
                if (priceMatch) {
                  const numMatch = priceMatch[0].match(/[\d,]+(?:\.\d{2})?/);
                  if (numMatch) {
                    price = parseFloat(numMatch[0].replace(/,/g, ''));
                  }
                }
              }
              
              // Skip products with no price or unrealistic prices
              if (price === 0 || price > 50000) return;
              
              // Extract link using Jiji-specific selectors
              let link = '';
              const linkSelectors = [
                '.b-list-advert-base__data__title a',
                '.b-list-advert-base__img a',
                'a[href*="/mobile-phones/"]',
                'a[href*="/computers-laptops/"]',
                'a[href*="/tablets/"]',
                'a[href*="/headphones/"]',
                'a[href]'
              ];
              
              for (const linkSel of linkSelectors) {
                const linkEl = $el.find(linkSel).first();
                if (linkEl.length) {
                  const href = linkEl.attr('href');
                  if (href && href.includes('.html')) {
                    link = href.startsWith('http') ? href : `https://jiji.com.gh${href}`;
                    break;
                  }
                }
              }
              
              // Extract image using Jiji-specific selectors
              let imageUrl = '';
              const imageSelectors = [
                '.b-list-advert-base__img img',
                '.js-list-advert-base-img',
                '.b-list-advert__img img',
                'img[src*="jijistatic"]',
                'img'
              ];
              
              for (const imgSel of imageSelectors) {
                const imgEl = $el.find(imgSel).first();
                if (imgEl.length) {
                  const src = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy');
                  if (src && !src.includes('placeholder') && !src.includes('loading') && src.includes('jijistatic')) {
                    imageUrl = src.startsWith('http') ? src : `https:${src}`;
                    break;
                  }
                }
              }
              
              // Skip if no valid link found
              if (!link) return;
              
              const product: Product = {
                id: `jiji-${Date.now()}-${index}`,
                title: title,
                price: price,
                currency: 'GHS',
                productUrl: link,
                imageUrl: imageUrl,
                store: 'Jiji',
                availability: true,
                rating: null,
                reviews: null,
                metadata: {
                  scrapedAt: new Date().toISOString(),
                  relevancyScore: 0.5,
                  location: 'Ghana'
                }
              };
              
              products.push(product);
              
            } catch (error) {
              console.log(`[Jiji HTTP] Error processing element:`, error);
            }
          });
          
          if (products.length > 0) {
            console.log(`[Jiji HTTP] Found ${products.length} products with selector: ${selector}`);
            break;
          }
          
          // Early termination if we have enough products
          if (products.length >= 20) {
            console.log(`[Jiji HTTP] Early termination: Found ${products.length} products`);
            break;
          }
        }
      }

      // Apply budget filtering
      const filteredProducts = products.filter(product => 
        isWithinBudget(product.price, minBudget, maxBudget)
      );

      console.log(`[Jiji HTTP] Scraped ${filteredProducts.length} products (${products.length} before budget filter)`);
      
      return {
        success: true,
        products: filteredProducts,
        error: null
      };
    } catch (error) {
      console.error('❌ [Jiji] Scraping failed:', error);
      console.error('❌ [Jiji] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        query,
        url: `https://jiji.com.gh/search?query=${encodeURIComponent(query)}`
      });
      return {
        success: false,
        products: [],
        error: `Failed to scrape Jiji: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const jijiScraper = new JijiHTTPScraper();
