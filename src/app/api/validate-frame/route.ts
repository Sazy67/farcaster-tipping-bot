import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ 
      error: 'URL parametresi gerekli',
      valid: false 
    }, { status: 400 });
  }

  try {
    // URL'yi fetch et ve meta tagları kontrol et
    const response = await fetch(url);
    const html = await response.text();
    
    // Frame meta taglarını kontrol et
    const frameChecks = {
      hasFrameTag: html.includes('fc:frame'),
      hasImage: html.includes('fc:frame:image'),
      hasButton: html.includes('fc:frame:button:1'),
      hasPostUrl: html.includes('fc:frame:post_url'),
      hasOgImage: html.includes('og:image'),
    };
    
    const isValid = Object.values(frameChecks).every(check => check);
    
    return NextResponse.json({
      url,
      valid: isValid,
      checks: frameChecks,
      message: isValid ? 'Frame geçerli!' : 'Frame eksik meta tagları içeriyor'
    });
    
  } catch (error) {
    console.error('Frame validation error:', error);
    return NextResponse.json({ 
      error: 'URL kontrol edilemedi',
      valid: false 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();
    
    if (!Array.isArray(urls)) {
      return NextResponse.json({ 
        error: 'urls array gerekli' 
      }, { status: 400 });
    }
    
    const results = await Promise.all(
      urls.map(async (url: string) => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          
          const frameChecks = {
            hasFrameTag: html.includes('fc:frame'),
            hasImage: html.includes('fc:frame:image'),
            hasButton: html.includes('fc:frame:button:1'),
            hasPostUrl: html.includes('fc:frame:post_url'),
          };
          
          return {
            url,
            valid: Object.values(frameChecks).every(check => check),
            checks: frameChecks
          };
        } catch (error) {
          return {
            url,
            valid: false,
            error: 'Fetch hatası'
          };
        }
      })
    );
    
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('Batch validation error:', error);
    return NextResponse.json({ 
      error: 'Batch validation hatası' 
    }, { status: 500 });
  }
}