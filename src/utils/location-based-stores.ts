interface Store {
  name: string;
  url: string;
  logo: string;
  currency: string;
  shipping: string;
  baseRating: number;
  baseReviews: number;
  priority: number;
}

interface CountryStores {
  [key: string]: {
    localStores: Store[];
    currency: string;
    name: string;
  };
}

// Define stores by country
export const storesByCountry: CountryStores = {
  'GH': {
    name: 'Ghana',
    currency: 'GHS',
    localStores: [
      {
        name: 'CompuGhana',
        url: 'https://compughana.com',
        logo: '/images/stores/compughana.png',
        currency: 'GHS',
        shipping: '1-3',
        baseRating: 4.6,
        baseReviews: 25000,
        priority: 1
      },
      {
        name: 'Telefonika',
        url: 'https://telefonika.com',
        logo: '/images/stores/telefonika.png',
        currency: 'GHS',
        shipping: '1-3',
        baseRating: 4.5,
        baseReviews: 20000,
        priority: 2
      },
      {
        name: 'Jumia Ghana',
        url: 'https://www.jumia.com.gh',
        logo: '/images/stores/jumia.png',
        currency: 'GHS',
        shipping: '2-5',
        baseRating: 4.4,
        baseReviews: 150000,
        priority: 3
      },
      {
        name: 'Melcom Ghana',
        url: 'https://www.melcom.com',
        logo: 'https://www.melcom.com/media/logo/stores/1/melcom_logo.png',
        currency: 'GHS',
        shipping: '2-5',
        baseRating: 4.4,
        baseReviews: 75000,
        priority: 4
      },
      {
        name: 'Tonaton Ghana',
        url: 'https://tonaton.com',
        logo: 'https://tonaton.com/assets/img/ton-logo.png',
        currency: 'GHS',
        shipping: '1-3',
        baseRating: 4.2,
        baseReviews: 50000,
        priority: 5
      },
      {
        name: 'Jiji Ghana',
        url: 'https://jiji.com.gh',
        logo: 'https://play-lh.googleusercontent.com/0WzLuS8DGG7CGvCxYyuGtxg1WkZHiFSVwUzwXXhYE6e7P-Qdp2l_g6RqQKevn_g_Xg',
        currency: 'GHS',
        shipping: '1-3',
        baseRating: 4.3,
        baseReviews: 75000,
        priority: 6
      },
      {
        name: 'Franko Trading',
        url: 'https://frankotrading.com',
        logo: 'https://frankotrading.com/wp-content/uploads/2020/07/franko-logo.png',
        currency: 'GHS',
        shipping: '2-5',
        baseRating: 4.2,
        baseReviews: 35000,
        priority: 7
      }
    ]
  },
  'NG': {
    name: 'Nigeria',
    currency: 'NGN',
    localStores: [
      {
        name: 'Jumia Nigeria',
        url: 'https://www.jumia.com.ng',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Jumia_Group_Logo_2019.png/1200px-Jumia_Group_Logo_2019.png',
        currency: 'NGN',
        shipping: '2-5',
        baseRating: 4.5,
        baseReviews: 250000,
        priority: 1
      },
      {
        name: 'Konga',
        url: 'https://www.konga.com',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Konga_Online_Shopping_Logo.png/1200px-Konga_Online_Shopping_Logo.png',
        currency: 'NGN',
        shipping: '2-5',
        baseRating: 4.4,
        baseReviews: 200000,
        priority: 2
      },
      {
        name: 'Jiji Nigeria',
        url: 'https://jiji.ng',
        logo: 'https://play-lh.googleusercontent.com/0WzLuS8DGG7CGvCxYyuGtxg1WkZHiFSVwUzwXXhYE6e7P-Qdp2l_g6RqQKevn_g_Xg',
        currency: 'NGN',
        shipping: '1-3',
        baseRating: 4.3,
        baseReviews: 150000,
        priority: 3
      }
    ]
  }
};

// Global stores available everywhere
export const globalStores: Store[] = [
  {
    name: 'Amazon',
    url: 'https://www.amazon.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png',
    currency: 'USD',
    shipping: '7-14',
    baseRating: 4.8,
    baseReviews: 2500000,
    priority: 10
  },
  {
    name: 'eBay',
    url: 'https://www.ebay.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/EBay_logo.svg/2560px-EBay_logo.svg.png',
    currency: 'USD',
    shipping: '10-21',
    baseRating: 4.6,
    baseReviews: 1800000,
    priority: 11
  },
  {
    name: 'AliExpress',
    url: 'https://www.aliexpress.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/AliExpress_logo.svg/2560px-AliExpress_logo.svg.png',
    currency: 'USD',
    shipping: '15-30',
    baseRating: 4.5,
    baseReviews: 2000000,
    priority: 12
  }
];

export function getLocationBasedStores(countryCode: string): Store[] {
  // Normalize the country code so lookups are case-insensitive
  const normalizedCode = countryCode.toUpperCase();
  const countryStores = storesByCountry[normalizedCode]?.localStores || [];
  return [...countryStores, ...globalStores].sort((a, b) => a.priority - b.priority);
}

export function getUserCountry(): Promise<string> {
  return fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => data.country)
    .catch(() => 'GH'); // Default to Ghana if geolocation fails
}
