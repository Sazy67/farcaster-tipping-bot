import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farcaster Tipping Bot - Base Ağında Güvenli Bahşiş Sistemi",
  description: "Base blockchain üzerinde güvenli, hızlı ve kolay bahşiş gönderme sistemi. Farcaster frame'leri ile entegre.",
  keywords: ["farcaster", "tipping", "base", "blockchain", "crypto", "bahşiş", "ethereum"],
  authors: [{ name: "Farcaster Tipping Bot" }],
  creator: "Farcaster Tipping Bot",
  publisher: "Farcaster Tipping Bot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: '/',
    title: 'Farcaster Tipping Bot',
    description: 'Base blockchain üzerinde güvenli, hızlı ve kolay bahşiş gönderme sistemi',
    siteName: 'Farcaster Tipping Bot',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Farcaster Tipping Bot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farcaster Tipping Bot',
    description: 'Base blockchain üzerinde güvenli bahşiş sistemi',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  other: {
    // Farcaster Frame Meta Tags
    'fc:frame': 'vNext',
    'fc:frame:image': '/api/frames/images/welcome',
    'fc:frame:button:1': 'Bahşiş Gönder 💰',
    'fc:frame:button:1:action': 'post',
    'fc:frame:post_url': '/api/frame-actions',
    
    // Additional Farcaster Meta
    'farcaster:frame': 'vNext',
    'farcaster:frame:image': '/api/frames/images/welcome',
    'farcaster:frame:button:1': 'Bahşiş Gönder 💰',
    'farcaster:frame:button:1:action': 'post',
    'farcaster:frame:post_url': '/api/frame-actions',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TipBot" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Farcaster Frame Meta Tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="/api/frames/images/welcome" />
        <meta property="fc:frame:button:1" content="Bahşiş Gönder 💰" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:post_url" content="/api/frame-actions" />
        
        {/* Additional Farcaster compatibility */}
        <meta name="farcaster:frame" content="vNext" />
        <meta name="farcaster:frame:image" content="/api/frames/images/welcome" />
        <meta name="farcaster:frame:button:1" content="Bahşiş Gönder 💰" />
        <meta name="farcaster:frame:button:1:action" content="post" />
        <meta name="farcaster:frame:post_url" content="/api/frame-actions" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
