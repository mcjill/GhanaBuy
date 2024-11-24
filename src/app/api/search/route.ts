import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface Product {
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  source: string;
}

interface SearchRequest {
  query: string;
  budget: number;
}

// Helper function to clean price strings
const cleanPrice = (price: string): number => {
  const numericPrice = price.replace(/[^0-9.]/g, '');
  return parseFloat(numericPrice) || 0;
};

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
            description: title,
            price,
            currency: 'GHS',
            image,
            url,
            source: 'Jiji Ghana'
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
        let description = '';
        
        // If no description is found, try to get specifications
        const specs = [];
        $(element).find('.product-item-specs li').each((_, spec) => {
          specs.push($(spec).text().trim());
        });
        
        // Try to get short description
        const shortDesc = $(element).find('.product-item-description').text().trim();
        if (shortDesc) {
          specs.unshift(shortDesc);
        }
        
        description = specs.join(' • ') || title;

        const priceText = $(element).find('.price').first().text().trim();
        const price = cleanPrice(priceText);
        
        // Try multiple ways to get the image URL
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
            description: description || `${title} - Available at CompuGhana`,
            price,
            currency: 'GHS',
            image,
            url,
            source: 'CompuGhana'
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
            description: `${title} - Available at Telefonika`,
            price,
            currency: 'GHS',
            image: image.startsWith('http') ? image : `https://telefonika.com${image}`,
            url: url.startsWith('http') ? url : `https://telefonika.com${url}`,
            source: 'Telefonika'
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
    $('article.prd._fb').each((_, element) => {
      try {
        const title = $(element).find('.name').text().trim();
        const priceText = $(element).find('.prc').text().trim();
        const price = cleanPrice(priceText);
        const image = $(element).find('img.img').data('src') || '';
        const url = $(element).find('a.core').attr('href') || '';

        // Get rating and reviews if available
        const rating = $(element).find('.stars._s').text().trim();
        const reviews = $(element).find('.rev').text().trim();
        const description = rating && reviews ? `Rating: ${rating} • ${reviews} reviews` : '';

        console.log('Found Jumia product:', { title, price, image: !!image });

        if (title && price) {
          products.push({
            title,
            description: description || `${title} - Available on Jumia Ghana`,
            price,
            currency: 'GHS',
            image,
            url: url.startsWith('http') ? url : `https://www.jumia.com.gh${url}`,
            source: 'Jumia Ghana'
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
          description: 'No description available',
          price: price * 12.5, // Convert USD to GHS (approximate)
          currency: 'GHS',
          image,
          url,
          source: 'Amazon'
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
          description: 'No description available',
          price,
          currency: 'USD',
          image,
          url: url.startsWith('http') ? url : `https:${url}`,
          source: 'AliExpress'
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping AliExpress:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, budget = Infinity, currency = 'GHS' } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // First try Jiji
    let products = await scrapeJiji(query);
    let affordableProducts = products.filter(p => p.price <= budget);

    // If no affordable products found on Jiji or this is a comparison request, try Amazon
    if (affordableProducts.length === 0 || budget === 100000000) {
      const amazonProducts = await scrapeAmazon(query);
      products = [...products, ...amazonProducts];
      affordableProducts = products.filter(p => p.price <= budget);
    }

    // Sort all products by price
    const sortedProducts = products.sort((a, b) => a.price - b.price);

    if (sortedProducts.length === 0) {
      return NextResponse.json({
        products: [],
        total: 0,
        message: 'No products found matching your search.'
      });
    }

    return NextResponse.json({
      products: sortedProducts,
      total: sortedProducts.length,
      sources: {
        jiji: products.filter(p => p.source === 'Jiji Ghana').length,
        amazon: products.filter(p => p.source === 'Amazon').length
      }
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}

// Add GET method support for flexibility
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const budget = searchParams.get('budget');
  
  // Convert the GET request to use the POST handler
  return POST(new Request(request.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      budget: budget ? parseFloat(budget) : Infinity,
      currency: 'GHS'
    })
  }));
}
