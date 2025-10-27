#!/bin/bash

echo "🚀 Setting up Mbarie FMS AI System..."
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual configuration"
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your actual configuration:"
echo "   - Database connection (DATABASE_URL)"
echo "   - OpenAI API key (OPENAI_API_KEY)"
echo "   - Email settings (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)"
echo "   - Company email addresses"
echo ""
echo "2. Set up your database:"
echo "   cd server && npx prisma db push"
echo ""
echo "3. Start the development servers:"
echo "   Backend: cd server && npm run dev"
echo "   Frontend: cd client && npm run dev"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo ""
echo "🎉 Your Mbarie FMS AI System is ready!"
