import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Loader2 } from 'lucide-react';

interface FinancialFormProps {
  onSubmit: (data: {
    monthlyIncome: number;
    monthlyExpenses: number;
    savings: number;
    targetPrice: number;
    currency: string;
  }) => void;
}

export function FinancialForm({ onSubmit }: FinancialFormProps) {
  const [formData, setFormData] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    targetPrice: 0,
    currency: '',
  });
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rateError, setRateError] = useState('');

  useEffect(() => {
    if (formData.currency) {
      fetchExchangeRates(formData.currency);
    }
  }, [formData.currency]);

  const fetchExchangeRates = async (currency: string) => {
    setIsLoadingRates(true);
    setRateError('');
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setRateError('Unable to fetch current exchange rates');
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currency) {
      setRateError('Please select a currency');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'currency' ? value : parseFloat(value) || 0,
    }));
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Financial Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium">
              Currency
            </label>
            <CurrencySelect
              id="currency"
              name="currency"
              value={formData.currency}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
            />
            {isLoadingRates && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading exchange rates...
              </div>
            )}
            {rateError && (
              <p className="text-sm text-red-500 mt-1">{rateError}</p>
            )}
            {!isLoadingRates && !rateError && exchangeRates['USD'] && (
              <p className="text-sm text-muted-foreground mt-1">
                1 {formData.currency} = {exchangeRates['USD'].toFixed(4)} USD
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="monthlyIncome" className="text-sm font-medium">
              Monthly Income
            </label>
            <Input
              id="monthlyIncome"
              name="monthlyIncome"
              type="number"
              placeholder="Enter your monthly income"
              value={formData.monthlyIncome || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="monthlyExpenses" className="text-sm font-medium">
              Monthly Expenses
            </label>
            <Input
              id="monthlyExpenses"
              name="monthlyExpenses"
              type="number"
              placeholder="Enter your monthly expenses"
              value={formData.monthlyExpenses || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="savings" className="text-sm font-medium">
              Current Savings
            </label>
            <Input
              id="savings"
              name="savings"
              type="number"
              placeholder="Enter your current savings"
              value={formData.savings || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="targetPrice" className="text-sm font-medium">
              Target Price
            </label>
            <Input
              id="targetPrice"
              name="targetPrice"
              type="number"
              placeholder="Enter the price of the item"
              value={formData.targetPrice || ''}
              onChange={handleChange}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!formData.currency || isLoadingRates}
          >
            {isLoadingRates ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Analyze Affordability'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
