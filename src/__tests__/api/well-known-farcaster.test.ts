/**
 * Unit tests for /.well-known/farcaster.json API route
 * Tests HTTP methods, response headers, and error scenarios
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../app/api/well-known/farcaster/route';

// Mock console methods to avoid noise in tests
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

beforeAll(() => {
  global.console = {
    ...console,
    log: mockConsoleLog,
    error: mockConsoleError,
  };
});

beforeEach(() => {
  mockConsoleLog.mockClear();
  mockConsoleError.mockClear();
});

describe('Farcaster Manifest API Route', () => {
  const expectedDestination = 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9';
  
  describe('HTTP Methods Tests', () => {
    it('should handle GET requests with 307 redirect', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(expectedDestination);
    });

    it('should handle POST requests with 307 redirect', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json', {
        method: 'POST'
      });
      const response = await POST(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(expectedDestination);
    });

    it('should handle PUT requests with 307 redirect', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json', {
        method: 'PUT'
      });
      const response = await PUT(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(expectedDestination);
    });

    it('should handle DELETE requests with 307 redirect', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json', {
        method: 'DELETE'
      });
      const response = await DELETE(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(expectedDestination);
    });
  });

  describe('Response Headers Validation', () => {
    it('should include correct Location header', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      expect(response.headers.get('Location')).toBe(expectedDestination);
    });

    it('should include Cache-Control header', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });

    it('should include CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should have consistent headers across all HTTP methods', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      
      const getResponse = await GET(request);
      const postResponse = await POST(request);
      const putResponse = await PUT(request);
      const deleteResponse = await DELETE(request);
      
      const responses = [getResponse, postResponse, putResponse, deleteResponse];
      
      responses.forEach(response => {
        expect(response.headers.get('Location')).toBe(expectedDestination);
        expect(response.status).toBe(307);
      });
    });
  });

  describe('Error Scenarios Tests', () => {
    it('should log method name for each request', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      
      await GET(request);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[Farcaster Manifest] GET request redirecting to hosted manifest')
      );
      
      mockConsoleLog.mockClear();
      
      await POST(request);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[Farcaster Manifest] POST request redirecting to hosted manifest')
      );
    });

    it('should handle potential errors gracefully', async () => {
      // Mock NextResponse.redirect to throw an error on first call
      const originalRedirect = require('next/server').NextResponse.redirect;
      let callCount = 0;
      
      require('next/server').NextResponse.redirect = jest.fn().mockImplementation((...args) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Mock error');
        }
        return originalRedirect(...args);
      });
      
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      // Should still return a redirect response even after error
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(expectedDestination);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[Farcaster Manifest] Error creating redirect response for GET:'),
        expect.any(Error)
      );
      
      // Restore original function
      require('next/server').NextResponse.redirect = originalRedirect;
    });

    it('should provide minimal headers in error fallback', async () => {
      // Mock NextResponse.redirect to throw an error on first call
      const originalRedirect = require('next/server').NextResponse.redirect;
      let callCount = 0;
      
      require('next/server').NextResponse.redirect = jest.fn().mockImplementation((...args) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Mock error');
        }
        return originalRedirect(...args);
      });
      
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      // Should have at least Location header in fallback
      expect(response.headers.get('Location')).toBe(expectedDestination);
      
      // Restore original function
      require('next/server').NextResponse.redirect = originalRedirect;
    });
  });

  describe('URL and Configuration Tests', () => {
    it('should redirect to valid HTTPS URL', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      const location = response.headers.get('Location');
      expect(location).toMatch(/^https:\/\//);
    });

    it('should redirect to Farcaster API domain', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      const location = response.headers.get('Location');
      expect(location).toContain('api.farcaster.xyz');
    });

    it('should redirect to miniapps hosted-manifest endpoint', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      const location = response.headers.get('Location');
      expect(location).toContain('/miniapps/hosted-manifest/');
    });

    it('should have valid UUID format in manifest ID', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      const location = response.headers.get('Location');
      const manifestId = location?.split('/').pop();
      expect(manifestId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });
  });

  describe('Performance and Caching Tests', () => {
    it('should set appropriate cache duration', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      const response = await GET(request);
      
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=3600'); // 1 hour
      expect(cacheControl).toContain('public');
    });

    it('should respond quickly for all methods', async () => {
      const request = new NextRequest('http://localhost:3000/.well-known/farcaster.json');
      
      const methods = [GET, POST, PUT, DELETE];
      
      for (const method of methods) {
        const startTime = Date.now();
        await method(request);
        const endTime = Date.now();
        
        // Should complete within 100ms (well under the 500ms requirement)
        expect(endTime - startTime).toBeLessThan(100);
      }
    });
  });
});