import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculateAffordability(
  price: number,
  income: number,
  expenses: number
): {
  affordable: boolean;
  savingMonths: number;
  monthlySavings: number;
} {
  const monthlySavings = income - expenses;
  const savingMonths = Math.ceil(price / monthlySavings);
  const affordable = monthlySavings > 0;

  return {
    affordable,
    savingMonths,
    monthlySavings,
  };
}
