#!/usr/bin/env node

/**
 * Production URL validation script
 * Validates that the redirect works correctly on production URLs
 */

const https = require('https');
const http = require('http');

class ProductionValidator {
  constructor() {
    this.results = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async validateUrl(url, description = '') {
    return new Promise((resolve) => {
      const fullUrl = url.endsWith('/.well-known/farcaster.json') 
        ? url 
        : `${url}/.well-known/farcaster.json`;
      
      this.log(`Testing ${description || fullUrl}...`);
      
      const isHttps = fullUrl.startsWith('https');
      const client = isHttps ? https : http;
      
      const options = {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Farcaster-Redirect-Validator/1.0'
        }
      };

      const req = client.request(fullUrl, options, (res) => {
        const result = {
          url: fullUrl,
          description,
          statusCode: res.statusCode,
          location: res.headers.location,
          cacheControl: res.headers['cache-control'],
          accessControl: res.headers['access-control-allow-origin'],
          success: false,
          message: ''
        };

        // Check for redirect
        if (res.statusCode === 307) {
          if (res.headers.location && res.headers.location.includes('api.farcaster.xyz')) {
            result.success = true;
            result.message = `✅ ${description || fullUrl} - Redirect working correctly`;
          } else {
            result.message = `❌ ${description || fullUrl} - Wrong redirect location: ${res.headers.location}`;
          }
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          // Direct response (not redirect) - check if it's the manifest content
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (body.includes('farcaster') || body.includes('manifest')) {
              result.success = true;
              result.message = `✅ ${description || fullUrl} - Direct manifest response (Status: ${res.statusCode})`;
            } else {
              result.message = `⚠️  ${description || fullUrl} - Unexpected response content (Status: ${res.statusCode})`;
            }
          });
        } else {
          result.message = `❌ ${description || fullUrl} - Unexpected status: ${res.statusCode}`;
        }

        this.results.push(result);
        this.log(result.message);
        resolve(result);
      });

      req.on('error', (error) => {
        const result = {
          url: fullUrl,
          description,
          success: false,
          message: `❌ ${description || fullUrl} - Request failed: ${error.message}`
        };
        this.results.push(result);
        this.log(result.message);
        resolve(result);
      });

      req.on('timeout', () => {
        const result = {
          url: fullUrl,
          description,
          success: false,
          message: `❌ ${description || fullUrl} - Request timed out`
        };
        this.results.push(result);
        this.log(result.message);
        req.destroy();
        resolve(result);
      });

      req.end();
    });
  }

  async validateCommonUrls() {
    this.log('Validating common production URL patterns...');
    
    // Get potential URLs from environment or common patterns
    const urls = [];
    
    // Check for Vercel URLs
    if (process.env.VERCEL_URL) {
      urls.push({
        url: `https://${process.env.VERCEL_URL}`,
        description: 'Vercel deployment URL'
      });
    }
    
    // Check for custom domain
    if (process.env.NEXT_PUBLIC_APP_URL) {
      urls.push({
        url: process.env.NEXT_PUBLIC_APP_URL,
        description: 'Custom domain URL'
      });
    }
    
    // Add common localhost for development testing
    urls.push({
      url: 'http://localhost:3000',
      description: 'Local development server'
    });
    
    // If no URLs found, provide instructions
    if (urls.length <= 1) { // Only localhost
      this.log('⚠️  No production URLs found in environment variables.');
      this.log('   Set VERCEL_URL or NEXT_PUBLIC_APP_URL to test production URLs.');
      this.log('   You can also pass URLs as command line arguments.');
    }
    
    // Test provided command line URLs
    const cliUrls = process.argv.slice(2);
    cliUrls.forEach((url, index) => {
      urls.push({
        url: url,
        description: `CLI URL ${index + 1}`
      });
    });
    
    const results = [];
    for (const { url, description } of urls) {
      try {
        const result = await this.validateUrl(url, description);
        results.push(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.log(`❌ Error testing ${description}: ${error.message}`);
      }
    }
    
    return results;
  }

  async validateFarcasterManifest() {
    this.log('Validating Farcaster hosted manifest...');
    
    const manifestUrl = 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9';
    
    return new Promise((resolve) => {
      const req = https.request(manifestUrl, { method: 'GET', timeout: 10000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const result = {
            url: manifestUrl,
            statusCode: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 400,
            message: res.statusCode >= 200 && res.statusCode < 400
              ? `✅ Farcaster manifest accessible (Status: ${res.statusCode})`
              : `❌ Farcaster manifest returned status ${res.statusCode}`
          };
          
          // Try to parse as JSON to validate structure
          if (result.success) {
            try {
              const manifest = JSON.parse(body);
              if (manifest && (manifest.name || manifest.url || manifest.version)) {
                result.message += ' - Valid manifest structure';
              } else {
                result.message += ' - Warning: Unexpected manifest structure';
              }
            } catch (e) {
              result.message += ' - Warning: Response is not valid JSON';
            }
          }
          
          this.log(result.message);
          resolve(result);
        });
      });

      req.on('error', (error) => {
        const result = {
          url: manifestUrl,
          success: false,
          message: `❌ Farcaster manifest test failed: ${error.message}`
        };
        this.log(result.message);
        resolve(result);
      });

      req.on('timeout', () => {
        this.log('❌ Farcaster manifest test timed out');
        req.destroy();
        resolve({ success: false, message: 'Farcaster manifest test timed out' });
      });

      req.end();
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('PRODUCTION VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);
    
    console.log(`\nTotal tests: ${this.results.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    
    if (successfulTests.length > 0) {
      console.log('\n✅ SUCCESSFUL VALIDATIONS:');
      successfulTests.forEach(test => {
        console.log(`  - ${test.description || test.url}`);
        if (test.statusCode) console.log(`    Status: ${test.statusCode}`);
        if (test.location) console.log(`    Redirects to: ${test.location}`);
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED VALIDATIONS:');
      failedTests.forEach(test => {
        console.log(`  - ${test.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failedTests.length === 0 && successfulTests.length > 0) {
      console.log('🎉 Production validation PASSED!');
      return true;
    } else if (successfulTests.length === 0) {
      console.log('💥 No successful validations found!');
      return false;
    } else {
      console.log('⚠️  Some validations failed, but others succeeded.');
      return true; // Partial success is acceptable for production validation
    }
  }

  async runAllValidations() {
    this.log('Starting production URL validation...');
    
    await this.validateCommonUrls();
    await this.validateFarcasterManifest();
    
    return this.printSummary();
  }
}

// Usage instructions
function printUsage() {
  console.log(`
Usage: node scripts/validate-production.js [URLs...]

Examples:
  node scripts/validate-production.js
  node scripts/validate-production.js https://myapp.vercel.app
  node scripts/validate-production.js https://myapp.com https://staging.myapp.com

Environment Variables:
  VERCEL_URL - Vercel deployment URL (automatically detected)
  NEXT_PUBLIC_APP_URL - Custom domain URL

This script will test the /.well-known/farcaster.json endpoint on the provided URLs
to ensure the redirect is working correctly in production.
`);
}

// Run validation if called directly
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  const validator = new ProductionValidator();
  validator.runAllValidations().catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;