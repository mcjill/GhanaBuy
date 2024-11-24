import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Product } from '@/lib/scrapers/types';

export const dynamic = 'force-dynamic'; // Disable caching for this route
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      console.error('No query parameter provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Query parameter is required' 
      }, { status: 400 });
    }

    const baseUrl = 'https://jiji.com.gh';
    const searchUrl = `${baseUrl}/search?query=${encodeURIComponent(query)}`;

    console.log('Fetching Jiji URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch from Jiji:', {
        status: response.status,
        statusText: response.statusText,
        url: searchUrl
      });
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch from Jiji: ${response.statusText}` 
      }, { status: response.status });
    }

    const html = await response.text();
    
    if (html.includes('Access to this page has been denied')) {
      console.error('Access denied by Jiji');
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied by Jiji. Please try again later.' 
      }, { status: 403 });
    }

    const $ = cheerio.load(html);
    const products: Product[] = [];
    const items = $('.qa-advert-list-item');

    console.log(`Found ${items.length} items on Jiji`);

    if (items.length === 0) {
      console.log('No products found. HTML snippet:', html.substring(0, 500));
      return NextResponse.json({
        success: false,
        error: 'No products found',
        products: []
      });
    }

    items.each((_, element) => {
      try {
        const $element = $(element);
        const title = $element.find('.qa-advert-title').text().trim();
        const priceText = $element.find('.qa-advert-price').text().trim();
        const imageUrl = $element.find('img').attr('data-src') || 
                        $element.find('img').attr('src');
        const productUrl = $element.find('a').attr('href');

        // Clean price
        const numericString = priceText.replace(/[^0-9.]/g, '');
        const price = parseFloat(numericString);

        if (title && price > 0 && imageUrl && productUrl) {
          products.push({
            title,
            price,
            currency: 'GHS',
            imageUrl: imageUrl.startsWith('http') ? imageUrl : 
                     imageUrl.startsWith('//') ? `https:${imageUrl}` :
                     `${baseUrl}${imageUrl}`,
            productUrl: productUrl.startsWith('http') ? productUrl : 
                       `${baseUrl}${productUrl}`,
            store: 'Jiji Ghana',
            rating: 0,
            reviews: 0,
            availability: true
          });
        }
      } catch (error) {
        console.error('Error processing Jiji item:', error);
      }
    });

    if (products.length === 0) {
      console.error('No valid products extracted from HTML');
      return NextResponse.json({
        success: false,
        error: 'No valid products found',
        products: []
      });
    }

    console.log(`Successfully extracted ${products.length} products from Jiji`);
    return NextResponse.json({
      success: true,
      products,
      error: null
    });
  } catch (error) {
    console.error('Error in Jiji API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      products: []
    }, { status: 500 });
  }
}
