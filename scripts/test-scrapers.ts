import { scrapeJumia, scrapeCompuGhana, scrapeTelefonika, scrapeJiji } from '../src/utils/scrapers';

async function testScrapers() {
  const query = 'iphone 12';
  console.log(`Testing scrapers with query: "${query}"\n`);

  try {
    console.log('Testing Jumia scraper...');
    const jumiaResults = await scrapeJumia(query);
    console.log(`Found ${jumiaResults.products.length} products from Jumia:`);
    jumiaResults.products.forEach(product => {
      console.log(`- ${product.title} - GHS ${product.price}`);
    });
    console.log('\n');

    console.log('Testing CompuGhana scraper...');
    const compuGhanaResults = await scrapeCompuGhana(query);
    console.log(`Found ${compuGhanaResults.products.length} products from CompuGhana:`);
    compuGhanaResults.products.forEach(product => {
      console.log(`- ${product.title} - GHS ${product.price}`);
    });
    console.log('\n');

    console.log('Testing Telefonika scraper...');
    const telefonikaResults = await scrapeTelefonika(query);
    console.log(`Found ${telefonikaResults.products.length} products from Telefonika:`);
    telefonikaResults.products.forEach(product => {
      console.log(`- ${product.title} - GHS ${product.price}`);
    });
    console.log('\n');

    console.log('Testing Jiji scraper...');
    const jijiResults = await scrapeJiji(query);
    console.log(`Found ${jijiResults.products.length} products from Jiji:`);
    jijiResults.products.forEach(product => {
      console.log(`- ${product.title} - GHS ${product.price}`);
    });

  } catch (error) {
    console.error('Error testing scrapers:', error);
  }
}

testScrapers();
