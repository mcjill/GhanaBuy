import type { Product, ScrapingResult, SearchRequest } from '../lib/scrapers/types';
import * as cheerio from 'cheerio';
import { retry } from '../lib/utils/retry';
import { v4 as uuidv4 } from 'uuid';

const STORE_NAMES = ['Jiji Ghana', 'CompuGhana', 'Jumia', 'Telefonika', 'Amazon'] as const;
type StoreName = typeof STORE_NAMES[number];

export async function scrapeAllSources(query: string, minBudget?: number, maxBudget?: number): Promise<ScrapingResult> {
  try {
    console.log(`[Scrapers] Starting to scrape all sources for query: ${query}`);
    console.log(`[Scrapers] Price range: ${minBudget || 0} - ${maxBudget || 'unlimited'} GHS`);
    
    const results = await Promise.allSettled([
      scrapeJiji({ query, minBudget, maxBudget }),      // Add Jiji first as it's prioritized
      scrapeCompuGhana({ query, minBudget, maxBudget }),
      scrapeJumia({ query, minBudget, maxBudget }),
      scrapeTelefonika({ query, minBudget, maxBudget }),
      scrapeAmazon({ query, minBudget, maxBudget }),
    ]);

    const products: Product[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const source = result.value;
        if (source.products && source.products.length > 0) {
          console.log(`[Scrapers] Successfully scraped ${source.products.length} products from ${STORE_NAMES[index]}`);
          products.push(...source.products);
        } else {
          console.log(`[Scrapers] No products found from ${STORE_NAMES[index]}`);
        }
        if (source.error) {
          errors.push(`${STORE_NAMES[index]}: ${source.error}`);
        }
      } else {
        console.error(`[Scrapers] Failed to scrape ${STORE_NAMES[index]}:`, result.reason);
        errors.push(`${STORE_NAMES[index]}: ${result.reason.toString()}`);
      }
    });

    // Sort products by price
    products.sort((a, b) => a.price - b.price);

    console.log(`[Scrapers] Total products found across all sources: ${products.length}`);
    
    return {
      success: products.length > 0,
      products,
      error: errors.length > 0 ? errors.join('; ') : null
    };
  } catch (error) {
    console.error('[Scrapers] Error in scrapeAllSources:', error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function scrapeJumia({ query, minBudget, maxBudget }: SearchRequest): Promise<ScrapingResult> {
  try {
    const searchUrl = `https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`;
    console.log('Jumia search URL:', searchUrl);

    const response = await retry(() =>
      fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
        redirect: 'follow'
      })
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from Jumia: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    // Log the HTML for debugging
    console.log('Jumia HTML:', html.substring(0, 500));

    $('article.prd').each((_, element) => {
      try {
        const title = $(element).find('[data-name]').attr('data-name')?.trim() || '';
        const priceText = $(element).find('div.prc').text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const productUrl = 'https://www.jumia.com.gh' + ($(element).find('a.core').attr('href') || '');
        const imageUrl = $(element).find('img.img').data('src') || '';

        console.log('Found Jumia product:', { title, price, productUrl, imageUrl });

        if (title && !isNaN(price) && productUrl && imageUrl) {
          const product: Product = {
            id: uuidv4(),
            title,
            price,
            currency: 'GHS',
            productUrl,
            imageUrl,
            store: 'Jumia',
            rating: null,
            reviews: null,
            availability: true
          };
          products.push(product);
        }
      } catch (error) {
        console.error('[Jumia Scraper] Error processing product:', error);
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    console.error('[Jumia Scraper] Error:', error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Jumia'
    };
  }
}

export async function scrapeCompuGhana({ query, minBudget, maxBudget }: SearchRequest): Promise<ScrapingResult> {
  try {
    console.log(`[CompuGhanaScraper] Starting search for: ${query}`);
    console.log(`[CompuGhanaScraper] Budget range: ${minBudget || 0} - ${maxBudget || 'unlimited'} GHS`);
    const { compuGhanaScraper } = await import('../lib/scrapers/compughana');
    const result = await compuGhanaScraper.scrape({ query, minBudget, maxBudget });
    return result;
  } catch (error) {
    console.error('[CompuGhana Scraper] Error:', error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape CompuGhana'
    };
  }
}

export async function scrapeTelefonika({ query, minBudget, maxBudget }: SearchRequest): Promise<ScrapingResult> {
  try {
    const searchUrl = `https://telefonika.com/?s=${encodeURIComponent(query)}&post_type=product`;
    console.log('Telefonika search URL:', searchUrl);

    const response = await retry(() =>
      fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
      })
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from Telefonika: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    // Log the HTML for debugging
    console.log('Telefonika HTML:', html.substring(0, 500));

    // Updated selector for Telefonika's product grid
    $('li.product').each((_, element) => {
      try {
        const title = $(element).find('.woocommerce-loop-product__title').text().trim();
        const priceText = $(element).find('span.woocommerce-Price-amount').first().text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const productUrl = $(element).find('a').first().attr('href') || '';
        const imageUrl = $(element).find('img').first().attr('src') || '';

        console.log('Found Telefonika product:', { title, price, productUrl, imageUrl });

        if (title && !isNaN(price) && productUrl && imageUrl) {
          const product: Product = {
            id: uuidv4(),
            title,
            price,
            currency: 'GHS',
            productUrl,
            imageUrl,
            store: 'Telefonika',
            rating: null,
            reviews: null,
            availability: true
          };
          products.push(product);
        }
      } catch (error) {
        console.error('[Telefonika Scraper] Error processing product:', error);
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    console.error('[Telefonika Scraper] Error:', error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Telefonika'
    };
  }
}

export async function scrapeJiji({ query, minBudget, maxBudget }: SearchRequest): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://jiji.com.gh/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.qa-advert-list-item').each((_, element) => {
      const title = $(element).find('.qa-advert-title').text().trim();
      const priceText = $(element).find('.qa-advert-price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const productUrl = 'https://jiji.com.gh' + ($(element).find('a').attr('href') || '');
      const imageUrl = $(element).find('img').attr('src') || '';

      if (title && price && productUrl && imageUrl) {
        products.push({
          id: uuidv4(),
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'Jiji Ghana',
          rating: 0,
          reviews: 0,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Jiji'
    };
  }
}

export async function scrapeAmazon({ query, minBudget, maxBudget }: SearchRequest): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.s-result-item').each((_, element) => {
      const title = $(element).find('h2 span').text().trim();
      const priceText = $(element).find('.a-price-whole').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) * 12.5; // Convert USD to GHS (approximate)
      const productUrl = 'https://www.amazon.com' + ($(element).find('a.a-link-normal').attr('href') || '');
      const imageUrl = $(element).find('img.s-image').attr('src') || '';
      const ratingText = $(element).find('.a-icon-star-small .a-icon-alt').text();
      const rating = parseFloat(ratingText.split(' ')[0]) || 0;
      const reviewsText = $(element).find('span.a-size-base.s-underline-text').text();
      const reviews = parseInt(reviewsText.replace(/[^0-9]/g, '')) || 0;

      if (title && price && productUrl && imageUrl) {
        products.push({
          id: uuidv4(),
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'Amazon',
          rating,
          reviews,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Amazon'
    };
  }
}
