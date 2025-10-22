export interface ImageGeneratorOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export class FrameImageGenerator {
  private static readonly DEFAULT_OPTIONS: Required<ImageGeneratorOptions> = {
    width: 1200,
    height: 630,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    fontSize: 48,
  };

  /**
   * Generate initial frame image
   */
  static generateInitialImage(
    recipientFid: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return this.generateSvgImage({
      title: 'Send a Tip',
      subtitle: `To user ${recipientFid}`,
      emoji: '💰',
      ...opts,
    });
  }

  /**
   * Generate amount selection image
   */
  static generateAmountSelectionImage(
    recipientFid: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return this.generateSvgImage({
      title: 'Select Amount',
      subtitle: `Tip user ${recipientFid}`,
      emoji: '🎯',
      ...opts,
    });
  }

  /**
   * Generate wallet check image
   */
  static generateWalletCheckImage(
    recipientFid: string,
    amount: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return this.generateSvgImage({
      title: 'Checking Wallet',
      subtitle: `${amount} ETH → user ${recipientFid}`,
      emoji: '🔍',
      ...opts,
    });
  }

  /**
   * Generate confirmation image
   */
  static generateConfirmationImage(
    recipientFid: string,
    amount: string,
    fee: string,
    recipientAmount: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return this.generateSvgImage({
      title: 'Confirm Tip',
      subtitle: `${amount} ETH (${recipientAmount} + ${fee} fee)`,
      description: `To user ${recipientFid}`,
      emoji: '✅',
      ...opts,
    });
  }

  /**
   * Generate processing image
   */
  static generateProcessingImage(
    recipientFid: string,
    amount: string,
    txHash?: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return this.generateSvgImage({
      title: 'Processing...',
      subtitle: `${amount} ETH → user ${recipientFid}`,
      description: txHash ? `TX: ${txHash.slice(0, 10)}...` : 'Broadcasting transaction',
      emoji: '⏳',
      ...opts,
    });
  }

  /**
   * Generate success image
   */
  static generateSuccessImage(
    recipientFid: string,
    amount: string,
    txHash?: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return this.generateSvgImage({
      title: 'Tip Sent!',
      subtitle: `${amount} ETH → user ${recipientFid}`,
      description: txHash ? `TX: ${txHash.slice(0, 10)}...` : 'Transaction confirmed',
      emoji: '🎉',
      ...opts,
    });
  }

  /**
   * Generate error image
   */
  static generateErrorImage(
    message: string,
    options: ImageGeneratorOptions = {}
  ): string {
    const opts = { 
      ...this.DEFAULT_OPTIONS, 
      backgroundColor: '#dc2626',
      ...options 
    };
    
    return this.generateSvgImage({
      title: 'Error',
      subtitle: message,
      emoji: '❌',
      ...opts,
    });
  }

  /**
   * Generate SVG image
   */
  private static generateSvgImage(params: {
    title: string;
    subtitle: string;
    description?: string;
    emoji: string;
    width: number;
    height: number;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
  }): string {
    const { title, subtitle, description, emoji, width, height, backgroundColor, textColor, fontSize } = params;
    
    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Emoji -->
  <text x="${width / 2}" y="${height / 2 - 100}" 
        text-anchor="middle" 
        font-size="${fontSize * 2}" 
        font-family="system-ui, -apple-system, sans-serif">
    ${emoji}
  </text>
  
  <!-- Title -->
  <text x="${width / 2}" y="${height / 2 - 20}" 
        text-anchor="middle" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="${textColor}" 
        font-family="system-ui, -apple-system, sans-serif">
    ${title}
  </text>
  
  <!-- Subtitle -->
  <text x="${width / 2}" y="${height / 2 + 30}" 
        text-anchor="middle" 
        font-size="${fontSize * 0.7}" 
        fill="${textColor}" 
        opacity="0.8" 
        font-family="system-ui, -apple-system, sans-serif">
    ${subtitle}
  </text>
  
  ${description ? `
  <!-- Description -->
  <text x="${width / 2}" y="${height / 2 + 70}" 
        text-anchor="middle" 
        font-size="${fontSize * 0.5}" 
        fill="${textColor}" 
        opacity="0.6" 
        font-family="system-ui, -apple-system, sans-serif">
    ${description}
  </text>
  ` : ''}
  
  <!-- Branding -->
  <text x="${width - 20}" y="${height - 20}" 
        text-anchor="end" 
        font-size="16" 
        fill="${textColor}" 
        opacity="0.4" 
        font-family="system-ui, -apple-system, sans-serif">
    Farcaster Tipping Bot
  </text>
</svg>`;

    // Convert SVG to data URL
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  }

  /**
   * Generate image URL for API endpoint
   */
  static generateImageUrl(
    baseUrl: string,
    type: 'initial' | 'amount-selection' | 'wallet-check' | 'confirmation' | 'processing' | 'success' | 'error',
    params: Record<string, string>
  ): string {
    const searchParams = new URLSearchParams(params);
    return `${baseUrl}/api/frames/images/${type}?${searchParams.toString()}`;
  }
}