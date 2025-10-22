export interface FrameMetadata {
  'fc:frame': string;
  'fc:frame:image': string;
  'fc:frame:button:1'?: string;
  'fc:frame:button:2'?: string;
  'fc:frame:button:3'?: string;
  'fc:frame:button:4'?: string;
  'fc:frame:button:1:action'?: string;
  'fc:frame:button:2:action'?: string;
  'fc:frame:button:3:action'?: string;
  'fc:frame:button:4:action'?: string;
  'fc:frame:input:text'?: string;
  'fc:frame:post_url': string;
  'og:title': string;
  'og:description': string;
  'og:image': string;
}

export interface FrameButton {
  text: string;
  action?: 'post' | 'post_redirect' | 'link';
  target?: string;
}

export interface FrameConfig {
  title: string;
  description: string;
  image: string;
  buttons?: FrameButton[];
  inputText?: string;
  postUrl: string;
}

export function generateFrameMetadata(config: FrameConfig): any {
  const metadata: any = {
    'fc:frame': 'vNext',
    'fc:frame:image': config.image,
    'fc:frame:post_url': config.postUrl,
    'og:title': config.title,
    'og:description': config.description,
    'og:image': config.image,
  };

  // Add input text if provided
  if (config.inputText) {
    metadata['fc:frame:input:text'] = config.inputText;
  }

  // Add buttons
  if (config.buttons) {
    config.buttons.forEach((button, index) => {
      const buttonIndex = (index + 1) as 1 | 2 | 3 | 4;
      if (buttonIndex <= 4) {
        metadata[`fc:frame:button:${buttonIndex}`] = button.text;
        
        if (button.action) {
          metadata[`fc:frame:button:${buttonIndex}:action`] = button.action;
        }
        
        if (button.target && button.action === 'link') {
          metadata[`fc:frame:button:${buttonIndex}:target`] = button.target;
        }
      }
    });
  }

  return metadata;
}

export function frameMetadataToHtml(metadata: any): string {
  return Object.entries(metadata)
    .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
    .join('\n');
}