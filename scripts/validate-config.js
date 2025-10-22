#!/usr/bin/env node

/**
 * Configuration validation script for Farcaster manifest redirect
 * Validates Vercel and Next.js configurations before deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Expected configuration values
const EXPECTED_MANIFEST_URL = 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9';
const EXPECTED_STATUS_CODE = 307;
const EXPECTED_SOURCE = '/.well-known/farcaster.json';

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    switch (type) {
      case 'error':
        this.errors.push(message);
        break;
      case 'warning':
        this.warnings.push(message);
        break;
      case 'success':
        this.success.push(message);
        break;
    }
  }

  async validateVercelConfig() {
    this.log('info', 'Validating Vercel configuration...');
    
    try {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      
      if (!fs.existsSync(vercelConfigPath)) {
        this.log('error', 'vercel.json file not found');
        return false;
      }

      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Check redirects configuration
      if (!vercelConfig.redirects || !Array.isArray(vercelConfig.redirects)) {
        this.log('error', 'No redirects configuration found in vercel.json');
        return false;
      }

      const farcasterRedirect = vercelConfig.redirects.find(
        redirect => redirect.source === EXPECTED_SOURCE
      );

      if (!farcasterRedirect) {
        this.log('error', `No redirect found for ${EXPECTED_SOURCE} in vercel.json`);
        return false;
      }

      // Validate redirect properties
      if (farcasterRedirect.destination !== EXPECTED_MANIFEST_URL) {
        this.log('error', `Incorrect destination URL in vercel.json. Expected: ${EXPECTED_MANIFEST_URL}, Found: ${farcasterRedirect.destination}`);
        return false;
      }

      if (farcasterRedirect.statusCode !== EXPECTED_STATUS_CODE) {
        this.log('error', `Incorrect status code in vercel.json. Expected: ${EXPECTED_STATUS_CODE}, Found: ${farcasterRedirect.statusCode}`);
        return false;
      }

      // Check headers configuration
      if (!vercelConfig.headers || !Array.isArray(vercelConfig.headers)) {
        this.log('warning', 'No headers configuration found in vercel.json');
      } else {
        const farcasterHeaders = vercelConfig.headers.find(
          header => header.source === EXPECTED_SOURCE
        );
        
        if (farcasterHeaders) {
          this.log('success', 'Farcaster headers configuration found in vercel.json');
        } else {
          this.log('warning', 'No specific headers configuration for Farcaster endpoint');
        }
      }

      this.log('success', 'Vercel configuration validation passed');
      return true;
    } catch (error) {
      this.log('error', `Error validating vercel.json: ${error.message}`);
      return false;
    }
  }

  async validateNextConfig() {
    this.log('info', 'Validating Next.js configuration...');
    
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      
      if (!fs.existsSync(nextConfigPath)) {
        this.log('error', 'next.config.ts file not found');
        return false;
      }

      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Check if redirects function exists
      if (!nextConfigContent.includes('redirects()')) {
        this.log('error', 'No redirects function found in next.config.ts');
        return false;
      }

      // Check for Farcaster redirect configuration
      if (!nextConfigContent.includes(EXPECTED_SOURCE)) {
        this.log('error', `No redirect configuration for ${EXPECTED_SOURCE} found in next.config.ts`);
        return false;
      }

      if (!nextConfigContent.includes(EXPECTED_MANIFEST_URL)) {
        this.log('error', `Incorrect destination URL in next.config.ts. Expected: ${EXPECTED_MANIFEST_URL}`);
        return false;
      }

      if (!nextConfigContent.includes(`statusCode: ${EXPECTED_STATUS_CODE}`)) {
        this.log('error', `Incorrect status code in next.config.ts. Expected: ${EXPECTED_STATUS_CODE}`);
        return false;
      }

      this.log('success', 'Next.js configuration validation passed');
      return true;
    } catch (error) {
      this.log('error', `Error validating next.config.ts: ${error.message}`);
      return false;
    }
  }

  async validateApiRoute() {
    this.log('info', 'Validating API route implementation...');
    
    try {
      const apiRoutePath = path.join(process.cwd(), 'src/app/api/well-known/farcaster/route.ts');
      
      if (!fs.existsSync(apiRoutePath)) {
        this.log('warning', 'API route not found - this is optional but recommended as fallback');
        return true;
      }

      const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');
      
      // Check for required HTTP methods
      const requiredMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      for (const method of requiredMethods) {
        if (!apiRouteContent.includes(`export async function ${method}`)) {
          this.log('error', `Missing ${method} method in API route`);
          return false;
        }
      }

      // Check for correct manifest URL
      if (!apiRouteContent.includes(EXPECTED_MANIFEST_URL)) {
        this.log('error', `Incorrect manifest URL in API route. Expected: ${EXPECTED_MANIFEST_URL}`);
        return false;
      }

      // Check for 307 status code
      if (!apiRouteContent.includes('status: 307')) {
        this.log('error', 'Incorrect status code in API route. Expected: 307');
        return false;
      }

      this.log('success', 'API route validation passed');
      return true;
    } catch (error) {
      this.log('error', `Error validating API route: ${error.message}`);
      return false;
    }
  }

  async validateTargetUrl() {
    this.log('info', 'Validating target URL accessibility...');
    
    return new Promise((resolve) => {
      const url = new URL(EXPECTED_MANIFEST_URL);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'HEAD',
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.log('success', `Target URL is accessible (Status: ${res.statusCode})`);
          resolve(true);
        } else {
          this.log('warning', `Target URL returned status ${res.statusCode} - this may be expected for manifest endpoints`);
          resolve(true); // Don't fail validation for this
        }
      });

      req.on('error', (error) => {
        this.log('warning', `Could not validate target URL accessibility: ${error.message}`);
        resolve(true); // Don't fail validation for network issues
      });

      req.on('timeout', () => {
        this.log('warning', 'Target URL validation timed out');
        req.destroy();
        resolve(true); // Don't fail validation for timeouts
      });

      req.end();
    });
  }

  async validateEnvironment() {
    this.log('info', 'Validating environment configuration...');
    
    // Check if we're in a development environment
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    if (isDev) {
      this.log('info', 'Running in development environment');
      
      // Check if package.json has required scripts
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.build) {
          this.log('success', 'Build script found in package.json');
        } else {
          this.log('error', 'No build script found in package.json');
          return false;
        }
        
        if (packageJson.scripts && packageJson.scripts.dev) {
          this.log('success', 'Dev script found in package.json');
        } else {
          this.log('warning', 'No dev script found in package.json');
        }
      }
    } else {
      this.log('info', `Running in ${process.env.NODE_ENV} environment`);
    }

    return true;
  }

  async runAllValidations() {
    this.log('info', 'Starting configuration validation...');
    
    const results = await Promise.all([
      this.validateVercelConfig(),
      this.validateNextConfig(),
      this.validateApiRoute(),
      this.validateTargetUrl(),
      this.validateEnvironment()
    ]);

    this.printSummary();
    
    const allPassed = results.every(result => result === true);
    return allPassed && this.errors.length === 0;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    if (this.success.length > 0) {
      console.log(`\n✅ SUCCESS (${this.success.length}):`);
      this.success.forEach(msg => console.log(`  - ${msg}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(msg => console.log(`  - ${msg}`));
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach(msg => console.log(`  - ${msg}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('🎉 Configuration validation PASSED! Ready for deployment.');
    } else {
      console.log('💥 Configuration validation FAILED! Please fix the errors above.');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ConfigValidator();
  validator.runAllValidations().catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = ConfigValidator;