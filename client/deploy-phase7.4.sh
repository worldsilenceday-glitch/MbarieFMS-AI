#!/bin/bash

# Mbarie FMS AI - Phase 7.4 Deployment Script
# AI-Driven Recommendations & Actionable Insights

echo "🚀 Deploying Phase 7.4 - AI Recommendations & Actionable Insights"

# Check if we're in the client directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the client directory"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Deployment Instructions:"
    echo "1. Upload the 'dist' folder to Netlify"
    echo "2. Set environment variables:"
    echo "   - VITE_OPENAI_API_KEY=<your_openai_key>"
    echo "   - VITE_DEEPSEEK_API_KEY=<your_deepseek_key>"
    echo "   - VITE_API_BASE_URL=https://mbarie-fms-ai.netlify.app/api"
    echo ""
    echo "🔧 Features Deployed:"
    echo "   ✅ AI Recommendation Engine"
    echo "   ✅ Actionable Insights Panel"
    echo "   ✅ Smart Action Triggers"
    echo "   ✅ Enhanced Copilot with Contextual Awareness"
    echo "   ✅ Explainability Logging"
    echo "   ✅ DeepSeek + OpenAI Integration"
    echo ""
    echo "🌐 Local Development Server: http://localhost:5174/"
    echo "📊 AI Insights Dashboard with Recommendations is ready!"
else
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi
