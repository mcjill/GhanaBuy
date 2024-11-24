import * as cheerio from 'cheerio';
import { Product, ScrapingResult } from '@/lib/scrapers/types';
import { retry } from '@/lib/utils/retry';

export async function scrapeAllSources(query: string): Promise<ScrapingResult> {
  try {
    const results = await Promise.allSettled([
      scrapeJumia(query),
      scrapeCompuGhana(query),
      scrapeTelefonika(query),
    ]);

    const products: Product[] = [];
    let errors: string[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        products.push(...result.value.products);
      } else {
        errors.push(result.reason);
      }
    });

    return {
      products,
      error: errors.length > 0 ? errors.join(', ') : undefined,
    };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function scrapeJumia(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`)
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

      if (title && !isNaN(price)) {
        products.push({
          title,
          price,
          currency: 'GHS',
          url,
          image,
          store: 'Jumia',
          availability: true,
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
      fetch(`https://compughana.com/search?q=${encodeURIComponent(query)}`)
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

      if (title && !isNaN(price) && url) {
        products.push({
          title,
          price,
          currency: 'GHS',
          url,
          image,
          store: 'CompuGhana',
          availability: true,
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
      fetch(`https://telefonika.com.gh/search?q=${encodeURIComponent(query)}`)
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

      if (title && !isNaN(price) && url) {
        products.push({
          title,
          price,
          currency: 'GHS',
          url,
          image,
          store: 'Telefonika',
          availability: true,
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
