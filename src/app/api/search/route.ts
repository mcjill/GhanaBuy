import { NextRequest, NextResponse } from 'next/server';
import { jumiaScraper } from '@/lib/scrapers/jumia';
import { compuGhanaScraper } from '@/lib/scrapers/compughana';
import { Product } from '@/lib/scrapers/types';
import { scrapeWithRehydration } from '@/lib/scrapers/rehydration-scraper';

function calculateRelevanceScore(product: Product, query: string, budget: number | undefined): number {
  let score = 1; // Start with base score of 1
  const searchTerms = query.toLowerCase().split(' ');
  const titleTerms = product.title.toLowerCase().split(' ');

  // Title match score
  searchTerms.forEach(term => {
    if (titleTerms.some(titleTerm => titleTerm.includes(term))) {
      score += 2;
    }
  });

  // Exact phrase match bonus
  if (product.title.toLowerCase().includes(query.toLowerCase())) {
    score += 3;
  }

  // Budget relevance (if provided)
  if (budget) {
    if (product.price <= budget) {
      score *= 1.2; // Boost score for products within budget
    } else if (product.price <= budget * 1.2) {
      score *= 0.8; // Slightly reduce score for products slightly over budget
    } else {
      score *= 0.5; // Significantly reduce score for products way over budget
    }
  }

  // Brand name match bonus
  const commonBrands = ['samsung', 'apple', 'lg', 'sony', 'hp', 'dell', 'lenovo', 'asus', 'acer'];
  searchTerms.forEach(term => {
    if (commonBrands.includes(term) && product.title.toLowerCase().includes(term)) {
      score += 2;
    }
  });

  // Store preference bonus
  if (product.store === 'Jumia' || product.store === 'CompuGhana') {
    score *= 1.1; // Slight boost for preferred stores
  }

  return score;
}

function sanitizeProducts(products: Product[], query: string, budget: number | undefined): Product[] {
  // Log product counts by store
  console.log('[Search API] Products by store:', {
    total: products.length,
    byStore: {
      jiji: products.filter(p => p.store === 'Jiji Ghana').length,
      jumia: products.filter(p => p.store === 'Jumia').length,
      compughana: products.filter(p => p.store === 'CompuGhana').length
    }
  });

  // Only do basic validation to ensure required fields exist
  return products.filter(product => 
    product.title && 
    product.price > 0
  );
}

function normalizeProduct(product: Product, store: string): Product {
  let { productUrl, imageUrl } = product;

  // Normalize Jumia URLs
  if (store === 'Jumia') {
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = `https://jumia.com.gh${productUrl.startsWith('/') ? '' : '/'}${productUrl}`;
    }
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https:${imageUrl.startsWith('//') ? '' : '//'}${imageUrl}`;
    }
  }

  // Normalize CompuGhana URLs
  if (store === 'CompuGhana') {
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = `https://compughana.com${productUrl.startsWith('/') ? '' : '/'}${productUrl}`;
    }
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://compughana.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
  }

  // Normalize Jiji URLs (already handled in scraper, but clean up if needed)
  if (store === 'Jiji Ghana' && productUrl && !productUrl.startsWith('http')) {
    productUrl = `https://jiji.com.gh${productUrl}`;
  }

  // Clean up any spaces in URLs
  productUrl = productUrl.replace(/\s+/g, '%20').trim();
  imageUrl = imageUrl.replace(/\s+/g, '%20').trim();

  return {
    ...product,
    productUrl,
    imageUrl
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, budget } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log(`[Search API] Searching for: ${query} with budget: ${budget}`);

    // Run scrapers in parallel
    const [jijiProducts, jumiaResults, compuGhanaResults] = await Promise.all([
      scrapeWithRehydration(`https://jiji.com.gh/search?query=${encodeURIComponent(query)}`),
      jumiaScraper.scrape({ query }),
      compuGhanaScraper.scrape({ query }),
    ]);

    // Combine all products with URL normalization
    let allProducts: Product[] = [
      ...jijiProducts.map(p => normalizeProduct(p, 'Jiji Ghana')),
      ...(jumiaResults.success ? jumiaResults.products.map(p => normalizeProduct(p, 'Jumia')) : []),
      ...(compuGhanaResults.success ? compuGhanaResults.products.map(p => normalizeProduct(p, 'CompuGhana')) : [])
    ];

    // Only do basic validation
    const validProducts = sanitizeProducts(allProducts, query, budget);

    // Log final counts
    console.log(`[Search API] Found ${validProducts.length} products out of ${allProducts.length} total`);

    return NextResponse.json({
      success: true,
      products: validProducts,
      errors: {
        jiji: jijiProducts.length === 0 ? 'No products found' : null,
        jumia: jumiaResults.error,
        compughana: compuGhanaResults.error,
      }
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
