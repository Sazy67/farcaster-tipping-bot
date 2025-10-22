import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://farcaster-tipping-bot.vercel.app';
  
  const farcasterManifest = {
    "accountAssociation": {
      "header": "eyJmaWQiOjYyMTkyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2NzgifQ",
      "payload": "eyJkb21haW4iOiJmYXJjYXN0ZXItdGlwcGluZy1ib3QudmVyY2VsLmFwcCJ9",
      "signature": "MHg4OWI5YzlhNjU0ZjE2YTEzMzQ4ZjQ4MzI2YzE2NzI4ZjE2YTEzMzQ4ZjQ4MzI2YzE2NzI4ZjE2YTEzMzQ4ZjQ4MzI2YzE2NzI4ZjE2YTEzMzQ4ZjQ4MzI2YzE2NzI4ZjE2YTEzMzQ4ZjQ4MzI2YzE2NzI4"
    },
    "frame": {
      "name": "Farcaster Tipping Bot",
      "version": "1.0.0",
      "iconUrl": `${baseUrl}/icon-192x192.png`,
      "homeUrl": baseUrl,
      "imageUrl": `${baseUrl}/api/frames/images/welcome`,
      "buttonTitle": "Bahşiş Gönder 💰",
      "splashImageUrl": `${baseUrl}/api/frames/images/welcome`,
      "splashBackgroundColor": "#3B82F6",
      "webhookUrl": `${baseUrl}/api/frame-actions`
    },
    "app": {
      "name": "Farcaster Tipping Bot",
      "description": "Base ağında güvenli ve hızlı bahşiş gönderme sistemi",
      "version": "1.0.0",
      "author": "Farcaster Tipping Bot Team",
      "website": baseUrl,
      "license": "MIT",
      "categories": ["finance", "social", "utilities"],
      "keywords": ["farcaster", "tipping", "base", "blockchain", "crypto", "bahşiş", "ethereum"],
      "supportedChains": ["base"],
      "permissions": [
        "read_profile",
        "send_transactions",
        "read_wallet"
      ]
    },
    "metadata": {
      "displayName": "Farcaster Tipping Bot",
      "description": "Base blockchain üzerinde güvenli, hızlı ve kolay bahşiş gönderme sistemi. Farcaster frame'leri ile entegre.",
      "image": `${baseUrl}/icon-512x512.png`,
      "url": baseUrl
    },
    "walletConnect": {
      "projectId": process.env.NEXT_PUBLIC_FARCASTER_WC_PROJECT_ID || "wc_secret_e9e013890648fa50208e33fedab2f3c15ca762e44df543c7fd3bd5d8_68eb8feb",
      "metadata": {
        "name": "Farcaster Tipping Bot",
        "description": "Base ağında güvenli bahşiş gönderme sistemi",
        "url": baseUrl,
        "icons": [`${baseUrl}/icon-192x192.png`]
      }
    },
    "endpoints": {
      "frames": {
        "tip": `${baseUrl}/api/frames/tip/{recipientFid}`,
        "tipByUsername": `${baseUrl}/api/frames/tip/username/{username}`
      },
      "api": {
        "health": `${baseUrl}/api/health`,
        "transactions": `${baseUrl}/api/transactions`,
        "userSearch": `${baseUrl}/api/farcaster/user/{username}`
      }
    },
    "features": {
      "tipping": {
        "enabled": true,
        "supportedTokens": ["ETH"],
        "minAmount": "0.001",
        "maxAmount": "0.1",
        "platformFee": "0.2"
      },
      "frames": {
        "enabled": true,
        "version": "vNext",
        "aspectRatio": "1.91:1"
      },
      "notifications": {
        "enabled": true,
        "types": ["transaction_sent", "transaction_received", "transaction_confirmed"]
      }
    },
    "social": {
      "farcaster": {
        "enabled": true,
        "developerFid": "62192"
      }
    },
    "created": "2024-10-22T15:30:00.000Z",
    "updated": new Date().toISOString()
  };

  return NextResponse.json(farcasterManifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}