import { NextRequest, NextResponse } from 'next/server';

// Farcaster Hosted Manifest URL
const FARCASTER_HOSTED_MANIFEST_URL = 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9';

/**
 * Creates a redirect response to the Farcaster hosted manifest
 * @param method HTTP method for logging
 * @returns NextResponse with 307 redirect
 */
function createRedirectResponse(method: string): NextResponse {
  try {
    console.log(`[Farcaster Manifest] ${method} request redirecting to hosted manifest`);
    
    return NextResponse.redirect(FARCASTER_HOSTED_MANIFEST_URL, {
      status: 307, // Temporary redirect
      headers: {
        'Location': FARCASTER_HOSTED_MANIFEST_URL,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(`[Farcaster Manifest] Error creating redirect response for ${method}:`, error);
    
    // Even if there's an error, we should still attempt the redirect
    return NextResponse.redirect(FARCASTER_HOSTED_MANIFEST_URL, {
      status: 307,
      headers: {
        'Location': FARCASTER_HOSTED_MANIFEST_URL,
      },
    });
  }
}

export async function GET(request: NextRequest) {
  return createRedirectResponse('GET');
}

export async function POST(request: NextRequest) {
  return createRedirectResponse('POST');
}

export async function PUT(request: NextRequest) {
  return createRedirectResponse('PUT');
}

export async function DELETE(request: NextRequest) {
  return createRedirectResponse('DELETE');
}