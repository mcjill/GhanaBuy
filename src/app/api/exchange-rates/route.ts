import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
}

const CACHE: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function GET(request: Request) {
  let searchParams;
  try {
    // Validate request.url before constructing URL
    if (!request.url || typeof request.url !== 'string') {
      throw new Error('Request URL is missing or invalid');
    }
    searchParams = new URL(request.url).searchParams;
  } catch (error) {
    console.error('Invalid URL in request:', request.url, error);
    return NextResponse.json({ error: 'Invalid request URL' }, { status: 400 });
  }
  
  const from = searchParams.get('from')?.toUpperCase();
  const to = searchParams.get('to')?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing currency parameters. Please provide "from" and "to" currencies.' },
      { status: 400 }
    );
  }

  const cacheKey = `${from}-${to}`;
  const cachedData = CACHE[cacheKey];
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      conversion_rate: cachedData.rate,
      base_code: from,
      target_code: to,
      cached: true
    });
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      throw new Error('Exchange rate API key is not configured in environment variables');
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Can-I-Buy-App/1.0'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Exchange rate API error: ${response.status} ${response.statusText}. ${errorData.error || ''}`
      );
    }

    const data: ExchangeRateResponse = await response.json();
    
    if (!data.conversion_rate) {
      throw new Error('Invalid response from exchange rate API: missing conversion rate');
    }

    // Update cache
    CACHE[cacheKey] = {
      rate: data.conversion_rate,
      timestamp: Date.now()
    };

    return NextResponse.json({
      conversion_rate: data.conversion_rate,
      base_code: data.base_code,
      target_code: data.target_code,
      cached: false
    });

  } catch (error) {
    console.error('Exchange rate API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch exchange rate',
        from,
        to
      },
      { status: 500 }
    );
  }
}
