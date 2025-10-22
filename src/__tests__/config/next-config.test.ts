/**
 * Unit tests for Next.js redirect configuration
 * Tests the redirect configuration for /.well-known/farcaster.json
 */

import nextConfig from '../../../next.config';

describe('Next.js Redirect Configuration', () => {
  describe('Redirect Configuration Validation', () => {
    it('should have redirects function defined', () => {
      expect(typeof nextConfig.redirects).toBe('function');
    });

    it('should return correct redirect configuration for farcaster manifest', async () => {
      const redirects = await nextConfig.redirects!();
      
      expect(Array.isArray(redirects)).toBe(true);
      expect(redirects.length).toBeGreaterThan(0);
      
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      expect(farcasterRedirect).toBeDefined();
      expect(farcasterRedirect).toEqual({
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9',
        statusCode: 307
      });
    });

    it('should use 307 status code for temporary redirect', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      expect(farcasterRedirect?.statusCode).toBe(307);
    });

    it('should have correct destination URL format', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      expect(farcasterRedirect?.destination).toMatch(/^https:\/\/api\.farcaster\.xyz\/miniapps\/hosted-manifest\/[a-f0-9-]+$/);
    });
  });

  describe('URL Configuration Tests', () => {
    it('should have valid HTTPS URL as destination', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      expect(farcasterRedirect?.destination).toMatch(/^https:\/\//);
    });

    it('should have correct source path format', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      expect(farcasterRedirect?.source).toBe('/.well-known/farcaster.json');
      expect(farcasterRedirect?.source).toMatch(/^\/\.well-known\/farcaster\.json$/);
    });

    it('should have valid Farcaster API domain', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      expect(farcasterRedirect?.destination).toContain('api.farcaster.xyz');
    });

    it('should have valid manifest ID format', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      const manifestId = farcasterRedirect?.destination?.split('/').pop();
      expect(manifestId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });
  });

  describe('Configuration Structure Tests', () => {
    it('should export a valid Next.js config object', () => {
      expect(typeof nextConfig).toBe('object');
      expect(nextConfig).not.toBeNull();
    });

    it('should have only required redirect properties', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      const expectedKeys = ['source', 'destination', 'statusCode'];
      const actualKeys = Object.keys(farcasterRedirect || {});
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });
    });

    it('should not have permanent redirect flag', async () => {
      const redirects = await nextConfig.redirects!();
      const farcasterRedirect = redirects.find(
        redirect => redirect.source === '/.well-known/farcaster.json'
      );
      
      // Should not have permanent: true since we're using 307 (temporary)
      expect(farcasterRedirect?.permanent).toBeUndefined();
    });
  });
});