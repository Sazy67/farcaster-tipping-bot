export interface FrameMetadata {
  title: string;
  description: string;
  image: string;
  buttons: FrameButton[];
  postUrl?: string;
  inputText?: string;
  aspectRatio?: '1.91:1' | '1:1';
  state?: string;
}

export interface FrameButton {
  label: string;
  action: 'post' | 'post_redirect' | 'link' | 'mint';
  target?: string;
}

export class FarcasterMetaGenerator {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Farcaster frame için meta tagları oluşturur
   */
  generateFrameMeta(metadata: FrameMetadata): Record<string, string> {
    const meta: Record<string, string> = {
      // Temel Open Graph tagları
      'og:title': metadata.title,
      'og:description': metadata.description,
      'og:image': metadata.image,
      'og:type': 'website',
      
      // Twitter Card tagları
      'twitter:card': 'summary_large_image',
      'twitter:title': metadata.title,
      'twitter:description': metadata.description,
      'twitter:image': metadata.image,
      
      // Farcaster Frame tagları
      'fc:frame': 'vNext',
      'fc:frame:image': metadata.image,
      'fc:frame:image:aspect_ratio': metadata.aspectRatio || '1.91:1',
    };

    // Butonları ekle
    metadata.buttons.forEach((button, index) => {
      const buttonIndex = index + 1;
      meta[`fc:frame:button:${buttonIndex}`] = button.label;
      meta[`fc:frame:button:${buttonIndex}:action`] = button.action;
      
      if (button.target) {
        meta[`fc:frame:button:${buttonIndex}:target`] = button.target;
      }
    });

    // Post URL ekle
    if (metadata.postUrl) {
      meta['fc:frame:post_url'] = metadata.postUrl.startsWith('http') 
        ? metadata.postUrl 
        : `${this.baseUrl}${metadata.postUrl}`;
    }

    // Input text ekle
    if (metadata.inputText) {
      meta['fc:frame:input:text'] = metadata.inputText;
    }

    // State ekle
    if (metadata.state) {
      meta['fc:frame:state'] = metadata.state;
    }

    return meta;
  }

  /**
   * HTML meta taglarını oluşturur
   */
  generateMetaHTML(metadata: FrameMetadata): string {
    const meta = this.generateFrameMeta(metadata);
    
    return Object.entries(meta)
      .map(([key, value]) => {
        if (key.startsWith('og:') || key.startsWith('fc:frame') || key.startsWith('twitter:')) {
          return `<meta property="${key}" content="${value}" />`;
        } else {
          return `<meta name="${key}" content="${value}" />`;
        }
      })
      .join('\n');
  }

  /**
   * Next.js Metadata objesi oluşturur
   */
  generateNextMetadata(metadata: FrameMetadata) {
    const meta = this.generateFrameMeta(metadata);
    
    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        images: [metadata.image],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: metadata.description,
        images: [metadata.image],
      },
      other: Object.fromEntries(
        Object.entries(meta).filter(([key]) => 
          key.startsWith('fc:frame') || key === 'farcaster:frame'
        )
      ),
    };
  }

  /**
   * Bahşiş frame'i için özel meta oluşturucu
   */
  generateTippingFrameMeta(recipientName: string, recipientFid?: number): FrameMetadata {
    return {
      title: `${recipientName} için Bahşiş Gönder`,
      description: `Base ağında ${recipientName} kullanıcısına güvenli bahşiş gönderin`,
      image: `${this.baseUrl}/api/frames/images/tip?recipient=${encodeURIComponent(recipientName)}`,
      buttons: [
        { label: '0.001 ETH 💰', action: 'post' },
        { label: '0.005 ETH 💎', action: 'post' },
        { label: '0.01 ETH 🚀', action: 'post' },
        { label: 'Özel Miktar ✏️', action: 'post' },
      ],
      postUrl: '/api/frame-actions',
      aspectRatio: '1.91:1',
      state: JSON.stringify({ 
        recipient: recipientName, 
        recipientFid,
        step: 'amount_selection' 
      }),
    };
  }

  /**
   * Hata frame'i için meta oluşturucu
   */
  generateErrorFrameMeta(errorMessage: string): FrameMetadata {
    return {
      title: 'Hata Oluştu',
      description: errorMessage,
      image: `${this.baseUrl}/api/frames/images/error?message=${encodeURIComponent(errorMessage)}`,
      buttons: [
        { label: 'Ana Sayfaya Dön 🏠', action: 'post' },
        { label: 'Tekrar Dene 🔄', action: 'post' },
      ],
      postUrl: '/api/frame-actions',
      aspectRatio: '1.91:1',
    };
  }

  /**
   * Başarı frame'i için meta oluşturucu
   */
  generateSuccessFrameMeta(txHash: string, amount: string, recipient: string): FrameMetadata {
    return {
      title: 'Bahşiş Gönderildi! 🎉',
      description: `${amount} ETH başarıyla ${recipient} kullanıcısına gönderildi`,
      image: `${this.baseUrl}/api/frames/images/success?tx=${txHash}&amount=${amount}&recipient=${encodeURIComponent(recipient)}`,
      buttons: [
        { label: 'İşlemi Görüntüle 🔍', action: 'link', target: `https://basescan.org/tx/${txHash}` },
        { label: 'Yeni Bahşiş Gönder 💰', action: 'post' },
      ],
      postUrl: '/api/frame-actions',
      aspectRatio: '1.91:1',
    };
  }
}