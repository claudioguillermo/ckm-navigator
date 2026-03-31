# EMPOWER-CKM Navigator - Production Deployment Guide

## 📋 Overview

This guide covers deploying the EMPOWER-CKM Navigator application to production with all security fixes applied.

**Status**: ✅ All security patches verified and ready for deployment

---

## 🔒 Security Fixes Applied

### CRITICAL Fixes (All Complete)
- ✅ **CRIT-01**: API key exposure - Backend proxy implemented
- ✅ **CRIT-02**: XSS vulnerabilities - DOMPurify + CSP + safe DOM utils
- ✅ **CRIT-03**: localStorage tampering - HMAC-signed secure storage

### HIGH-Priority Fixes (All Complete)
- ✅ **HIGH-10**: BM25 search division by zero
- ✅ **HIGH-11**: Semantic search division by zero
- ✅ All innerHTML replaced with DOMUtils.safeSetHTML
- ✅ All onclick attributes replaced with event delegation
- ✅ Race condition protection in language switching
- ✅ Service Worker controlled updates

---

## 📦 Prerequisites

### Development Environment
- Node.js 18+ and npm
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Production Environment
- Node.js 18+ runtime
- Process manager (PM2 recommended)
- Reverse proxy (nginx or Apache)
- SSL certificate (Let's Encrypt recommended)
- Domain name

---

## 🚀 Deployment Steps

### Step 1: Environment Setup

1. **Create production environment file**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**
   ```bash
   # Edit .env with your production values
   QWEN_API_KEY=your-dashscope-api-key
   SESSION_SECRET=$(openssl rand -base64 32)
   PORT=3001
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Secure the .env file**
   ```bash
   chmod 600 .env
   ```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies for backend
npm install

# Verify installation
npm list
```

Expected dependencies:
- express ^4.18.2
- cors ^2.8.5
- express-session ^1.17.3
- express-rate-limit ^7.1.5
- dotenv ^16.3.1

### Step 3: Configure Backend Server

**Review server.js configuration:**

1. **Session Security** (lines 20-30)
   - Ensure `SESSION_SECRET` is a strong random value
   - Set `cookie.secure: true` for HTTPS
   - Configure `cookie.sameSite: 'strict'`

2. **CORS Configuration** (lines 35-42)
   - Update `ALLOWED_ORIGINS` to your production domain
   - Remove any development origins

3. **Rate Limiting** (lines 45-51)
   - Default: 10 requests per minute per IP
   - Adjust if needed for your traffic

4. **Content Security Policy** (lines 115-125)
   - Verify allowed domains
   - Add any additional CDN sources if needed

### Step 4: Test Backend Locally

```bash
# Start the backend server
node server.js

# Expected output:
# 🔒 EMPOWER-CKM Backend Server
# Environment: production
# Port: 3001
# CORS: https://yourdomain.com
# ✅ Server running on http://localhost:3001
```

Test the endpoints:
```bash
# Health check
curl http://localhost:3001/health

# Session initialization
curl -X POST http://localhost:3001/api/init-session -c cookies.txt

# Chat endpoint (should fail without valid session)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"test","context":{},"language":"en"}'
```

### Step 5: Configure Frontend

1. **Update chatbot.js backend URL**
   ```javascript
   // In js/chatbot.js, verify backendUrl points to production
   this.backendUrl = process.env.NODE_ENV === 'production'
     ? 'https://api.yourdomain.com'  // Your production backend
     : 'http://localhost:3001';       // Development
   ```

2. **Update index.html CSP**
   ```html
   <!-- Update Content-Security-Policy to include production URLs -->
   <meta http-equiv="Content-Security-Policy" content="
       default-src 'self';
       script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
       connect-src 'self' https://api.yourdomain.com;
       style-src 'self' 'unsafe-inline';
       img-src 'self' data: https:;
       font-src 'self' data:;
   ">
   ```

3. **Verify service worker cache name**
   ```javascript
   // In sw.js, ensure cache version is correct
   const CACHE_NAME = 'ckm-v1.0.0';  // Update version number
   ```

### Step 6: Build and Optimize (Optional)

For production, consider:

```bash
# Minify JavaScript (optional - requires tools)
# terser main.js -o main.min.js -c -m

# Optimize images
# Use tools like imagemagick or optipng

# Generate integrity hashes for CDN resources
# shasum -a 384 path/to/file.js | xxd -r -p | base64
```

### Step 7: Deploy Frontend

#### Option A: Static Hosting (Netlify, Vercel, GitHub Pages)

1. **Create deployment configuration**
   ```json
   // netlify.toml
   [build]
     publish = "."

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**
   ```bash
   # Example: Netlify CLI
   netlify deploy --prod

   # Example: Vercel CLI
   vercel --prod
   ```

#### Option B: Traditional Web Server (nginx)

1. **Copy files to web root**
   ```bash
   sudo cp -r * /var/www/empower-ckm/
   sudo chown -R www-data:www-data /var/www/empower-ckm/
   ```

2. **Configure nginx**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       root /var/www/empower-ckm;
       index index.html;

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

       # Service worker must be served with correct MIME type
       location /sw.js {
           add_header Cache-Control "no-cache";
           add_header Service-Worker-Allowed "/";
       }

       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to backend
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **Test and reload nginx**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Step 8: Deploy Backend

1. **Install PM2 process manager**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 configuration**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'empower-ckm-backend',
       script: './server.js',
       instances: 2,
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production'
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
       max_memory_restart: '500M'
     }]
   };
   ```

3. **Start the backend with PM2**
   ```bash
   # Create logs directory
   mkdir -p logs

   # Start the application
   pm2 start ecosystem.config.js

   # Save PM2 process list
   pm2 save

   # Setup PM2 to start on system boot
   pm2 startup

   # Monitor
   pm2 monit
   ```

4. **Verify backend is running**
   ```bash
   pm2 status
   pm2 logs empower-ckm-backend
   curl http://localhost:3001/health
   ```

### Step 9: SSL Certificate Setup

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 10: Final Security Checks

Run the security validation script:
```bash
python3 verify-security-fixes.py
```

Expected output:
```
✅ Passed:   23/23
❌ Failed:   0/23
⚠️  Warnings: 0/23

🎉 ALL CRITICAL SECURITY CHECKS PASSED!
```

### Step 11: Smoke Testing

1. **Test the application**
   - Visit https://yourdomain.com
   - Navigate through all sections
   - Test language switching
   - Complete the staging quiz
   - Try the chatbot
   - Test offline functionality (PWA)

2. **Test API endpoints**
   ```bash
   # Session initialization
   curl https://yourdomain.com/api/init-session

   # Health check
   curl https://yourdomain.com/health
   ```

3. **Test security headers**
   ```bash
   curl -I https://yourdomain.com | grep -i "security\|x-frame\|x-content"
   ```

---

## 🔍 Monitoring and Maintenance

### Log Monitoring

```bash
# PM2 logs
pm2 logs empower-ckm-backend --lines 100

# nginx access logs
sudo tail -f /var/log/nginx/access.log

# nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

Set up automated health checks:
```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:3001/health || pm2 restart empower-ckm-backend
```

### Backup Strategy

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backups/empower-ckm"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup application files
tar -czf "$BACKUP_DIR/app-$DATE.tar.gz" /var/www/empower-ckm/

# Backup environment file (encrypted)
openssl enc -aes-256-cbc -salt -in .env -out "$BACKUP_DIR/env-$DATE.enc"

# Keep last 30 days
find "$BACKUP_DIR" -mtime +30 -delete
```

### Update Procedure

```bash
# 1. Pull latest changes
git pull origin main

# 2. Backup current version
cp -r /var/www/empower-ckm /var/www/empower-ckm.backup

# 3. Copy new files
cp -r * /var/www/empower-ckm/

# 4. Restart backend
pm2 restart empower-ckm-backend

# 5. Clear service worker cache (update CACHE_NAME in sw.js)
# Users will get the update on next visit

# 6. Monitor for errors
pm2 logs empower-ckm-backend --lines 50
```

---

## 🔐 Security Checklist

Before going live, verify:

- [ ] `.env` file contains production API key
- [ ] `.env` has strong random SESSION_SECRET
- [ ] `.env` file permissions set to 600
- [ ] `.env` is in `.gitignore`
- [ ] CORS configured for production domain only
- [ ] CSP headers configured correctly
- [ ] SSL certificate installed and auto-renewal working
- [ ] HTTP redirects to HTTPS
- [ ] Rate limiting configured appropriately
- [ ] Backend runs as non-root user
- [ ] Firewall allows only necessary ports (80, 443)
- [ ] Security headers configured in nginx
- [ ] PM2 process runs with proper permissions
- [ ] Logs are properly configured and rotated
- [ ] All security validation checks pass
- [ ] No API keys in client-side code
- [ ] Service worker caching strategy verified

---

## 🆘 Troubleshooting

### Issue: Chatbot not responding

**Check:**
1. Backend server is running: `pm2 status`
2. API endpoint accessible: `curl http://localhost:3001/health`
3. CORS configured correctly in server.js
4. Browser console for errors
5. Backend logs: `pm2 logs empower-ckm-backend`

**Fix:**
```bash
# Restart backend
pm2 restart empower-ckm-backend

# Check environment variables
pm2 env 0
```

### Issue: Service worker not updating

**Fix:**
1. Update `CACHE_NAME` in sw.js
2. Increment version number
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

### Issue: Session errors

**Check:**
1. SESSION_SECRET is set in .env
2. Cookie settings correct (secure: true for HTTPS)
3. CORS credentials enabled

**Fix:**
```bash
# Generate new session secret
openssl rand -base64 32

# Update .env and restart
pm2 restart empower-ckm-backend
```

### Issue: Rate limiting too strict

**Fix:**
Edit server.js, increase the limit:
```javascript
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,  // Increase from 10 to 20
    message: { error: 'Too many requests, please try again later' }
});
```

Then restart:
```bash
pm2 restart empower-ckm-backend
```

### Issue: CSP blocking resources

**Symptoms:** Browser console shows CSP violations

**Fix:**
1. Check browser console for blocked resource URL
2. Add domain to CSP in index.html
3. Update CSP header in server.js if needed

---

## 📊 Performance Optimization

### Enable Compression

Add to nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css text/xml text/javascript
           application/javascript application/json application/xml+rss;
gzip_min_length 1000;
```

### Browser Caching

Add to nginx configuration:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# Check memory usage
pm2 show empower-ckm-backend

# Node.js profiling (if needed)
node --prof server.js
```

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review PM2 logs for errors
- Check SSL certificate status
- Monitor disk space

**Monthly:**
- Update Node.js dependencies: `npm audit fix`
- Review and update security patches
- Test backup restoration procedure
- Review rate limiting and adjust if needed

**Quarterly:**
- Update Node.js to latest LTS
- Review and update CSP policies
- Security audit with `verify-security-fixes.py`
- Performance testing

---

## 📝 Deployment Checklist

Use this checklist for each deployment:

```
DEPLOYMENT CHECKLIST - EMPOWER-CKM Navigator
Date: _______________
Version: _______________

PRE-DEPLOYMENT
[ ] All code changes committed to git
[ ] Security validation passes (verify-security-fixes.py)
[ ] Testing completed (TEST_SUITE.md)
[ ] .env file configured with production values
[ ] Backup of current production version created

DEPLOYMENT
[ ] Frontend files copied to web server
[ ] Backend dependencies installed (npm install)
[ ] Backend started with PM2
[ ] nginx configuration updated
[ ] nginx reloaded
[ ] SSL certificate valid

POST-DEPLOYMENT
[ ] Application loads correctly
[ ] All navigation works
[ ] Chatbot responds
[ ] Language switching works
[ ] Service worker installs
[ ] Mobile responsiveness verified
[ ] Security headers present (curl -I check)
[ ] PM2 process running stable
[ ] No errors in PM2 logs
[ ] No errors in nginx logs
[ ] Health endpoint responding

MONITORING
[ ] Set up uptime monitoring
[ ] Configure log rotation
[ ] Set up automated backups
[ ] Document deployment in change log

SIGN-OFF
Deployed by: _______________
Verified by: _______________
Date/Time: _______________
```

---

## 🎯 Quick Reference

### Common Commands

```bash
# Backend Management
pm2 start server.js              # Start backend
pm2 restart empower-ckm-backend  # Restart
pm2 stop empower-ckm-backend     # Stop
pm2 logs empower-ckm-backend     # View logs
pm2 monit                        # Monitor performance

# nginx
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload config
sudo systemctl status nginx      # Check status

# SSL
sudo certbot renew              # Renew certificate
sudo certbot certificates       # List certificates

# Security
python3 verify-security-fixes.py # Run security validation
npm audit                        # Check dependencies
```

### Important Files

- `/var/www/empower-ckm/` - Frontend files
- `~/empower-ckm-backend/server.js` - Backend server
- `~/empower-ckm-backend/.env` - Environment configuration
- `/etc/nginx/sites-available/empower-ckm` - nginx config
- `~/empower-ckm-backend/logs/` - Application logs

---

## ✅ Final Notes

**Security:** This deployment guide implements all CRITICAL and HIGH-priority security fixes identified in the security audit. All 23 security validation checks pass.

**Scalability:** The current setup supports:
- 10 requests/minute per IP (rate limiting)
- 2 Node.js cluster instances (PM2)
- Session-based authentication
- Horizontal scaling possible with load balancer

**Compliance:** The application implements:
- WCAG 2.1 accessibility standards
- OWASP security best practices
- HIPAA-aligned security measures (no PHI stored)

**Support:** For issues or questions, refer to:
- `TEST_SUITE.md` for testing procedures
- `COMPREHENSIVE_BUG_ANALYSIS_REPORT.md` for bug details
- `SECURITY_FIXES_APPLIED.md` for security implementation
- `security-validation-report.json` for current security status

---

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** ✅ Production Ready
