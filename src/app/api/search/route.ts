import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '@/lib/scrapers/types';
import { scrapeAllSources } from '@/utils/scrapers';

interface SearchRequest {
  query: string;
  budget?: number;
  currency?: string;
}

// Helper function to clean price strings
function cleanPrice(price: string): number {
  const numericString = price.replace(/[^0-9.]/g, '');
  return parseFloat(numericString) || 0;
}

// Scrape Jiji
async function scrapeJiji(query: string): Promise<Product[]> {
  try {
    const response = await axios.get(`https://jiji.com.gh/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const products: Product[] = [];

    $('.qa-advert-list-item').each((_, element) => {
      try {
        const title = $(element).find('.qa-advert-title').text().trim();
        const priceText = $(element).find('.qa-advert-price').text().trim();
        const price = cleanPrice(priceText);
        const image = $(element).find('img').attr('src') || '/placeholder.png';
        const url = 'https://jiji.com.gh' + $(element).find('a').attr('href');

        if (title && price) {
          products.push({
            title,
            price,
            currency: 'GHS',
            image,
            url,
            store: 'Jiji Ghana',
            rating: undefined,
            reviews: undefined,
            availability: true
          });
        }
      } catch (error) {
        console.error('Error processing Jiji product:', error);
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping Jiji:', error);
    return [];
  }
}

// Scrape CompuGhana
async function scrapeCompuGhana(query: string): Promise<Product[]> {
  try {
    const response = await axios.get(`https://compughana.com/catalogsearch/result/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const products: Product[] = [];

    $('.product-item-info').each((_, element) => {
      try {
        const title = $(element).find('.product-item-link').text().trim();
        const priceText = $(element).find('.price').first().text().trim();
        const price = cleanPrice(priceText);
        let image = '';
        const imgElement = $(element).find('img.product-image-photo');
        image = imgElement.attr('src') || 
                imgElement.attr('data-src') || 
                imgElement.attr('data-original') || 
                imgElement.attr('data-lazy') || 
                '';
                
        // If the image URL is relative, make it absolute
        if (image && !image.startsWith('http')) {
          image = `https://compughana.com${image}`;
        }

        const url = $(element).find('.product-item-link').attr('href') || '';

        if (title && price) {
          products.push({
            title,
            price,
            currency: 'GHS',
            image,
            url,
            store: 'CompuGhana',
            rating: undefined,
            reviews: undefined,
            availability: true
          });
        }
      } catch (err) {
        console.error('Error processing CompuGhana product:', err);
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping CompuGhana:', error);
    return [];
  }
}

// Scrape Telefonika
async function scrapeTelefonika(query: string): Promise<Product[]> {
  try {
    const response = await axios.get(`https://telefonika.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });
    
    console.log('Telefonika response received:', response.status);
    const html = response.data;
    console.log('Telefonika HTML sample:', html.slice(0, 500));
    
    const $ = cheerio.load(html);
    const products: Product[] = [];

    // Log the entire HTML structure for debugging
    console.log('Full HTML structure:', $.html());

    $('.product').each((_, element) => {
      try {
        const title = $(element).find('.product-title').text().trim();
        const priceText = $(element).find('.price').text().trim();
        const price = cleanPrice(priceText);
        const image = $(element).find('img').first().attr('src') || '';
        const url = $(element).find('a').first().attr('href') || '';

        console.log('Found Telefonika product:', { title, price, image: !!image });

        if (title && price) {
          products.push({
            title,
            price,
            currency: 'GHS',
            image: image.startsWith('http') ? image : `https://telefonika.com${image}`,
            url: url.startsWith('http') ? url : `https://telefonika.com${url}`,
            store: 'Telefonika',
            rating: undefined,
            reviews: undefined,
            availability: true
          });
        }
      } catch (err) {
        console.error('Error processing Telefonika product:', err);
      }
    });

    console.log(`Found ${products.length} products from Telefonika`);
    return products;
  } catch (error) {
    console.error('Error scraping Telefonika:', error);
    return [];
  }
}

