import { chromium } from 'playwright';

async function debugJumia() {
  const browser = await chromium.launch({ headless: false }); // Visual debugging
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    const searchUrl = 'https://www.jumia.com.gh/catalog/?q=samsung';
    console.log('Navigating to:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'jumia-debug.png', fullPage: true });
    
    // Check page title and content
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for Cloudflare
    const content = await page.content();
    if (content.includes('Cloudflare') || content.includes('cf-browser-verification')) {
      console.log('❌ Cloudflare detected!');
    } else {
      console.log('✅ No Cloudflare detected');
    }
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(5000);
    
    // Try different selectors to find products
    const selectors = [
      '.prd',
      '.product',
      '[data-product]',
      '.item',
      '.product-item',
      '.card',
      '.listing-item',
      '.product-card',
      'article',
      '[data-qa="product"]',
      '.core'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${count} elements found`);
    }
    
    // Get all elements and see what's available
    const allElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*[class*="product"], *[class*="item"], *[class*="card"], *[data-product]');
      return Array.from(elements).slice(0, 10).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        textContent: el.textContent?.substring(0, 100)
      }));
    });
    
    console.log('Found elements:', JSON.stringify(allElements, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugJumia().catch(console.error);
