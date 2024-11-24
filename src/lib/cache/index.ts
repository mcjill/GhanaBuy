import { Product } from '../scrapers/types';

interface CacheItem {
  products: Product[];
  timestamp: number;
}

class ProductCache {
  private cache: Map<string, CacheItem>;
  private readonly TTL: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 30) {
    this.cache = new Map();
    this.TTL = ttlMinutes * 60 * 1000;
  }

  private generateKey(query: string, store: string): string {
    return `${query.toLowerCase()}_${store}`;
  }

  set(query: string, store: string, products: Product[]): void {
    const key = this.generateKey(query, store);
    this.cache.set(key, {
      products,
      timestamp: Date.now(),
    });
  }

  get(query: string, store: string): Product[] | null {
    const key = this.generateKey(query, store);
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if cache has expired
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.products;
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance
export const productCache = new ProductCache();
