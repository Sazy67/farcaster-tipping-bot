import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  
  const manifest = {
    name: "Farcaster Tipping Bot",
    short_name: "TipBot",
    description: "Base ağında güvenli ve hızlı bahşiş gönderme sistemi. Farcaster frame'leri ile entegre.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait",
    scope: "/",
    lang: "tr",
    categories: ["finance", "social", "utilities", "productivity"],
    id: "farcaster-tipping-bot",
    dir: "ltr",
    
    // Farcaster özel alanları
    farcaster: {
      frame: {
        version: "vNext",
        imageAspectRatio: "1.91:1",
        buttons: [
          {
            label: "Bahşiş Gönder 💰",
            action: "post"
          }
        ],
        postUrl: `${baseUrl}/api/frame-actions`,
        imageUrl: `${baseUrl}/api/frames/images/welcome`
      },
      app: {
        name: "Farcaster Tipping Bot",
        url: baseUrl,
        description: "Base blockchain üzerinde güvenli bahşiş sistemi"
      }
    },
    
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon"
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    
    shortcuts: [
      {
        name: "Hızlı Bahşiş",
        short_name: "Tip",
        description: "Hızlı bahşiş gönder",
        url: "/",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }]
      },
      {
        name: "Frame Oluştur",
        short_name: "Frame",
        description: "Yeni frame URL'si oluştur",
        url: "/?action=create-frame",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }]
      }
    ],
    
    protocol_handlers: [
      {
        protocol: "web+farcaster",
        url: "/frame?url=%s"
      },
      {
        protocol: "farcaster",
        url: "/frame?url=%s"
      }
    ],
    
    share_target: {
      action: "/",
      method: "GET",
      params: {
        title: "title",
        text: "text", 
        url: "url"
      }
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400', // 24 saat cache
    },
  });
}