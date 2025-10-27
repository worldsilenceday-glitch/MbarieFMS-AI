#!/bin/bash

# Phase 7.6: Storekeeper & Inventory AI Deployment Script
# Deploys the complete inventory system to Netlify

echo "🚀 Phase 7.6: Storekeeper & Inventory AI Deployment"
echo "==================================================="

# Check if we're in the client directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the client directory"
    exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

echo "✅ Build completed successfully"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
echo "📝 Note: This will deploy to the existing site: lambent-raindrop-ec0707"

# Check if we're logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify:"
    netlify login
fi

# Deploy with environment variables
echo "🚀 Starting deployment..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Phase 7.6 Deployment Successful!"
    echo "==================================="
    echo ""
    echo "📊 What's Deployed:"
    echo "   ✅ Storekeeper Dashboard"
    echo "   ✅ Voice Inventory Controls"
    echo "   ✅ AI-Powered Inventory Management"
    echo "   ✅ Offline-First Design"
    echo "   ✅ Real-time Stock Alerts"
    echo "   ✅ Automatic Sync System"
    echo ""
    echo "🔗 Your application is live at:"
    echo "   https://lambent-raindrop-ec0707.netlify.app"
    echo ""
    echo "🎯 Features Available:"
    echo "   • Voice commands for inventory management"
    echo "   • Offline operation with automatic sync"
    echo "   • Real-time stock alerts and monitoring"
    echo "   • AI-driven insights and recommendations"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   1. Open the URL above"
    echo "   2. Navigate to Store Dashboard"
    echo "   3. Try voice commands:"
    echo "      - 'Add 50 liters of diesel'"
    echo "      - 'Check engine oil stock'"
    echo "      - 'List all inventory'"
    echo "      - 'Show stock alerts'"
    echo ""
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
