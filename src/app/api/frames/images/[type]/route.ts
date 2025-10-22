import { NextRequest, NextResponse } from 'next/server';
import { FrameImageGenerator } from '@/lib/frames/image-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);

    let imageDataUrl: string;

    switch (type) {
      case 'initial':
        const recipientFid = searchParams.get('recipient') || 'unknown';
        imageDataUrl = FrameImageGenerator.generateInitialImage(recipientFid);
        break;

      case 'amount-selection':
        const recipientFid2 = searchParams.get('recipient') || 'unknown';
        imageDataUrl = FrameImageGenerator.generateAmountSelectionImage(recipientFid2);
        break;

      case 'wallet-check':
        const recipientFid3 = searchParams.get('recipient') || 'unknown';
        const amount = searchParams.get('amount') || '0';
        imageDataUrl = FrameImageGenerator.generateWalletCheckImage(recipientFid3, amount);
        break;

      case 'confirmation':
        const recipientFid4 = searchParams.get('recipient') || 'unknown';
        const amount2 = searchParams.get('amount') || '0';
        const fee = searchParams.get('fee') || '0';
        const recipientAmount = searchParams.get('recipientAmount') || '0';
        imageDataUrl = FrameImageGenerator.generateConfirmationImage(
          recipientFid4,
          amount2,
          fee,
          recipientAmount
        );
        break;

      case 'processing':
        const recipientFid5 = searchParams.get('recipient') || 'unknown';
        const amount3 = searchParams.get('amount') || '0';
        const txHash = searchParams.get('txHash') || undefined;
        imageDataUrl = FrameImageGenerator.generateProcessingImage(
          recipientFid5,
          amount3,
          txHash
        );
        break;

      case 'success':
        const recipientFid6 = searchParams.get('recipient') || 'unknown';
        const amount4 = searchParams.get('amount') || '0';
        const txHash2 = searchParams.get('txHash') || undefined;
        imageDataUrl = FrameImageGenerator.generateSuccessImage(
          recipientFid6,
          amount4,
          txHash2
        );
        break;

      case 'error':
        const message = searchParams.get('message') || 'An error occurred';
        imageDataUrl = FrameImageGenerator.generateErrorImage(message);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid image type' },
          { status: 400 }
        );
    }

    // Extract the SVG data from the data URL
    const svgData = imageDataUrl.replace('data:image/svg+xml,', '');
    const decodedSvg = decodeURIComponent(svgData);

    return new NextResponse(decodedSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    // Return a simple error SVG
    const errorSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#dc2626"/>
  <text x="600" y="315" text-anchor="middle" font-size="48" fill="white" font-family="system-ui">
    Image Generation Error
  </text>
</svg>`;

    return new NextResponse(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
      status: 500,
    });
  }
}