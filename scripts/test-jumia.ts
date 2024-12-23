import { scrapeJumia } from '../src/lib/scrapers/jumia-scraper';

async function testJumiaScraper() {
  console.log('Starting Jumia scraper test...');
  
  const query = 'rice cooker';
  console.log(`Testing query: "${query}"`);
  
  try {
    const products = await scrapeJumia(query);
    
    console.log('\nResults:');
    console.log('------------------------');
    console.log(`Total products found: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\nFirst 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`Title: ${product.title}`);
        console.log(`Price: ${product.currency} ${product.price}`);
        console.log(`URL: ${product.productUrl}`);
        console.log(`Image: ${product.imageUrl}`);
        
        // Log relevancy score if available
        if (product.metadata?.relevancyScore) {
          console.log(`Relevancy Score: ${product.metadata.relevancyScore}`);
        }
      });
    }
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

testJumiaScraper();
