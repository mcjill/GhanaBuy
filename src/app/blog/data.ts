export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  imageUrl: string;
  comingSoon?: boolean;
  topics: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'smart-shopping-guide',
    title: "Smart Shopping: How to Make Informed Purchase Decisions",
    excerpt: "Discover the key factors to consider when making purchase decisions and learn how to evaluate products effectively. This comprehensive guide will help you become a more informed and confident shopper.",
    date: "Coming Soon",
    readTime: "8 min read",
    author: "Can I Buy Team",
    imageUrl: "/blog/smart-shopping.jpg",
    comingSoon: true,
    topics: [
      "Understanding product specifications and features",
      "Evaluating price-to-value ratio",
      "Researching product reviews and ratings",
      "Comparing prices across different stores",
      "Identifying reliable sellers and stores",
      "Making sustainable purchase decisions"
    ]
  },
  {
    id: 2,
    slug: 'understanding-price-variations',
    title: "Understanding Price Variations Across Different Stores",
    excerpt: "Learn why prices vary between stores and how to use this knowledge to your advantage when shopping. We'll explore the factors that influence pricing and how to find the best deals.",
    date: "Coming Soon",
    readTime: "6 min read",
    author: "Can I Buy Team",
    imageUrl: "/blog/price-comparison.jpg",
    comingSoon: true,
    topics: [
      "Factors affecting product pricing",
      "Supply chain and its impact on prices",
      "Store overheads and pricing strategies",
      "Seasonal price variations",
      "Bulk buying vs. individual purchases",
      "Price matching policies"
    ]
  },
  {
    id: 3,
    slug: 'future-of-ecommerce-ghana',
    title: "The Future of E-commerce in Ghana",
    excerpt: "Explore the trends and innovations shaping the future of online shopping in Ghana. From mobile commerce to digital payments, discover what's next for Ghanaian e-commerce.",
    date: "Coming Soon",
    readTime: "10 min read",
    author: "Can I Buy Team",
    imageUrl: "/blog/ecommerce-future.jpg",
    comingSoon: true,
    topics: [
      "Mobile commerce trends",
      "Digital payment innovations",
      "Last-mile delivery solutions",
      "Social commerce integration",
      "AI and personalized shopping",
      "Cross-border e-commerce opportunities"
    ]
  }
];
