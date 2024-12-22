import { CompuGhanaScraper } from '../src/lib/scrapers/compughana';

async function testCompuGhanaScraper() {
    const scraper = new CompuGhanaScraper();
    console.log('Testing CompuGhana scraper with query: samsung');
    
    try {
        const results = await scraper.scrape({ query: 'samsung' });
        console.log('\nResults:', {
            success: results.success,
            totalProducts: results.products?.length || 0,
            error: results.error
        });

        if (results.products && results.products.length > 0) {
            console.log('\nFirst 3 products:');
            results.products.slice(0, 3).forEach((product, index) => {
                console.log(`\nProduct ${index + 1}:`);
                console.log('Title:', product.title);
                console.log('Price:', product.price);
                console.log('URL:', product.productUrl);
                console.log('Image:', product.imageUrl);
            });
        }
    } catch (error) {
        console.error('Error testing scraper:', error);
    }
}

testCompuGhanaScraper();
