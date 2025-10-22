import { NextRequest } from 'next/server';

export interface FarcasterFrameData {
  fid: number;
  url: string;
  messageHash: string;
  timestamp: number;
  network: number;
  buttonIndex: number;
  castId?: {
    fid: number;
    hash: string;
  };
}

export class FarcasterFrameValidator {
  /**
   * Farcaster frame request'ini validate eder
   */
  static async validateFrameRequest(request: NextRequest): Promise<FarcasterFrameData | null> {
    try {
      const body = await request.json();
      
      // Temel alanları kontrol et
      if (!body.untrustedData || !body.trustedData) {
        console.error('Missing untrustedData or trustedData');
        return null;
      }

      const { untrustedData, trustedData } = body;

      // Gerekli alanları validate et
      if (
        typeof untrustedData.fid !== 'number' ||
        typeof untrustedData.url !== 'string' ||
        typeof untrustedData.messageHash !== 'string' ||
        typeof untrustedData.timestamp !== 'number' ||
        typeof untrustedData.network !== 'number' ||
        typeof untrustedData.buttonIndex !== 'number'
      ) {
        console.error('Invalid untrustedData format');
        return null;
      }

      // Trusted data'yı validate et (gerçek uygulamada signature doğrulaması yapılmalı)
      if (!trustedData.messageBytes) {
        console.error('Missing trustedData.messageBytes');
        return null;
      }

      return {
        fid: untrustedData.fid,
        url: untrustedData.url,
        messageHash: untrustedData.messageHash,
        timestamp: untrustedData.timestamp,
        network: untrustedData.network,
        buttonIndex: untrustedData.buttonIndex,
        castId: untrustedData.castId,
      };
    } catch (error) {
      console.error('Frame validation error:', error);
      return null;
    }
  }

  /**
   * Frame response'u oluşturur
   */
  static createFrameResponse(
    image: string,
    buttons: string[],
    postUrl?: string,
    inputText?: string
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Farcaster Tipping Bot</title>
  
  <!-- Farcaster Frame Meta Tags -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${image}" />
  <meta property="og:image" content="${image}" />
`;

    // Butonları ekle
    buttons.forEach((button, index) => {
      html += `  <meta property="fc:frame:button:${index + 1}" content="${button}" />\n`;
      html += `  <meta property="fc:frame:button:${index + 1}:action" content="post" />\n`;
    });

    // Post URL ekle
    if (postUrl) {
      html += `  <meta property="fc:frame:post_url" content="${baseUrl}${postUrl}" />\n`;
    }

    // Input text ekle
    if (inputText) {
      html += `  <meta property="fc:frame:input:text" content="${inputText}" />\n`;
    }

    html += `
</head>
<body>
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
    <h1>Farcaster Tipping Bot</h1>
    <p>Bu sayfa Farcaster frame olarak tasarlanmıştır.</p>
    <img src="${image}" alt="Frame Image" style="max-width: 100%; height: auto;" />
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Hata frame'i oluşturur
   */
  static createErrorFrame(message: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const errorImageUrl = `${baseUrl}/api/frames/images/error?message=${encodeURIComponent(message)}`;
    
    return this.createFrameResponse(
      errorImageUrl,
      ['Ana Sayfaya Dön'],
      '/api/frame-actions'
    );
  }
}