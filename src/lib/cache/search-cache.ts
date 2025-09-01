interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private generateKey(query: string, minBudget?: number, maxBudget?: number, stores?: string[]): string {
    return `${query.toLowerCase()}-${minBudget || 0}-${maxBudget || 'inf'}-${stores?.sort().join(',') || 'all'}`;
  }

  get(query: string, minBudget?: number, maxBudget?: number, stores?: string[]): any | null {
    const key = this.generateKey(query, minBudget, maxBudget, stores);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(query: string, data: any, minBudget?: number, maxBudget?: number, stores?: string[], ttl?: number): void {
    const key = this.generateKey(query, minBudget, maxBudget, stores);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const searchCache = new SearchCache();
