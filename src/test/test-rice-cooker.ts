import { jumiaScraper } from '../lib/scrapers/jumia';
import { jijiScraper } from '../lib/scrapers/jiji';
import type { SearchRequest } from '../lib/scrapers/types';

async function testScrapers() {
  console.log('🔍 Testing scrapers with:');
  const request: SearchRequest = {
    query: "rice cooker",
    minBudget: 500,
    maxBudget: 2000
  };
  console.log(`Query: "${request.query}"`);
  console.log(`Price Range: GHS ${request.minBudget.toLocaleString()} - GHS ${request.maxBudget.toLocaleString()}\n`);

  // Test Jumia
  console.log('🚀 Testing Jumia scraper...');
  try {
    const jumiaResult = await jumiaScraper.scrape(request);
    
    if (!jumiaResult.success || jumiaResult.error) {
      console.log('❌ Jumia Error:', jumiaResult.error);
    } else {
      const products = jumiaResult.products;
      console.log(`✅ Jumia found ${products.length} products within budget range\n`);

      if (products.length > 0) {
        console.log('First 5 Jumia products:\n');
        products.slice(0, 5).forEach((product, index) => {
          console.log(`${index + 1}. ${product.title}`);
          console.log(`   Price: GHS ${product.price}`);
          console.log(`   URL: ${product.productUrl}`);
          console.log(`   Relevancy: ${(product.metadata.relevancyScore * 100).toFixed(1)}%\n`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Jumia Error:', error);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test Jiji
  console.log('🚀 Testing Jiji scraper...');
  try {
    const jijiResult = await jijiScraper.scrape(request);
    
    if (!jijiResult.success || jijiResult.error) {
      console.log('❌ Jiji Error:', jijiResult.error);
    } else {
      const products = jijiResult.products;
      console.log(`✅ Jiji found ${products.length} products within budget range\n`);

      if (products.length > 0) {
        console.log('First 5 Jiji products:\n');
        products.slice(0, 5).forEach((product, index) => {
          console.log(`${index + 1}. ${product.title}`);
          console.log(`   Price: GHS ${product.price}`);
          console.log(`   URL: ${product.productUrl}`);
          console.log(`   Relevancy: ${(product.metadata.relevancyScore * 100).toFixed(1)}%\n`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Jiji Error:', error);
  }
}

testScrapers();
