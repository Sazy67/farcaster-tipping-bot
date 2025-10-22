import { NextRequest, NextResponse } from 'next/server';
import { TippingFrame } from '@/components/frames/TippingFrame';

const PREDEFINED_AMOUNTS = [0.001, 0.005, 0.01, 0.05];
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipientFid: string }> }
) {
  try {
    const { recipientFid } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get optional parameters
    const postHash = searchParams.get('postHash') || undefined;
    const customAmounts = searchParams.get('amounts');
    
    // Parse custom amounts if provided
    let amounts = PREDEFINED_AMOUNTS;
    if (customAmounts) {
      try {
        const parsed = JSON.parse(customAmounts);
        if (Array.isArray(parsed) && parsed.every(a => typeof a === 'number')) {
          amounts = parsed.slice(0, 4); // Limit to 4 amounts
        }
      } catch (error) {
        console.warn('Invalid custom amounts provided:', customAmounts);
      }
    }

    // Validate recipient FID
    if (!recipientFid || recipientFid === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid recipient FID' },
        { status: 400 }
      );
    }

    // Generate initial tipping frame
    const frameHtml = TippingFrame.generateInitialFrame({
      recipientFid,
      postHash,
      predefinedAmounts: amounts,
      baseUrl: BASE_URL,
    });

    return new NextResponse(frameHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache', // Don't cache frames
      },
    });

  } catch (error) {
    console.error('Frame generation error:', error);
    
    // Return a simple error HTML
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Frame Error</title>
</head>
<body>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
    <div style="text-align: center;">
      <h1>Frame Error</h1>
      <p>Unable to generate tipping frame</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(errorHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 500,
    });
  }
}