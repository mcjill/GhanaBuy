export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const currencies: Currency[] = [
  // West African Currencies
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' }, // Used by 8 West African countries
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$' },

  // East African Currencies
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },

  // Southern African Currencies
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },

  // North African Currencies
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD' },

  // Central African Currencies
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' }, // Used by 6 Central African countries
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },

  // Major Global Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

const API_KEY = 'e36a81d4ef5a32f6ecbb1b90';
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
let rateCache: { [key: string]: { rate: number; timestamp: number } } = {};

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cachedRate = rateCache[cacheKey];
  
  if (cachedRate && (Date.now() - cachedRate.timestamp) < CACHE_DURATION) {
    return cachedRate.rate;
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const rate = data.conversion_rate;

    // Cache the new rate
    rateCache[cacheKey] = {
      rate,
      timestamp: Date.now()
    };

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    if (cachedRate) {
      // Use expired cache as fallback
      return cachedRate.rate;
    }
    throw error;
  }
}

export async function convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;
    
    // Round to 2 decimal places
    return Math.round(convertedAmount * 100) / 100;
  } catch (error) {
    console.error('Error converting price:', error);
    return amount; // Return original amount if conversion fails
  }
}

export function formatCurrencyWithSymbol(amount: number, currencyCode: string): string {
  const currency = currencies.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function getCurrencySymbol(code: string): string {
  return currencies.find(c => c.code === code)?.symbol || code;
}

export function calculateAffordability(
  monthlyIncome: number,
  productPrice: number,
  currency: string
): {
  affordabilityPercentage: number;
  monthsToSave: number;
  recommendation: string;
} {
  // Calculate what percentage of monthly income the product represents
  const affordabilityPercentage = (productPrice / monthlyIncome) * 100;

  // Calculate how many months it would take to save for the product
  // Assuming 20% of monthly income can be saved
  const monthlySavings = monthlyIncome * 0.2;
  const monthsToSave = Math.ceil(productPrice / monthlySavings);

  let recommendation = '';
  if (affordabilityPercentage <= 10) {
    recommendation = 'This purchase is within your budget. You can comfortably afford it.';
  } else if (affordabilityPercentage <= 30) {
    recommendation = `This purchase would take ${monthsToSave} months to save for, setting aside 20% of your income. Consider if it fits your financial goals.`;
  } else if (affordabilityPercentage <= 50) {
    recommendation = 'This is a significant purchase. We recommend careful consideration and possibly exploring more affordable alternatives.';
  } else {
    recommendation = 'This purchase might strain your finances. Consider saving for a longer period or looking for alternatives.';
  }

  return {
    affordabilityPercentage,
    monthsToSave,
    recommendation,
  };
}
