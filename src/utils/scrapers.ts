import * as cheerio from 'cheerio';
import { Product, ScrapingResult } from '@/lib/scrapers/types';
import { retry } from '@/lib/utils/retry';

export async function scrapeAllSources(query: string): Promise<ScrapingResult> {
  try {
    console.log('Starting to scrape all sources for query:', query);
    
    const results = await Promise.allSettled([
      scrapeJiji(query),      // Add Jiji first as it's prioritized
      scrapeJumia(query),
      scrapeCompuGhana(query),
      scrapeTelefonika(query),
      scrapeAmazon(query),
    ]);

    const products: Product[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const source = result.value;
        if (source.products.length > 0) {
          console.log(`Successfully scraped ${source.products.length} products from ${source.products[0].store}`);
          products.push(...source.products);
        } else {
          console.log(`No products found from ${source.products[0].store}`);
        }
        if (source.error) {
          errors.push(`${source.products[0].store}: ${source.error}`);
        }
      } else {
        console.error(`Failed to scrape source ${index}:`, result.reason);
        errors.push(result.reason.toString());
      }
    });

    // Sort products by price
    products.sort((a, b) => a.price - b.price);

    console.log(`Total products found across all sources: ${products.length}`);
    
    return {
      products,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error in scrapeAllSources:', error);
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
  }
}

async function scrapeJumia(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.prd').each((_, element) => {
      const title = $(element).find('.name').text().trim();
      const priceText = $(element).find('.prc').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const url = 'https://www.jumia.com.gh' + $(element).find('a').attr('href');
      const image = $(element).find('img').attr('data-src');
      const rating = parseFloat($(element).find('.stars').attr('data-rate') || '0');
      const reviews = parseInt($(element).find('.rev').text().replace(/[^0-9]/g, '') || '0');

      if (title && price && url && image) {
        products.push({
          title,
          price,
          url,
          image,
          rating,
          reviews,
          store: 'Jumia'
        });
      }
    });

    return { products };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Jumia',
    };
  }
}

async function scrapeCompuGhana(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://compughana.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.product-item').each((_, element) => {
      const title = $(element).find('.product-title').text().trim();
      const priceText = $(element).find('.price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const url = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');

      if (title && price && url && image) {
        products.push({
          title,
          price,
          url,
          image,
          rating: 0,
          reviews: 0,
          store: 'CompuGhana'
        });
      }
    });

    return { products };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape CompuGhana',
    };
  }
}

async function scrapeTelefonika(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://telefonika.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.product-grid-item').each((_, element) => {
      const title = $(element).find('.product-title').text().trim();
      const priceText = $(element).find('.price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const url = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');

      if (title && price && url && image) {
        products.push({
          title,
          price,
          url,
          image,
          rating: 0,
          reviews: 0,
          store: 'Telefonika'
        });
      }
    });

    return { products };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Telefonika',
    };
  }
}

async function scrapeJiji(query: string): Promise<ScrapingResult> {
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

    $('.b-list-advert__item-wrapper').each((_, element) => {
      const title = $(element).find('.qa-advert-title').text().trim();
      const priceText = $(element).find('.qa-advert-price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const url = 'https://jiji.com.gh' + $(element).find('a').attr('href');
      const image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

      if (title && price && url && image) {
        products.push({
          title,
          price,
          url,
          image,
          rating: 0,
          reviews: 0,
          store: 'Jiji'
        });
      }
    });

    return { products };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Jiji',
    };
  }
}

async function scrapeAmazon(query: string): Promise<ScrapingResult> {
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

    $('.s-result-item[data-component-type="s-search-result"]').each((_, element) => {
      const title = $(element).find('h2 span').text().trim();
      const priceWhole = $(element).find('.a-price-whole').text().trim();
      const priceFraction = $(element).find('.a-price-fraction').text().trim();
      const price = parseFloat(`${priceWhole}.${priceFraction}`) || 0;
      const url = 'https://www.amazon.com' + $(element).find('a.a-link-normal').attr('href');
      const image = $(element).find('img.s-image').attr('src');
      const rating = parseFloat($(element).find('.a-icon-star-small').attr('aria-label')?.split(' ')[0] || '0');
      const reviews = parseInt($(element).find('.a-size-base.s-underline-text').text().replace(/[^0-9]/g, '') || '0');

      if (title && price && url && image) {
        products.push({
          title,
          price,
          url,
          image,
          rating,
          reviews,
          store: 'Amazon'
        });
      }
    });

    return { products };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Amazon',
    };
  }
}
