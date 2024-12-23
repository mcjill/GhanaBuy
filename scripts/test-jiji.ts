import { scrapeWithRehydration } from '../src/lib/scrapers/rehydration-scraper';

async function testJijiScraper() {
  console.log('Starting Jiji scraper test...');
  
  const query = 'iphone 12';
  const url = `https://jiji.com.gh/search?query=${encodeURIComponent(query)}`;
  
  console.log(`Testing URL: ${url}`);
  
  try {
    const products = await scrapeWithRehydration(url);
    
    console.log('\nResults:');
    console.log('------------------------');
    console.log(`Total products found: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\nFirst 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`Title: ${product.title}`);
        console.log(`Price: GHS ${product.price}`);
        console.log(`URL: ${product.productUrl}`);
        console.log(`Image: ${product.imageUrl}`);
      });
    }
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

testJijiScraper();
