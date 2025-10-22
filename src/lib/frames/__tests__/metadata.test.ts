import { generateFrameMetadata, frameMetadataToHtml, FrameConfig } from '../metadata';

describe('Frame Metadata', () => {
  describe('generateFrameMetadata', () => {
    it('should generate basic frame metadata', () => {
      const config: FrameConfig = {
        title: 'Test Frame',
        description: 'Test Description',
        image: 'https://example.com/image.png',
        postUrl: 'https://example.com/api/frame',
      };

      const metadata = generateFrameMetadata(config);

      expect(metadata).toEqual({
        'fc:frame': 'vNext',
        'fc:frame:image': 'https://example.com/image.png',
        'fc:frame:post_url': 'https://example.com/api/frame',
        'og:title': 'Test Frame',
        'og:description': 'Test Description',
        'og:image': 'https://example.com/image.png',
      });
    });

    it('should include input text when provided', () => {
      const config: FrameConfig = {
        title: 'Test Frame',
        description: 'Test Description',
        image: 'https://example.com/image.png',
        postUrl: 'https://example.com/api/frame',
        inputText: 'Enter amount',
      };

      const metadata = generateFrameMetadata(config);

      expect(metadata['fc:frame:input:text']).toBe('Enter amount');
    });

    it('should add buttons correctly', () => {
      const config: FrameConfig = {
        title: 'Test Frame',
        description: 'Test Description',
        image: 'https://example.com/image.png',
        postUrl: 'https://example.com/api/frame',
        buttons: [
          { text: 'Button 1' },
          { text: 'Button 2', action: 'post' },
          { text: 'Button 3', action: 'link', target: 'https://example.com' },
        ],
      };

      const metadata = generateFrameMetadata(config);

      expect(metadata['fc:frame:button:1']).toBe('Button 1');
      expect(metadata['fc:frame:button:2']).toBe('Button 2');
      expect(metadata['fc:frame:button:2:action']).toBe('post');
      expect(metadata['fc:frame:button:3']).toBe('Button 3');
      expect(metadata['fc:frame:button:3:action']).toBe('link');
      expect(metadata['fc:frame:button:3:target']).toBe('https://example.com');
    });

    it('should limit buttons to maximum of 4', () => {
      const config: FrameConfig = {
        title: 'Test Frame',
        description: 'Test Description',
        image: 'https://example.com/image.png',
        postUrl: 'https://example.com/api/frame',
        buttons: [
          { text: 'Button 1' },
          { text: 'Button 2' },
          { text: 'Button 3' },
          { text: 'Button 4' },
          { text: 'Button 5' }, // This should be ignored
        ],
      };

      const metadata = generateFrameMetadata(config);

      expect(metadata['fc:frame:button:1']).toBe('Button 1');
      expect(metadata['fc:frame:button:2']).toBe('Button 2');
      expect(metadata['fc:frame:button:3']).toBe('Button 3');
      expect(metadata['fc:frame:button:4']).toBe('Button 4');
      expect(metadata['fc:frame:button:5']).toBeUndefined();
    });

    it('should not add target for non-link actions', () => {
      const config: FrameConfig = {
        title: 'Test Frame',
        description: 'Test Description',
        image: 'https://example.com/image.png',
        postUrl: 'https://example.com/api/frame',
        buttons: [
          { text: 'Button 1', action: 'post', target: 'https://example.com' },
        ],
      };

      const metadata = generateFrameMetadata(config);

      expect(metadata['fc:frame:button:1:target']).toBeUndefined();
    });
  });

  describe('frameMetadataToHtml', () => {
    it('should convert metadata to HTML meta tags', () => {
      const metadata = {
        'fc:frame': 'vNext',
        'fc:frame:image': 'https://example.com/image.png',
        'fc:frame:post_url': 'https://example.com/api/frame',
        'og:title': 'Test Frame',
        'og:description': 'Test Description',
        'og:image': 'https://example.com/image.png',
      };

      const html = frameMetadataToHtml(metadata);

      expect(html).toContain('<meta property="fc:frame" content="vNext" />');
      expect(html).toContain('<meta property="fc:frame:image" content="https://example.com/image.png" />');
      expect(html).toContain('<meta property="fc:frame:post_url" content="https://example.com/api/frame" />');
      expect(html).toContain('<meta property="og:title" content="Test Frame" />');
      expect(html).toContain('<meta property="og:description" content="Test Description" />');
      expect(html).toContain('<meta property="og:image" content="https://example.com/image.png" />');
    });

    it('should handle empty metadata', () => {
      const metadata = {};
      const html = frameMetadataToHtml(metadata);

      expect(html).toBe('');
    });

    it('should handle special characters in content', () => {
      const metadata = {
        'og:title': 'Test & "Frame"',
      };

      const html = frameMetadataToHtml(metadata);

      expect(html).toContain('<meta property="og:title" content="Test & "Frame"" />');
    });
  });
});