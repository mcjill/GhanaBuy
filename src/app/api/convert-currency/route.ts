import { NextResponse } from 'next/server';

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

export async function POST(request: Request) {
  try {
    const { amount, from, to } = await request.json();

    if (!API_KEY) {
      throw new Error('Exchange rate API key not configured');
    }

    if (!amount || !from || !to) {
      return NextResponse.json(
        { error: 'Amount, from currency, and to currency are required' },
        { status: 400 }
      );
    }

    // Fetch the exchange rate
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/pair/${from}/${to}/${amount}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    
    return NextResponse.json({
      convertedAmount: data.conversion_result,
      rate: data.conversion_rate,
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}
