import puppeteer from 'puppeteer';

async function testCompuGhanaScraper() {
  try {
    console.log('Starting CompuGhana scraper test...');
    
    const minPrice = 4000;
    const maxPrice = 9000;
    
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    const page = await browser.newPage();
    
    // Configure page
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to search page
    const query = 'airpod';
    const searchUrl = `https://compughana.com/catalogsearch/result/?q=${encodeURIComponent(query)}`;
    console.log(`Accessing search URL: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for products to load
    await Promise.race([
      page.waitForSelector('.products-grid, .products.list.items.product-items', { timeout: 20000 }),
      page.waitForSelector('.message.notice', { timeout: 20000 })
    ]);

    // Get products
    const products = await page.evaluate((minPrice, maxPrice) => {
      const items = document.querySelectorAll('.product-item, .item.product.product-item');
      console.log(`Found ${items.length} product items`);
      
      return Array.from(items).map(item => {
        const titleEl = item.querySelector('.product-item-link, .product.name.product-item-name a');
        const priceEl = item.querySelector('.price-wrapper .price, .special-price .price, .normal-price .price');
        const linkEl = item.querySelector('a.product-item-link, a.product-item-photo');
        const imgEl = item.querySelector('.product-image-photo');

        const title = titleEl?.textContent?.trim() || 'No title';
        const priceText = priceEl?.textContent?.trim() || '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const url = linkEl?.href || window.location.href;
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || 'No image';

        // Filter by price range if provided
        if (minPrice && maxPrice) {
          if (price < minPrice || price > maxPrice) {
            return null;
          }
        }

        return {
          title,
          price,
          priceFormatted: priceText,
          url,
          image,
          store: 'CompuGhana',
          currency: 'GHS'
        };
      }).filter(product => product !== null); // Remove filtered out products
    }, minPrice, maxPrice);

    console.log('\nScraping Results:');
    console.log('Total products found:', products.length);
    console.log(`Price range: GHS ${minPrice} - ${maxPrice}`);
    
    if (products.length > 0) {
      console.log('\nProducts in price range:');
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log('Title:', product.title);
        console.log('Price:', product.priceFormatted, `(${product.price} GHS)`);
        console.log('URL:', product.url);
        console.log('Image:', product.image);
      });
    } else {
      console.log('\nNo products found in the specified price range.');
    }

    await browser.close();

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testCompuGhanaScraper();
