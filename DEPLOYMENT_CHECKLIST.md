# Farcaster Manifest Redirect - Deployment Checklist

This checklist ensures that the Farcaster manifest redirect is properly configured and ready for deployment.

## Pre-Deployment Validation

### 1. Configuration Validation
Run the configuration validation script to ensure all settings are correct:

```bash
npm run validate:config
```

This script validates:
- ✅ Vercel.json redirect configuration
- ✅ Next.js redirect configuration  
- ✅ API route implementation (if present)
- ✅ Target URL format and accessibility
- ✅ Environment setup

### 2. Development Testing
Test the redirect functionality in your local development environment:

```bash
# Start the development server
npm run dev

# In another terminal, test the redirects
npm run test:redirect
```

This will test:
- ✅ GET request redirect (307 status)
- ✅ POST request redirect (307 status)
- ✅ PUT request redirect (307 status)
- ✅ DELETE request redirect (307 status)
- ✅ Correct Location header
- ✅ Proper cache headers

### 3. Manual Development Test
You can also manually test using curl:

```bash
# Test GET request
curl -I http://localhost:3000/.well-known/farcaster.json

# Expected response:
# HTTP/1.1 307 Temporary Redirect
# Location: https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9
```

## Deployment Steps

### 1. Build Validation
Ensure the application builds successfully:

```bash
npm run build
```

### 2. Deploy to Vercel
Deploy using the Vercel CLI or GitHub integration:

```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy
```

### 3. Post-Deployment Validation
After deployment, validate the production URLs:

```bash
# Test your production URL
npm run validate:production https://your-app.vercel.app

# Or test multiple URLs
npm run validate:production https://your-app.vercel.app https://your-custom-domain.com
```

## Configuration Details

### Vercel Configuration (vercel.json)
```json
{
  "redirects": [
    {
      "source": "/.well-known/farcaster.json",
      "destination": "https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9",
      "statusCode": 307
    }
  ]
}
```

### Next.js Configuration (next.config.ts)
```typescript
async redirects() {
  return [
    {
      source: '/.well-known/farcaster.json',
      destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9',
      statusCode: 307
    }
  ];
}
```

## Troubleshooting

### Common Issues

#### 1. 404 Not Found
- **Cause**: Redirect configuration not properly deployed
- **Solution**: Check vercel.json and next.config.ts configurations
- **Validation**: Run `npm run validate:config`

#### 2. Wrong Status Code
- **Cause**: Configuration using 301/302 instead of 307
- **Solution**: Ensure statusCode is set to 307 in all configurations
- **Validation**: Test with `curl -I` to check response headers

#### 3. Wrong Redirect Location
- **Cause**: Incorrect destination URL in configuration
- **Solution**: Verify the Farcaster hosted manifest URL is correct
- **Expected URL**: `https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9`

#### 4. CORS Issues
- **Cause**: Missing Access-Control headers
- **Solution**: Ensure headers configuration in vercel.json includes CORS headers
- **Validation**: Check response headers include `Access-Control-Allow-Origin: *`

### Debug Commands

```bash
# Check configuration
npm run validate:config

# Test local redirects
npm run test:redirect

# Test production URLs
npm run validate:production https://your-app.vercel.app

# Manual curl test
curl -I https://your-app.vercel.app/.well-known/farcaster.json

# Check Farcaster manifest directly
curl -I https://api.farcaster.xyz/miniapps/hosted-manifest/019a0c8d-ede3-469a-927c-eef08b025bc9
```

## Requirements Verification

This deployment satisfies the following requirements:

### Requirement 1 (Gereksinim 1)
- ✅ **1.1**: 307 temporary redirect for GET requests
- ✅ **1.2**: Correct Location header with Farcaster hosted manifest URL
- ✅ **1.3**: Response time under 500ms (Vercel edge redirects ~50-100ms)
- ✅ **1.4**: Support for POST, PUT, DELETE methods

### Requirement 2 (Gereksinim 2)
- ✅ **2.1**: Configuration in next.config.ts
- ✅ **2.2**: Automatic loading on application restart
- ✅ **2.3**: Clear error messages for invalid configuration

### Requirement 3 (Gereksinim 3)
- ✅ **3.1**: Same behavior in development and production
- ✅ **3.2**: Vercel deployment support
- ✅ **3.3**: Redirect response even if target URL is inaccessible

## Success Criteria

✅ All validation scripts pass  
✅ Development tests pass  
✅ Build completes successfully  
✅ Production deployment successful  
✅ Production validation passes  
✅ Manual curl tests return 307 with correct Location header  
✅ Farcaster clients can access manifest via redirect  

## Environment Variables

No environment variables are required for the redirect functionality. The configuration is hardcoded in the config files as per the requirements.

## Monitoring

After deployment, monitor:
- Response times for `/.well-known/farcaster.json` endpoint
- Error rates and status codes
- Vercel function logs for any issues
- Farcaster hosted manifest availability

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous Vercel deployment
2. **Configuration**: Restore previous vercel.json and next.config.ts
3. **Fallback**: API route will handle requests if redirects fail
4. **Monitoring**: Check Vercel dashboard for deployment status

---

**Last Updated**: $(date)  
**Validation Scripts**: Available in `/scripts/` directory  
**Configuration Files**: `vercel.json`, `next.config.ts`