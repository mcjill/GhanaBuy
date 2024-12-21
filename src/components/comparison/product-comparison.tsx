'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { currencies } from '@/lib/currency';
import { PlusCircle, Trash2, ArrowLeftRight, Search, Loader2 } from 'lucide-react';
import { Product } from '@/lib/scrapers/types';
import { ProductCard } from './product-card';
import { LoadingAnimation } from '../ui/loading-animation';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const CurrencySelect = ({ value, onValueChange }: CurrencySelectProps) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="w-full h-12 px-4 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
  >
    {currencies.map((currency) => (
      <option key={currency.code} value={currency.code}>
        {currency.name} ({currency.symbol})
      </option>
    ))}
  </select>
);

export function ProductComparison() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [error, setError] = useState(null);
  const [activeStore, setActiveStore] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          store: activeStore
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setAllProducts(data.products);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Currency conversion rates (simplified for now)
  const conversionRates: Record<string, number> = {
    'GHS_USD': 0.08,  // 1 GHS = 0.08 USD
    'USD_GHS': 12.5,  // 1 USD = 12.5 GHS
    'GHS_EUR': 0.073, // 1 GHS = 0.073 EUR
    'EUR_GHS': 13.7,  // 1 EUR = 13.7 GHS
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = conversionRates[rateKey];
    
    if (!rate) {
      console.warn(`No conversion rate found for ${fromCurrency} to ${toCurrency}`);
      return amount;
    }
    
    return amount * rate;
  };

  // Update products when currency changes
  useEffect(() => {
    if (!allProducts.length) return;

    const updatedProducts = allProducts.map(product => ({
      ...product,
      price: convertCurrency(product.price, product.currency, selectedCurrency),
      currency: selectedCurrency
    }));

    setAllProducts(updatedProducts);
  }, [selectedCurrency, allProducts]);

  // Filter products based on active store
  const filteredProducts = useMemo(() => {
    if (activeStore === 'all') {
      return allProducts;
    }
    return allProducts.filter(product => {
      const storeName = product.store.toLowerCase();
      if (activeStore === 'jiji') {
        return storeName.includes('jiji');
      }
      return storeName.includes(activeStore.toLowerCase());
    });
  }, [allProducts, activeStore]);

  // Calculate pagination
  const productsPerPage = 12;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Get store-specific stats
  const getStoreCount = (storeName: string) => {
    if (storeName === 'All Stores') return allProducts.length;
    return allProducts.filter(product => 
      product.store.toLowerCase().includes(storeName.toLowerCase())
    ).length;
  };

  const storeStats = [
    { name: 'all', displayName: 'All Stores', count: allProducts.length },
    { name: 'jiji', displayName: 'Jiji Ghana', count: getStoreCount('Jiji') },
    { name: 'jumia', displayName: 'Jumia', count: getStoreCount('Jumia') },
    { name: 'compughana', displayName: 'CompuGhana', count: getStoreCount('CompuGhana') },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto space-y-4">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-24"
          />
          <Button
            onClick={handleSearch}
            className="absolute right-0 top-0 h-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center space-x-2">
          <CurrencySelect
            value={selectedCurrency}
            onValueChange={setSelectedCurrency}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <LoadingAnimation />
      ) : (
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeStore} onValueChange={setActiveStore}>
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-[600px] grid-cols-4">
                <TabsTrigger value="all" className="px-8">All</TabsTrigger>
                <TabsTrigger value="jiji" className="px-8">Jiji</TabsTrigger>
                <TabsTrigger value="jumia" className="px-8">Jumia</TabsTrigger>
                <TabsTrigger value="compughana" className="px-8">CompuGhana</TabsTrigger>
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
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="jumia" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compughana" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
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
      {!isLoading && filteredProducts.length === 0 && (
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
