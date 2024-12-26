'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/lib/scrapers/types';
import { ProductCard } from './product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from '../ui/skeleton-loader';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

const STORE_MAP = {
  'Jumia': 'Jumia',
  'Jiji': 'Jiji',
  'CompuGhana': 'CompuGhana',
  'Compughana': 'CompuGhana',
  'Telefonika': 'Telefonika'
};

const STORES = ['Jumia', 'Jiji', 'CompuGhana', 'Telefonika'];

interface ComparisonProps {
  initialQuery?: string;
}

export function ProductComparison({ initialQuery = '' }: ComparisonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // Clear URL parameters and state on page refresh
  useEffect(() => {
    const clearStateAndParams = () => {
      // Clear state
      setQuery('');
      setMinBudget('');
      setMaxBudget('');
      setProducts([]);
      setSelectedStore('all');
      setError(null);
      setHasSearched(false);
      
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      url.searchParams.delete('min');
      url.searchParams.delete('max');
      window.history.replaceState({}, '', url.pathname);
    };

    window.addEventListener('beforeunload', clearStateAndParams);
    return () => window.removeEventListener('beforeunload', clearStateAndParams);
  }, [router]);

  // Only set initial values from URL params on first mount, not on subsequent updates
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    
    if (!hasSearched && urlQuery) {
      setQuery(urlQuery);
      if (min) setMinBudget(min);
      if (max) setMaxBudget(max);
      handleSearch();
    }
  }, []); // Empty dependency array for first mount only

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a product to search for.",
        variant: "destructive"
      });
      return;
    }

    // Cancel any ongoing search
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.set('q', query.trim());
      if (minBudget) params.set('min', minBudget);
      if (maxBudget) params.set('max', maxBudget);
      router.push(`/compare?${params.toString()}`);

      console.log('[ProductComparison] Sending search request:', {
        query: query.trim(),
        stores: selectedStore === 'all' ? STORES : [STORE_MAP[selectedStore] || selectedStore],
        minBudget: minBudget ? parseFloat(minBudget) : undefined,
        maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      });

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          stores: selectedStore === 'all' ? STORES : [STORE_MAP[selectedStore] || selectedStore],
          minBudget: minBudget ? parseFloat(minBudget) : undefined,
          maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('[ProductComparison] Received response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Combine and sort all products
      const allProducts = [
        ...(data.products.highRelevancy || []),
        ...(data.products.other || [])
      ];
      console.log('[ProductComparison] Combined products:', allProducts.length);

      // Deduplicate products
      const uniqueProducts = deduplicateProducts(allProducts.map(product => ({
        ...product,
        store: STORE_MAP[product.store] || product.store
      })));
      console.log('[ProductComparison] After deduplication:', uniqueProducts.length);

      // Sort products by price (ascending)
      const sortedProducts = uniqueProducts.sort((a: Product, b: Product) => {
        const priceComparison = a.price - b.price;
        if (priceComparison !== 0) return priceComparison;
        
        const aScore = a.metadata?.relevancyScore || 0;
        const bScore = b.metadata?.relevancyScore || 0;
        return bScore - aScore;
      });

      console.log('[ProductComparison] Final sorted products:', sortedProducts.length);
      setProducts(sortedProducts);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Search cancelled');
        return;
      }
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred while fetching products',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [query, selectedStore, minBudget, maxBudget, toast, router]);

  const handleCancelSearch = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    setLoading(false);
  };

  const clearSearch = () => {
    setQuery('');
    setProducts([]);
    setError(null);
    setHasSearched(false);
    
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('min');
    url.searchParams.delete('max');
    router.replace(url.pathname);
  };

  const deduplicateProducts = (products: Product[]): Product[] => {
    const seen = new Map();
    
    return products.filter(product => {
      // Create a unique key based on normalized title, price, and store
      const normalizedTitle = product.title.toLowerCase().replace(/\s+/g, ' ').trim();
      const key = `${normalizedTitle}-${product.price}-${product.store}`;
      
      if (seen.has(key)) {
        console.log('[ProductComparison] Duplicate found:', { title: product.title, store: product.store });
        return false;
      }
      
      seen.set(key, true);
      return true;
    });
  };

  const getNoProductsMessage = (store: string, query: string): string => {
    const formattedQuery = query.trim();
    switch (store) {
      case 'all':
        return `We couldn't find any products matching "${formattedQuery}" across our partner stores. Try adjusting your search terms or price range.`;
      case 'Jumia':
        return `Jumia currently doesn't have any products matching "${formattedQuery}" in stock. They regularly update their inventory, so check back later or try other stores.`;
      case 'Jiji':
        return `No listings found on Jiji for "${formattedQuery}". Since Jiji is a marketplace, new listings are added frequently - try checking back tomorrow.`;
      case 'CompuGhana':
        return `CompuGhana doesn't have "${formattedQuery}" in their current inventory. They specialize in electronics and regularly restock - you might want to check back later.`;
      case 'Telefonika':
        return `Telefonika is currently out of stock for "${formattedQuery}". They're known for quick restocking of popular items, so consider checking back in a few days.`;
      default:
        return `No products found matching "${formattedQuery}". Try adjusting your search or checking other stores.`;
    }
  };

  const filteredProducts = products.filter(product => {
    const shouldInclude = selectedStore === 'all' || product.store === STORE_MAP[selectedStore] || product.store === selectedStore;
    if (!shouldInclude) {
      console.log('[ProductComparison] Filtering out product:', { 
        title: product.title, 
        store: product.store,
        selectedStore,
        storeMap: STORE_MAP[selectedStore]
      });
    }
    return shouldInclude;
  });

  console.log('[ProductComparison] Rendering products:', {
    total: products.length,
    filtered: filteredProducts.length,
    selectedStore,
    stores: filteredProducts.map(p => p.store)
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="space-y-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Label htmlFor="search">Search Products</Label>
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="Enter product name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pr-10"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-48">
            <Label htmlFor="store">Store</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {STORES.map(store => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-32">
            <Label htmlFor="minBudget">Min Price (GHS)</Label>
            <Input
              id="minBudget"
              type="number"
              placeholder="Min"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              min="0"
            />
          </div>

          <div className="w-full md:w-32">
            <Label htmlFor="maxBudget">Max Price (GHS)</Label>
            <Input
              id="maxBudget"
              type="number"
              placeholder="Max"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              min="0"
            />
          </div>

          <div className="flex items-end">
            {loading ? (
              <Button type="button" variant="outline" onClick={handleCancelSearch}>
                Cancel
              </Button>
            ) : (
              <Button type="submit">Search</Button>
            )}
          </div>
        </div>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {loading && <SkeletonLoader />}

      {!loading && hasSearched && filteredProducts.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
          <p className="text-gray-600">
            {getNoProductsMessage(selectedStore, query)}
          </p>
          {selectedStore !== 'all' && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSelectedStore('all')}
            >
              Try All Stores
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="wait">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
