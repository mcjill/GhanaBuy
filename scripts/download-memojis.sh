#!/bin/bash

# Create memoji directory if it doesn't exist
mkdir -p public/memoji

# Download Memojis
curl -L https://raw.githubusercontent.com/Wimell/Tapback-Memojis/main/Memojis/Thinking%20Face.png -o public/memoji/thinking.png
curl -L https://raw.githubusercontent.com/Wimell/Tapback-Memojis/main/Memojis/Smiling%20Face.png -o public/memoji/happy.png
curl -L https://raw.githubusercontent.com/Wimell/Tapback-Memojis/main/Memojis/Face%20with%20Tears%20of%20Joy.png -o public/memoji/excited.png
curl -L https://raw.githubusercontent.com/Wimell/Tapback-Memojis/main/Memojis/Winking%20Face.png -o public/memoji/winking.png
curl -L https://raw.githubusercontent.com/Wimell/Tapback-Memojis/main/Memojis/Thumbs%20Up.png -o public/memoji/thumbs-up.png
curl -L https://raw.githubusercontent.com/Wimell/Tapback-Memojis/main/Memojis/Money-Mouth%20Face.png -o public/memoji/shopping.png
