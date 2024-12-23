import { telefonikaScraper } from '../src/lib/scrapers/telefonika';

async function testTelefonikaScraper() {
  const query = "iphone 12";
  console.log(`\nTesting Telefonika scraper with query: "${query}"\n`);

  try {
    const result = await telefonikaScraper.scrape({ query });
    
    console.log('Scraping success:', result.success);
    console.log('Number of products found:', result.products.length);
    
    if (result.products.length > 0) {
      console.log('\nProducts found:');
      result.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Price: ${product.currency} ${product.price}`);
        console.log(`   URL: ${product.productUrl}`);
        console.log(`   Image: ${product.imageUrl}`);
        if (product.metadata?.relevancyScore) {
          console.log(`   Relevancy Score: ${product.metadata.relevancyScore.toFixed(2)}`);
        }
      });
    } else {
      console.log('\nNo products found');
    }

    if (result.error) {
      console.log('\nError:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTelefonikaScraper();
