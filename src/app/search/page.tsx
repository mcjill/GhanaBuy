'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  productUrl: string;
  imageUrl: string;
  store: string;
  availability: boolean;
  rating?: number;
  reviews?: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResults([]); // Clear previous results
    
    try {
      setLoadingMessage('Searching across stores...');
      setLoadingProgress(10);
      
      const response = await fetch(`/api/search-products?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      setLoadingProgress(90);
      setLoadingMessage('Processing results...');

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch results');
      
      setSearchResults(data.products || []);
      setLoadingProgress(100);
      
      // Update URL without triggering a full page reload
      try {
        const params = new URLSearchParams(window.location.search);
        params.set('q', searchQuery);
        router.push(`/search?${params.toString()}`, { 
          scroll: false
        });
      } catch (error) {
        console.error('Error updating URL parameters:', error);
        // Fallback to simple query parameter
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingMessage('');
    }
  };

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam !== searchQuery) {
      setSearchQuery(queryParam || '');
      if (queryParam) {
        handleSearch(new Event('submit') as any);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam !== searchQuery) {
      handleSearch(new Event('submit') as any);
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">{loadingMessage}</p>
            <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">{loadingProgress}% complete</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((product, index) => (
                <div
                  key={`${product.store}-${index}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <a
                    href={product.productUrl && product.productUrl.startsWith('http') ? product.productUrl : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4"
                  >
                    <div className="relative h-48 mb-4">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-semibold text-blue-600">
                        {product.currency} {product.price.toLocaleString()}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.store}
                        </span>
                        {product.rating && product.rating > 0 && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 text-sm">★</span>
                            <span className="ml-1 text-xs text-gray-600">
                              {product.rating.toFixed(1)}
                            </span>
                            {product.reviews && product.reviews > 0 && (
                              <span className="ml-1 text-xs text-gray-400">
                                ({product.reviews})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No results found for "{searchQuery}"</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
