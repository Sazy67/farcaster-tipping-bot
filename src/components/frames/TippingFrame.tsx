import { FrameConfig, generateFrameMetadata, frameMetadataToHtml } from '@/lib/frames/metadata';
import { TippingFrameState } from '@/lib/frames/state';

export interface TippingFrameProps {
  recipientFid: string;
  postHash?: string;
  predefinedAmounts: number[];
  baseUrl: string;
  state?: TippingFrameState;
}

export class TippingFrame {
  /**
   * Generate initial tipping frame
   */
  static generateInitialFrame(props: TippingFrameProps): string {
    const { recipientFid, predefinedAmounts, baseUrl } = props;

    const config: FrameConfig = {
      title: 'Send a Tip',
      description: `Send a tip to user ${recipientFid}`,
      image: `${baseUrl}/api/frames/images/initial?recipient=${recipientFid}`,
      buttons: [
        ...predefinedAmounts.slice(0, 3).map(amount => ({
          text: `${amount} ETH`,
          action: 'post' as const,
        })),
        {
          text: 'Custom Amount',
          action: 'post' as const,
        },
      ],
      inputText: 'Enter custom amount (ETH)',
      postUrl: `${baseUrl}/api/frame-actions`,
    };

    const metadata = generateFrameMetadata(config);
    return this.generateFrameHtml(metadata, config);
  }

  /**
   * Generate amount selection frame
   */
  static generateAmountSelectionFrame(props: TippingFrameProps): string {
    const { recipientFid, predefinedAmounts, baseUrl } = props;

    const config: FrameConfig = {
      title: 'Select Tip Amount',
      description: `Choose amount to tip user ${recipientFid}`,
      image: `${baseUrl}/api/frames/images/amount-selection?recipient=${recipientFid}`,
      buttons: predefinedAmounts.slice(0, 4).map(amount => ({
        text: `${amount} ETH`,
        action: 'post' as const,
      })),
      inputText: 'Or enter custom amount',
      postUrl: `${baseUrl}/api/frame-actions`,
    };

    const metadata = generateFrameMetadata(config);
    return this.generateFrameHtml(metadata, config);
  }

  /**
   * Generate wallet check frame
   */
  static generateWalletCheckFrame(props: TippingFrameProps): string {
    const { recipientFid, baseUrl, state } = props;

    const config: FrameConfig = {
      title: 'Checking Wallet',
      description: 'Verifying wallet connection and balance...',
      image: `${baseUrl}/api/frames/images/wallet-check?recipient=${recipientFid}&amount=${state?.amount || '0'}`,
      buttons: [
        {
          text: 'Continue',
          action: 'post' as const,
        },
        {
          text: 'Cancel',
          action: 'post' as const,
        },
      ],
      postUrl: `${baseUrl}/api/frame-actions`,
    };

    const metadata = generateFrameMetadata(config);
    return this.generateFrameHtml(metadata, config);
  }

  /**
   * Generate confirmation frame
   */
  static generateConfirmationFrame(props: TippingFrameProps): string {
    const { recipientFid, baseUrl, state } = props;

    if (!state?.amount || !state?.platformFee || !state?.recipientAmount) {
      throw new Error('Missing transaction details for confirmation');
    }

    const config: FrameConfig = {
      title: 'Confirm Tip',
      description: `Confirm tip of ${state.amount} ETH to user ${recipientFid}`,
      image: `${baseUrl}/api/frames/images/confirmation?recipient=${recipientFid}&amount=${state.amount}&fee=${state.platformFee}&recipientAmount=${state.recipientAmount}`,
      buttons: [
        {
          text: 'Confirm & Send',
          action: 'post' as const,
        },
        {
          text: 'Cancel',
          action: 'post' as const,
        },
      ],
      postUrl: `${baseUrl}/api/frame-actions`,
    };

    const metadata = generateFrameMetadata(config);
    return this.generateFrameHtml(metadata, config);
  }

  /**
   * Generate processing frame
   */
  static generateProcessingFrame(props: TippingFrameProps): string {
    const { recipientFid, baseUrl, state } = props;

    const config: FrameConfig = {
      title: 'Processing Tip',
      description: 'Your tip is being processed on the blockchain...',
      image: `${baseUrl}/api/frames/images/processing?recipient=${recipientFid}&amount=${state?.amount || '0'}&txHash=${state?.txHash || ''}`,
      buttons: [
        {
          text: 'Check Status',
          action: 'post' as const,
        },
        {
          text: 'View on Explorer',
          action: 'link' as const,
          target: state?.txHash ? `https://basescan.org/tx/${state.txHash}` : '#',
        },
      ],
      postUrl: `${baseUrl}/api/frame-actions`,
    };

    const metadata = generateFrameMetadata(config);
    return this.generateFrameHtml(metadata, config);
  }

  /**
   * Generate success frame
   */
  static generateSuccessFrame(props: TippingFrameProps): string {
    const { recipientFid, baseUrl, state } = props;

    const config: FrameConfig = {
      title: 'Tip Sent Successfully!',
      description: `Successfully sent ${state?.amount || '0'} ETH to user ${recipientFid}`,
      image: `${baseUrl}/api/frames/images/success?recipient=${recipientFid}&amount=${state?.amount || '0'}&txHash=${state?.txHash || ''}`,
      buttons: [
        {
          text: 'View Transaction',
          action: 'link' as const,
          target: state?.txHash ? `https://basescan.org/tx/${state.txHash}` : '#',
        },
        {
          text: 'Send Another Tip',
          action: 'post' as const,
        },
      ],
      postUrl: `${baseUrl}/api/frame-actions`,
    };

    const metadata = generateFrameMetadata(config);
    return this.generateFrameHtml(metadata, config);
  }

  /**
   * Generate frame based on current state
   */
  static generateFrame(props: TippingFrameProps): string {
    const state = props.state?.state || 'initial';

    switch (state) {
      case 'initial':
        return this.generateInitialFrame(props);
      case 'amount_selection':
        return this.generateAmountSelectionFrame(props);
      case 'wallet_check':
        return this.generateWalletCheckFrame(props);
      case 'confirmation':
        return this.generateConfirmationFrame(props);
      case 'processing':
        return this.generateProcessingFrame(props);
      case 'success':
        return this.generateSuccessFrame(props);
      case 'error':
        // Error frames are handled by FrameErrorHandler
        return this.generateInitialFrame(props);
      default:
        return this.generateInitialFrame(props);
    }
  }

  /**
   * Generate complete HTML for frame
   */
  private static generateFrameHtml(metadata: any, config: FrameConfig): string {
    const metaHtml = frameMetadataToHtml(metadata);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${config.title}</title>
  ${metaHtml}
</head>
<body>
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
    <img src="${config.image}" alt="${config.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="text-align: center; margin-bottom: 10px;">${config.title}</h1>
    <p style="text-align: center; color: #666; margin-bottom: 20px;">${config.description}</p>
    <p style="text-align: center; color: #888; font-size: 14px;">
      This is a Farcaster frame. Use a Farcaster client to interact with it.
    </p>
  </div>
</body>
</html>`;
  }
}