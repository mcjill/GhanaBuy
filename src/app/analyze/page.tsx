'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { currencies, Currency } from '@/lib/currencies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  source: string;
}

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
}

export default function AnalyzePage() {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [budget, setBudget] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>('');
  const [affordableProducts, setAffordableProducts] = useState<Product[]>([]);
  const [alternativeSuggestions, setAlternativeSuggestions] = useState<Product[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [usdRate, setUsdRate] = useState<number | null>(null);

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!selectedCurrency?.code) {
        setExchangeRate(null);
        setUsdRate(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/exchange-rates?from=USD&to=${selectedCurrency.code}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch exchange rate: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setExchangeRate(data);
        setUsdRate(data.rate);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setExchangeRate(null);
        setUsdRate(null);
      }
    };

    fetchExchangeRate();
  }, [selectedCurrency]);

  // Convert amount from selected currency to USD
  const convertToUSD = (amount: number): number => {
    if (!usdRate || !selectedCurrency?.code) return amount;
    return amount / usdRate;
  };

  // Convert amount from USD to selected currency
  const convertFromUSD = (amount: number): number => {
    if (!usdRate || !selectedCurrency?.code) return amount;
    return amount * usdRate;
  };

  // Format amount with currency symbol
  const formatAmount = (amount: number): string => {
    if (!selectedCurrency?.code) return `$ ${amount.toLocaleString()}`;
    return `${selectedCurrency.symbol} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const analyzeAffordability = async () => {
    setLoading(true);
    try {
      // Convert all input values to USD for calculations
      const income = convertToUSD(parseFloat(monthlyIncome));
      const expenses = convertToUSD(parseFloat(monthlyExpenses));
      const targetBudget = convertToUSD(parseFloat(budget));

      // Calculate disposable income
      const disposableIncome = income - expenses;
      
      // Search for products
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: productSearch,
          budget: targetBudget, // Send USD budget to API
        }),
      });

      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid response format from search API');
      }

      // Convert product prices to USD for comparison
      const products = data.products.map((product: Product) => ({
        ...product,
        price: convertToUSD(product.price)
      }));

      if (products.length === 0) {
        setResult({
          type: 'info',
          title: 'No Products Found',
          summary: 'No products found matching your search.',
          details: ['Try adjusting your search terms or budget.'],
          suggestion: 'Consider using more general search terms.'
        });
        setLoading(false);
        return;
      }

      // Filter affordable products
      const affordable = products.filter((product: Product) => product.price <= targetBudget);
      setAffordableProducts(affordable.map((product: Product) => ({
        ...product,
        price: convertFromUSD(product.price) // Convert back to selected currency for display
      })));

      // Get minimum price for analysis
      const minJijiPrice = Math.min(...products.map((p: Product) => p.price));
      const priceDifference = minJijiPrice - targetBudget;

      if (affordable.length === 0) {
        // Show alternative suggestions with lower prices
        const alternatives = products
          .filter((p: Product) => p.price < minJijiPrice)
          .slice(0, 6);
        
        setAlternativeSuggestions(alternatives.map((product: Product) => ({
          ...product,
          price: convertFromUSD(product.price) // Convert back to selected currency for display
        })));
        setShowAlternatives(true);
        
        // Enhanced analysis message for unaffordable items
        setResult({
          type: 'warning',
          title: 'Price Gap Analysis',
          summary: `Your budget is ${formatAmount(convertFromUSD(Math.abs(priceDifference)))} below the lowest price found`,
          details: [
            `🎯 Your Budget: ${formatAmount(parseFloat(budget))}`,
            `💰 Lowest Price Found: ${formatAmount(convertFromUSD(minJijiPrice))}`,
            `📊 Monthly Income: ${formatAmount(parseFloat(monthlyIncome))}`,
            `💳 Monthly Expenses: ${formatAmount(parseFloat(monthlyExpenses))}`,
            `💵 Monthly Savings Potential: ${formatAmount(parseFloat(monthlyIncome) - parseFloat(monthlyExpenses))}`
          ],
          suggestion: disposableIncome > 0 
            ? `With your current savings potential of ${formatAmount(parseFloat(monthlyIncome) - parseFloat(monthlyExpenses))} per month, you could afford this item in ${Math.ceil(priceDifference / disposableIncome)} months.`
            : "Consider reviewing your expenses or exploring our alternative suggestions below."
        });
      } else {
        setShowAlternatives(false);
        // Enhanced analysis for affordable items
        const affordabilityPercentage = (targetBudget / disposableIncome) * 100;
        
        let analysisResult = {
          type: 'success',
          title: 'Affordability Analysis',
          summary: '',
          details: [
            `🎯 Your Budget: ${formatAmount(parseFloat(budget))}`,
            `📊 Monthly Income: ${formatAmount(parseFloat(monthlyIncome))}`,
            `💳 Monthly Expenses: ${formatAmount(parseFloat(monthlyExpenses))}`,
            `💵 Monthly Savings: ${formatAmount(parseFloat(monthlyIncome) - parseFloat(monthlyExpenses))}`
          ],
          suggestion: ''
        };

        if (disposableIncome >= targetBudget) {
          if (affordabilityPercentage <= 30) {
            analysisResult.type = 'success';
            analysisResult.summary = '✅ This purchase is well within your budget!';
            analysisResult.suggestion = 'This is a financially sound purchase that aligns well with your budget.';
          } else if (affordabilityPercentage <= 50) {
            analysisResult.type = 'info';
            analysisResult.summary = '📊 This purchase is affordable but significant.';
            analysisResult.suggestion = 'While you can afford this, consider if there are any upcoming expenses.';
          } else {
            analysisResult.type = 'warning';
            analysisResult.summary = '⚠️ This purchase is at the upper limit of your budget.';
            analysisResult.suggestion = 'While technically affordable, this purchase would use a large portion of your disposable income.';
          }
        } else {
          analysisResult.type = 'error';
          analysisResult.summary = '❌ This purchase might strain your monthly budget.';
          analysisResult.suggestion = 'Consider saving for a few months or exploring more affordable alternatives.';
        }

        setResult(analysisResult);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        type: 'error',
        title: 'Analysis Error',
        summary: 'Failed to analyze affordability',
        details: ['An error occurred while analyzing the purchase.'],
        suggestion: 'Please try again or contact support if the problem persists.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate alternative search queries
  const getAlternativeSearchQuery = (query: string) => {
    // Remove specific model numbers or variants
    const genericQuery = query.replace(/\d+/g, '').trim();
    
    // Add "used" or "refurbished" if it's an electronic item
    const electronics = ['phone', 'laptop', 'computer', 'tv', 'camera', 'iphone', 'samsung'];
    if (electronics.some(item => query.toLowerCase().includes(item))) {
      return `used ${genericQuery}`;
    }
    
    // For other items, just use the generic query
    return genericQuery;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Analyze Purchase Affordability</h1>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">What would you like to buy?</label>
            <Input
              type="text"
              placeholder="e.g., iPhone 15, Samsung TV, PS5"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <Select
                value={selectedCurrency?.code || ""}
                onValueChange={(value) => {
                  const currency = currencies.find(c => c.code === value);
                  setSelectedCurrency(currency || null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem 
                      key={currency.code} 
                      value={currency.code}
                    >
                      {currency.symbol} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {exchangeRate && selectedCurrency?.code && (
              <div className="flex items-center">
                <div className="text-sm text-gray-600">
                  <p>Exchange Rate:</p>
                  <p className="font-medium">
                    1 USD = {exchangeRate.rate.toFixed(4)} {selectedCurrency.code}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Income {selectedCurrency?.code ? `(${selectedCurrency.symbol})` : '(USD)'}
            </label>
            <Input
              type="number"
              placeholder={`Enter your monthly income in ${selectedCurrency?.code || 'USD'}`}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Expenses {selectedCurrency?.code ? `(${selectedCurrency.symbol})` : '(USD)'}
            </label>
            <Input
              type="number"
              placeholder={`Enter your monthly expenses in ${selectedCurrency?.code || 'USD'}`}
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Budget {selectedCurrency?.code ? `(${selectedCurrency.symbol})` : '(USD)'}
            </label>
            <Input
              type="number"
              placeholder={`Enter your budget in ${selectedCurrency?.code || 'USD'}`}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={analyzeAffordability}
            disabled={loading || !monthlyIncome || !monthlyExpenses || !budget || !productSearch}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Affordability'
            )}
          </Button>
        </Card>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className={`p-6 border-l-4 ${
              result.type === 'success' ? 'border-l-green-500 bg-green-50' :
              result.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
              result.type === 'error' ? 'border-l-red-500 bg-red-50' :
              'border-l-blue-500 bg-blue-50'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${
                    result.type === 'success' ? 'text-green-700' :
                    result.type === 'warning' ? 'text-yellow-700' :
                    result.type === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {result.title}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.type === 'success' ? 'bg-green-100 text-green-800' :
                    result.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    result.type === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {result.type === 'success' ? 'Affordable' :
                     result.type === 'warning' ? 'Price Gap' :
                     result.type === 'error' ? 'Not Affordable' :
                     'Planning Needed'}
                  </span>
                </div>

                <p className={`text-lg font-medium ${
                  result.type === 'success' ? 'text-green-600' :
                  result.type === 'warning' ? 'text-yellow-600' :
                  result.type === 'error' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {result.summary}
                </p>

                <div className="space-y-2 py-3">
                  {result.details.map((detail, index) => (
                    <p key={index} className="text-gray-600">
                      {detail}
                    </p>
                  ))}
                </div>

                <div className={`mt-4 p-4 rounded-lg ${
                  result.type === 'success' ? 'bg-green-100 text-green-700' :
                  result.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  result.type === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  <p className="font-medium">
                    💡 Suggestion: {result.suggestion}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {affordableProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Products Within Your Budget</h2>
              <p className="text-gray-600">
                We found {affordableProducts.length} product{affordableProducts.length === 1 ? '' : 's'} matching "{productSearch}" that fit your budget of {formatAmount(parseFloat(budget))}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affordableProducts.map((product, index) => (
                <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48">
                    <Image
                      src={product.image || '/placeholder.png'}
                      alt={product.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 font-medium text-lg">
                          {formatAmount(product.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {((product.price / parseFloat(budget)) * 100).toFixed(0)}% of your budget
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Budget
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          from {product.source}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors mt-4"
                    >
                      View Details
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {showAlternatives && alternativeSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Alternative Options</h2>
              <p className="text-gray-600">
                Here are some similar products that might interest you
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alternativeSuggestions.map((product, index) => (
                <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48">
                    <Image
                      src={product.image || '/placeholder.png'}
                      alt={product.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 font-medium text-lg">
                          {formatAmount(product.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {((product.price / parseFloat(budget)) * 100).toFixed(0)}% of your budget
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Alternative
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          from {product.source}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors mt-4"
                    >
                      View Details
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
