import { JijiScraper } from '../lib/scrapers/jiji';
import type { Scraper } from '../lib/scrapers/types';

async function testScraper(scraper: Scraper, query: string, budget?: number) {
  try {
    const result = await scraper.scrape({ query, budget });
    
    if (result.error) {
      console.log(`❌ Scraping failed: ${result.error}`);
      return;
    }

    console.log(`✅ Found ${result.products.length} products within budget`);
    
    // Print first 5 products
    result.products.slice(0, 5).forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`Title: ${product.title}`);
      console.log(`Price: ${product.currency} ${product.price}`);
      console.log(`URL: ${product.productUrl}`);
      console.log(`Relevancy Score: ${product.metadata?.relevancyScore}`);
    });

  } catch (error) {
    console.error('Error during test:', error);
  }
}

async function runTests() {
  console.log('\n🚀 Testing Jiji scraper with query: "iphone 12" and budget: GHS 7000\n');

  // Test Jiji scraper with budget
  await testScraper(new JijiScraper(), 'iphone 12', 7000);
}

// Run the tests
runTests().catch(console.error);
