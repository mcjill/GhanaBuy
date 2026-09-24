import test from 'node:test';
import assert from 'node:assert';
import { cleanPrice, parseJumiaProducts } from '../src/lib/scrapers/jumia';

const product = (name: string, price: string, href = '/item.html', img = 'https://gh.jumia.is/p.jpg') => `
  <article class="prd _fb col c-prd">
    <a class="core" href="${href}" data-name="${name}">
      <div class="img-c"><img class="img" data-src="${img}" src="data:image/svg+xml;base64,x"></div>
      <div class="info"><h3 class="name">${name}</h3><div class="prc">${price}</div></div>
    </a>
  </article>`;

const page = (...articles: string[]) => `<html><body><div>${articles.join('')}</div></body></html>`;

test('cleanPrice parses Ghana cedi prices', () => {
  assert.strictEqual(cleanPrice('GH₵ 1,299.50'), 1299.5);
  assert.strictEqual(cleanPrice('GH₵ 1,200 - GH₵ 1,500'), 1200);
  assert.strictEqual(cleanPrice(''), 0);
  assert.strictEqual(cleanPrice('Out of stock'), 0);
});

test('parseJumiaProducts extracts product fields', () => {
  const [p] = parseJumiaProducts(page(product('Samsung Galaxy A15', 'GH₵ 2,150', '/samsung-a15.html')));

  assert.strictEqual(p.title, 'Samsung Galaxy A15');
  assert.strictEqual(p.price, 2150);
  assert.strictEqual(p.currency, 'GHS');
  assert.strictEqual(p.store, 'Jumia');
  assert.strictEqual(p.productUrl, 'https://www.jumia.com.gh/samsung-a15.html');
  assert.strictEqual(p.imageUrl, 'https://gh.jumia.is/p.jpg');
});

test('parseJumiaProducts applies the budget', () => {
  const html = page(
    product('Cheap phone', 'GH₵ 500'),
    product('Mid phone', 'GH₵ 1,500'),
    product('Expensive phone', 'GH₵ 9,000')
  );

  const titles = parseJumiaProducts(html, 1000, 5000).map((p) => p.title);
  assert.deepStrictEqual(titles, ['Mid phone']);
});

test('parseJumiaProducts skips cards without a price, title or link', () => {
  const html = page(
    product('No price', ''),
    product('', 'GH₵ 100'),
    product('No link', 'GH₵ 100', ''),
    product('Valid', 'GH₵ 100')
  );

  assert.deepStrictEqual(parseJumiaProducts(html).map((p) => p.title), ['Valid']);
});

test('parseJumiaProducts drops non-http image URLs', () => {
  const [p] = parseJumiaProducts(page(product('Kettle', 'GH₵ 250', '/kettle.html', '/relative.jpg')));
  assert.strictEqual(p.imageUrl, '');
});