// Scrape Jumia
async function scrapeJumia(query: string): Promise<Product[]> {
  try {
    const response = await axios.get(`https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });

    console.log('Jumia response received:', response.status);
    const html = response.data;
    const $ = cheerio.load(html);
    const products: Product[] = [];

    // Jumia uses article tags with specific classes for products
    $('.prd._fb.col.c-prd').each((_, element) => {
      try {
        const title = $(element).find('.name').text().trim();
        const priceText = $(element).find('.prc').text().trim();
        const price = cleanPrice(priceText);
        const url = $(element).find('a').attr('href') || '';
        const image = $(element).find('img').attr('data-src') || '';
        const rating = parseFloat($(element).find('.stars._s').text().trim());
        const reviews = $(element).find('.rev').text().trim();

        console.log('Found Jumia product:', { title, price, image: !!image });

        if (title && price) {
          products.push({
            title,
            price,
            currency: 'GHS',
            url: url.startsWith('http') ? url : `https://www.jumia.com.gh${url}`,
            image: image || undefined,
            store: 'Jumia Ghana',
            rating: !isNaN(rating) ? rating : undefined,
            reviews: reviews ? parseInt(reviews) : undefined,
            availability: true
          });
        }
      } catch (err) {
        console.error('Error processing Jumia product:', err);
      }
    });

    console.log(`Found ${products.length} products from Jumia`);
    return products;
  } catch (error) {
    console.error('Error scraping Jumia:', error);
    if (error.response) {
      console.error('Jumia response status:', error.response.status);
      console.error('Jumia response headers:', error.response.headers);
    }
    return [];
  }
}

// Scrape Amazon
async function scrapeAmazon(query: string): Promise<Product[]> {
  try {
    const response = await axios.get(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.s-result-item[data-component-type="s-search-result"]').each((_, element) => {
      const title = $(element).find('h2 .a-link-normal').text().trim();
      const priceWhole = $(element).find('.a-price-whole').text().trim();
      const priceFraction = $(element).find('.a-price-fraction').text().trim();
      const price = parseFloat(`${priceWhole}.${priceFraction}`);
      const image = $(element).find('.s-image').attr('src') || '';
      const url = 'https://www.amazon.com' + ($(element).find('h2 .a-link-normal').attr('href') || '');

      if (title && price) {
        products.push({
          title,
          price: price * 12.5, // Convert USD to GHS (approximate)
          currency: 'GHS',
          image,
          url,
          store: 'Amazon',
          rating: undefined,
          reviews: undefined,
          availability: true
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping Amazon:', error);
    return [];
  }
}

// Scrape AliExpress
async function scrapeAliExpress(query: string): Promise<Product[]> {
  try {
    const response = await axios.get(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.list--gallery--34TropR').each((_, element) => {
      const title = $(element).find('.multi--titleText--nXeOvyr').text().trim();
      const priceText = $(element).find('.multi--price-sale--U-S0jtj').text().trim();
      const price = cleanPrice(priceText);
      const image = $(element).find('img').attr('src') || '';
      const url = $(element).find('a').attr('href') || '';

      if (title && price) {
        products.push({
          title,
          price,
          currency: 'USD',
          image,
          url: url.startsWith('http') ? url : `https:${url}`,
          store: 'AliExpress',
          rating: undefined,
          reviews: undefined,
          availability: true
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping AliExpress:', error);
    return [];
  }
}

interface Product {
  title: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  store: string;
  rating?: number;
  reviews?: number;
  availability?: boolean;
}

export async function POST(request: Request) {
  try {
    const { query, budget, currency = 'GHS' } = await request.json() as SearchRequest;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Searching for products matching: "${query}"`);
    const results = await scrapeAllSources(query);

    if (results.error) {
      console.error('Error during scraping:', results.error);
      return NextResponse.json(
        { error: results.error },
        { status: 500 }
      );
    }

    let products: Product[] = results.products;

    // Filter by budget if specified
    if (budget) {
      products = products.filter(product => product.price <= budget);
    }

    // Sort products by price
    products.sort((a, b) => a.price - b.price);

    return NextResponse.json({
      products,
      totalResults: products.length,
      currency
    });

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

// Add GET method support for flexibility
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const budget = searchParams.get('budget') ? parseFloat(searchParams.get('budget')!) : undefined;
    const currency = searchParams.get('currency') || 'GHS';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "query" is required' },
        { status: 400 }
      );
    }

    console.log(`Searching for: ${query}`);

    const jijiResults = await scrapeJiji(query);

    if (!jijiResults.length) {
      console.error('Error from Jiji scraper:', 'No results found');
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    const products: Product[] = jijiResults.map(product => ({
      title: product.title,
      price: product.price,
      currency: product.currency,
      image: product.image,
      url: product.url,
      store: product.store,
      rating: 0,
      reviews: 0,
      availability: true
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
