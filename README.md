# Can I Buy? - Smart Purchase Price Comparison

A modern web application helping Ghanaian consumers make informed financial decisions by comparing product prices across e-commerce platforms.

## 🌐 Live Demo

Check out the live demo at [https://mcjill.github.io/Can-I-Buy](https://mcjill.github.io/Can-I-Buy)

## 🚀 Features

- Real-time price comparison across multiple platforms
- Location-based personalization
- Smart financial decision assistance
- Beautiful, responsive UI
- Cross-platform compatibility
- Blog with shopping insights and tips

## 🔍 Supported E-commerce Platforms

Currently, we support price comparison across these Ghanaian e-commerce platforms:

- CompuGhana
- Telefonika
- More platforms coming soon!

## 🤖 Smart Scraping Features

Our advanced scraping system includes:

- Intelligent relevancy scoring for accurate product matches
- Anti-bot detection avoidance
- Automatic retry mechanisms
- Smart product categorization
- Exact phrase matching
- Price normalization
- Robust error handling

## 🔄 Recent Updates

### December 2024
- Enhanced CompuGhana scraper with improved anti-bot measures
- Added intelligent relevancy scoring for better search results
- Improved error handling and retry mechanisms
- Enhanced product matching accuracy
- Added support for exact phrase matching
- Implemented smart category-based filtering

### Performance Improvements
- Optimized request handling
- Added request interception for faster page loads
- Implemented intelligent resource filtering
- Added exponential backoff for failed requests

## 🛠️ Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Prisma
- MySQL

## 🏃‍♂️ Getting Started

1. Clone the repository:
```bash
git clone https://github.com/mcjill/Can-I-Buy.git
cd Can-I-Buy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your configuration.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### GitHub Pages

The project is configured for automatic deployment to GitHub Pages. When you push to the `main` branch, GitHub Actions will:

1. Build the Next.js application
2. Export static files
3. Deploy to GitHub Pages

The deployment process is handled by the workflow in `.github/workflows/deploy.yml`.

To manually trigger a deployment:

1. Go to the repository's Actions tab
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"

### Environment Variables

For local development, create a `.env.local` file with:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

For production, set:

```bash
NEXT_PUBLIC_BASE_URL=https://mcjill.github.io/Can-I-Buy
```

## 📦 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📝 Documentation

- [Changelog](CHANGELOG.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🔒 Security

We take security seriously. All API keys and sensitive data are properly secured and never exposed to the client. See our [security documentation](SECURITY.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

If you have any questions or need help, please open an issue or contact the maintainers.
