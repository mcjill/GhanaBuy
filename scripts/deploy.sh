#!/bin/bash

# Ensure we're on the main branch
git checkout main

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build the project
npm run build

# Deploy
git add .
git commit -m "Deploy: $(date +"%Y-%m-%d %H:%M:%S")"
git push origin main

echo "Deployment initiated! Check the Actions tab on GitHub for progress."
