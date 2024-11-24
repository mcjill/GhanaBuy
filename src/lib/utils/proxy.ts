export interface ProxyConfig {
  enabled: boolean;
  apiKey?: string;
  service: 'scraperapi' | 'brightdata';
}

export function getProxyUrl(originalUrl: string, config: ProxyConfig): string {
  if (!config.enabled || !config.apiKey) {
    return originalUrl;
  }

  switch (config.service) {
    case 'scraperapi':
      return `http://api.scraperapi.com?api_key=${config.apiKey}&url=${encodeURIComponent(originalUrl)}`;
    case 'brightdata':
      // Add BrightData configuration if needed
      return originalUrl;
    default:
      return originalUrl;
  }
}

export const defaultProxyConfig: ProxyConfig = {
  enabled: true,
  apiKey: process.env.SCRAPER_API_KEY,
  service: 'scraperapi'
};
