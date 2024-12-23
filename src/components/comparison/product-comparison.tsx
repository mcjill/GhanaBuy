'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/scrapers/types';
import { ProductCard } from './product-card';
import { LoadingAnimation } from '../ui/loading-animation';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { currencies, convertPrice, Currency } from '@/lib/currency';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlusCircle, Trash2, ArrowLeftRight, Search, Loader2 } from 'lucide-react';

export function ProductComparison() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [convertedProducts, setConvertedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [activeStore, setActiveStore] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize search query from URL params only on initial load
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !searchQuery) {
      setSearchQuery(query);
      handleSearch(null, query);
    }
  }, []);

  // Add this effect to handle currency conversion
  useEffect(() => {
    const updatePrices = async () => {
      if (!allProducts.length) return;
      
      try {
        const updatedProducts = await Promise.all(
          allProducts.map(async (product) => {
            if (product.currency === selectedCurrency) {
              return product;
            }

            try {
              const convertedPrice = await convertPrice(
                product.price,
                product.currency,
                selectedCurrency
              );

              return {
                ...product,
                price: convertedPrice,
                currency: selectedCurrency
              };
            } catch (error) {
              console.error(`Failed to convert price for product ${product.id}:`, error);
              return product;
            }
          })
        );

        setAllProducts(updatedProducts);
      } catch (error) {
        console.error('Error updating prices:', error);
      }
    };

    updatePrices();
  }, [selectedCurrency]);

  // Update the handleSearch function to include currency
  const handleSearch = async (e: React.FormEvent | null, initialQuery?: string) => {
    if (e) {
      e.preventDefault();
    }

    const query = initialQuery || searchQuery;
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      setAllProducts([]); // Clear previous results

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          currency: selectedCurrency 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.products)) {
        // Convert prices if needed
        const productsWithConvertedPrices = await Promise.all(
          data.products.map(async (product: Product) => {
            if (product.currency === selectedCurrency) {
              return product;
            }

            try {
              const convertedPrice = await convertPrice(
                product.price,
                product.currency,
                selectedCurrency
              );

              return {
                ...product,
                price: convertedPrice,
                currency: selectedCurrency
              };
            } catch (error) {
              console.error(`Failed to convert price for product ${product.id}:`, error);
              return product;
            }
          })
        );

        setAllProducts(productsWithConvertedPrices);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the currency change handler
  const handleCurrencyChange = async (value: string) => {
    setSelectedCurrency(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    if (newValue === '') {
      setAllProducts([]);
      setConvertedProducts([]);
      setError(null);
      router.push('/compare');
    }
  };

  // Filter products based on active store
  const filteredProducts = allProducts;
  const filteredProductsByStore = filteredProducts.filter(product => {
    if (activeStore === 'all') {
      return true;
    }
    const storeName = product.store.toLowerCase();
    if (activeStore === 'jiji') {
      return storeName.includes('jiji');
    }
    return storeName.includes(activeStore.toLowerCase());
  });

  // Calculate pagination
  const productsPerPage = 12;
  const totalPages = Math.ceil(filteredProductsByStore.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProductsByStore.slice(startIndex, endIndex);

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto space-y-4">
        <form onSubmit={handleSearch} className="relative w-full">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search for products..."
            className="pr-24"
            autoComplete="off"
          />
          <Button
            type="submit"
            onClick={handleSearch}
            className="absolute right-0 top-0 h-full"
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </form>

        {/* Currency Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="border rounded-md px-3 py-2 bg-white"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <LoadingAnimation />
      ) : (
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeStore} onValueChange={setActiveStore}>
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-[800px] grid-cols-5">
                <TabsTrigger value="all" className="px-6">All</TabsTrigger>
                <TabsTrigger value="jiji" className="px-6">Jiji</TabsTrigger>
                <TabsTrigger value="jumia" className="px-6">Jumia</TabsTrigger>
                <TabsTrigger value="compughana" className="px-6">CompuGhana</TabsTrigger>
                <TabsTrigger value="telefonika" className="px-6">Telefonika</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="jiji" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts
                  .filter(product => product.store.toLowerCase() === 'jiji ghana')
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="jumia" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts
                  .filter(product => product.store.toLowerCase() === 'jumia')
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="compughana" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts
                  .filter(product => product.store.toLowerCase() === 'compughana')
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="telefonika" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts
                  .filter(product => product.store.toLowerCase() === 'telefonika')
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  className={`w-10 h-10 p-0 ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {!isLoading && filteredProductsByStore.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or selecting a different store.
          </p>
        </div>
      )}
    </div>
  );
}
