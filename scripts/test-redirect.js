#!/usr/bin/env node

/**
 * Development test script for Farcaster manifest redirect
 * Tests the redirect functionality in development environment
 */

const http = require('http');
const https = require('https');

class RedirectTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async testRedirect(method = 'GET') {
    return new Promise((resolve) => {
      const url = `${this.baseUrl}/.well-known/farcaster.json`;
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      this.log(`Testing ${method} request to ${url}`);
      
      const options = {
        method: method,
        timeout: 5000,
        // Don't follow redirects automatically
        maxRedirects: 0
      };

      const req = client.request(url, options, (res) => {
        const result = {
          method,
          statusCode: res.statusCode,
          location: res.headers.location,
          cacheControl: res.headers['cache-control'],
          accessControl: res.headers['access-control-allow-origin'],
          success: false,
          message: ''
        };

        if (res.statusCode === 307) {
          if (res.headers.location && res.headers.location.includes('api.farcaster.xyz')) {
            result.success = true;
            result.message = `✅ ${method} redirect working correctly`;
          } else {
            result.message = `❌ ${method} redirect has wrong location: ${res.headers.location}`;
          }
        } else {
          result.message = `❌ ${method} returned status ${res.statusCode}, expected 307`;
        }

        this.testResults.push(result);
        this.log(result.message);
        resolve(result);
      });

      req.on('error', (error) => {
        const result = {
          method,
          success: false,
          message: `❌ ${method} request failed: ${error.message}`
        };
        this.testResults.push(result);
        this.log(result.message);
        resolve(result);
      });

      req.on('timeout', () => {
        const result = {
          method,
          success: false,
          message: `❌ ${method} request timed out`
        };
        this.testResults.push(result);
        this.log(result.message);
        req.destroy();
        resolve(result);
      });

      req.end();
    });
  }

  async testAllMethods() {
    this.log('Starting redirect tests...');
    
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const results = [];

    for (const method of methods) {
      const result = await this.testRedirect(method);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  async testTargetUrl() {
    this.log('Testing target URL accessibility...');
    
    const targetUrl = 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9';
    
    return new Promise((resolve) => {
      const req = https.request(targetUrl, { method: 'HEAD', timeout: 10000 }, (res) => {
        const result = {
          success: res.statusCode >= 200 && res.statusCode < 500,
          statusCode: res.statusCode,
          message: res.statusCode >= 200 && res.statusCode < 500 
            ? `✅ Target URL accessible (Status: ${res.statusCode})`
            : `⚠️  Target URL returned status ${res.statusCode}`
        };
        
        this.log(result.message);
        resolve(result);
      });

      req.on('error', (error) => {
        const result = {
          success: false,
          message: `❌ Target URL test failed: ${error.message}`
        };
        this.log(result.message);
        resolve(result);
      });

      req.on('timeout', () => {
        this.log('⚠️  Target URL test timed out');
        req.destroy();
        resolve({ success: false, message: 'Target URL test timed out' });
      });

      req.end();
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('REDIRECT TEST SUMMARY');
    console.log('='.repeat(60));
    
    const successfulTests = this.testResults.filter(r => r.success);
    const failedTests = this.testResults.filter(r => !r.success);
    
    console.log(`\nTotal tests: ${this.testResults.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    
    if (successfulTests.length > 0) {
      console.log('\n✅ SUCCESSFUL TESTS:');
      successfulTests.forEach(test => {
        console.log(`  - ${test.method}: Status ${test.statusCode}, Location: ${test.location}`);
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`  - ${test.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failedTests.length === 0) {
      console.log('🎉 All redirect tests PASSED!');
      return true;
    } else {
      console.log('💥 Some redirect tests FAILED!');
      return false;
    }
  }

  async runAllTests() {
    const redirectResults = await this.testAllMethods();
    const targetResult = await this.testTargetUrl();
    
    return this.printSummary();
  }
}

// Helper function to check if development server is running
async function checkDevServer(url = 'http://localhost:3000') {
  return new Promise((resolve) => {
    const req = http.request(url, { method: 'HEAD', timeout: 2000 }, (res) => {
      resolve(true);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Run tests if called directly
if (require.main === module) {
  async function main() {
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    
    console.log(`Testing redirects on: ${baseUrl}`);
    
    // Check if server is running
    const serverRunning = await checkDevServer(baseUrl);
    if (!serverRunning) {
      console.log('❌ Development server is not running. Please start it with: npm run dev');
      process.exit(1);
    }
    
    const tester = new RedirectTester(baseUrl);
    const success = await tester.runAllTests();
    
    process.exit(success ? 0 : 1);
  }
  
  main().catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
}

module.exports = RedirectTester;