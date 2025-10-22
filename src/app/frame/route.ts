import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Farcaster frame URL'sini işle
  try {
    const decodedUrl = decodeURIComponent(url);
    
    // Eğer bizim domain'imizden bir URL ise, direkt yönlendir
    if (decodedUrl.includes(request.nextUrl.origin)) {
      return NextResponse.redirect(new URL(decodedUrl, request.url));
    }
    
    // Diğer durumlarda ana sayfaya yönlendir
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Frame URL processing error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export async function POST(request: NextRequest) {
  // Frame action'ları için POST handler
  return NextResponse.redirect(new URL('/api/frame-actions', request.url));
}