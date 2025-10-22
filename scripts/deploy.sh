#!/bin/bash

# Deployment script for Farcaster Tipping Bot
set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$PLATFORM_WALLET_ADDRESS" ]; then
    echo "❌ PLATFORM_WALLET_ADDRESS environment variable is required"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your Farcaster Tipping Bot is ready!"
echo "📊 Health check: /api/health"
echo "🖼️ Frame endpoint: /api/frames/tip/[recipientFid]"
echo "💰 Transaction API: /api/transactions"
echo ""
echo "📝 Next steps:"
echo "1. Set up monitoring and alerts"
echo "2. Configure your domain and SSL"
echo "3. Test the frame in Farcaster"
echo "4. Monitor transaction processing"