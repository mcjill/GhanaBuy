import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ScrapingResult } from '@/lib/scrapers/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PriceChartProps {
  searchResults: ScrapingResult;
  selectedCurrency: string;
}

export function PriceChart({ searchResults, selectedCurrency }: PriceChartProps) {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Price Comparison by Store',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: selectedCurrency,
            }).format(value);
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => {
            const numeric = typeof value === 'number' ? value : Number(value);
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: selectedCurrency,
              maximumFractionDigits: 0,
            }).format(numeric);
          },
        },
      },
    },
  };

  const data = {
    labels: searchResults.products.map(p => p.store),
    datasets: [
      {
        label: 'Price',
        data: searchResults.products.map(p => p.price),
        backgroundColor: searchResults.products.map((product, index) => {
          // Local stores get purple shades, global stores get blue shades
          const isGlobalStore = ['Amazon', 'eBay', 'AliExpress'].includes(product.store);
          const baseColor = isGlobalStore ? 'rgba(54, 162, 235,' : 'rgba(139, 92, 246,';
          const opacity = 1 - (index * 0.1);
          return `${baseColor} ${opacity})`;
        }),
        borderColor: searchResults.products.map(product =>
          ['Amazon', 'eBay', 'AliExpress'].includes(product.store)
            ? 'rgb(54, 162, 235)'
            : 'rgb(139, 92, 246)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-lg">
      <Bar options={options} data={data} />
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>Local stores shown in purple, global stores in blue</p>
        <p className="mt-1">Prices include shipping estimates</p>
      </div>
    </div>
  );
}
