# Deployment Guide for Can I Buy?

## Pre-deployment Checklist

### Environment Variables
1. Copy `.env.example` to `.env` and fill in:
   - `EXCHANGE_RATE_API_KEY`: Get from [ExchangeRate-API](https://www.exchangerate-api.com)
   - `NEXT_PUBLIC_APP_URL`: Your production URL
   - Other necessary API keys

### Performance Optimization
1. Images are optimized using Next.js Image component
2. Proper caching strategies implemented
3. Code splitting and lazy loading in place
4. API routes are optimized with proper error handling

### Security Measures
1. API keys are properly secured
2. Rate limiting implemented
3. CORS policies configured
4. Security headers set

## Deployment Steps

### 1. Initial Deployment to Vercel
1. Push your code to GitHub
2. Create `vercel.json` in the project root with a catch-all rewrite so client-side
   routing works after refreshing routes:

   ```json
   {
      "rewrites": [
        { "source": "/(.*)", "destination": "/" }
      ],
      "buildCommand": "npm run build",
      "outputDirectory": ".next"
    }
    ```
=======
     "rewrites": [
       { "source": "/(.*)", "destination": "/" }
     ],
     "buildCommand": "npm run build",
     "outputDirectory": "dist"
   }
   ```

3. Visit [Vercel](https://vercel.com)
4. Import your repository
5. In Project Settings choose the **Node.js** framework preset
6. Configure environment variables
7. Deploy

### 2. Custom Domain Setup (Optional)
1. Add your domain in Vercel
2. Configure DNS settings
3. Enable HTTPS

### 3. Monitoring Setup
1. Enable Vercel Analytics
2. Set up error tracking
3. Configure performance monitoring

## Release Process

### Version Control
- Use Semantic Versioning (MAJOR.MINOR.PATCH)
- Tag releases in Git
- Update changelog for each release

### Release Steps
1. Create a new branch for release: `release/vX.X.X`
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Create pull request
5. After review, merge to main
6. Tag the release
7. Deploy to production

### Rollback Process
1. Identify the last stable version
2. Use Vercel's rollback feature
3. If needed, revert to previous Git tag

## Monitoring and Maintenance

### Regular Checks
- Monitor error rates
- Check performance metrics
- Review API usage
- Monitor database performance

### Updates
- Regular dependency updates
- Security patches
- Feature updates
- Bug fixes

## Testing Before Release

### Automated Tests
- Run unit tests
- Run integration tests
- Check test coverage

### Manual QA
1. Cross-browser testing
2. Mobile responsiveness
3. Feature functionality
4. Error handling
5. Load testing

## Documentation

### API Documentation
- Keep API documentation updated
- Document all endpoints
- Include example requests/responses

### User Documentation
- Update FAQ
- Release notes
- User guides

## Emergency Procedures

### In Case of Issues
1. Monitor error logs
2. Assess impact
3. Quick fixes vs rollback decision
4. Communication plan

### Contact Information
- Development team contacts
- Emergency response team
- External service providers

## Continuous Integration/Deployment

### GitHub Actions Workflow
1. Automated tests
2. Code quality checks
3. Security scanning
4. Automated deployment

### Quality Gates
- Code coverage requirements
- Performance benchmarks
- Security requirements
- Accessibility standards
