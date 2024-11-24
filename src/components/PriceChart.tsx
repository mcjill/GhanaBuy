import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ScrapedResults } from '@/utils/scrapers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PriceChartProps {
  searchResults: ScrapedResults;
  selectedCurrency: string;
}

export function PriceChart({ searchResults, selectedCurrency }: PriceChartProps) {
  const options = {
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
          callback: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: selectedCurrency,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  const data = {
    labels: Object.keys(searchResults),
    datasets: [
      {
        label: 'Price',
        data: Object.values(searchResults).map((product) => product.price),
        backgroundColor: Object.keys(searchResults).map((store, index) => {
          // Local stores get purple shades, global stores get blue shades
          const isGlobalStore = ['Amazon', 'eBay', 'AliExpress'].includes(store);
          const baseColor = isGlobalStore ? 'rgba(54, 162, 235,' : 'rgba(139, 92, 246,';
          const opacity = 1 - (index * 0.1);
          return `${baseColor} ${opacity})`;
        }),
        borderColor: Object.keys(searchResults).map((store) =>
          ['Amazon', 'eBay', 'AliExpress'].includes(store)
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
