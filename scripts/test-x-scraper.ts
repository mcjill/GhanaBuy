import { xScraper } from '../src/lib/scrapers/x-scraper';

async function testXScraper() {
  console.log('Testing X (Twitter) scraper...\n');
  
  const query = process.argv[2] || 'iphone';
  console.log(`Searching for: "${query}"\n`);

  try {
    const results = await xScraper.scrape({ query });
    
    console.log('X Scraper Results:');
    console.log(`Success: ${results.success}`);
    console.log(`Total products found: ${results.products.length}\n`);

    if (results.products.length > 0) {
      console.log('Products found:');
      results.products.forEach((product, index) => {
        console.log(`\n[Product ${index + 1}]`);
        console.log(`Store: ${product.store}`);
        console.log(`Title: ${product.title}`);
        console.log(`Price: ${product.price} ${product.currency}`);
        console.log(`URL: ${product.productUrl}`);
        console.log(`Image: ${product.imageUrl}`);
        console.log('-'.repeat(50));
      });
    }

  } catch (error) {
    console.error('Error testing X scraper:', error);
  }
}

testXScraper();
