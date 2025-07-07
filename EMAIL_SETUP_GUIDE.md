# 📧 Email Setup Guide for Threat Combat Backend

This guide will help you configure email functionality for the Threat Combat platform.

## 🚀 Quick Setup (Gmail - Recommended for Development)

### Step 1: Create `.env` File

Create a `.env` file in your project root with the following content:

```bash
# ========================================
# THREAT COMBAT BACKEND - ENVIRONMENT VARIABLES
# ========================================

# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# ========================================
# DATABASE CONFIGURATION
# ========================================
MONGODB_URI=mongodb://localhost:27017/threat-combat

# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=threat-combat-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# ========================================
# EMAIL CONFIGURATION (Gmail)
# ========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=Threat Combat <your-email@gmail.com>

# ========================================
# SECURITY CONFIGURATION
# ========================================
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=3600000
PASSWORD_RESET_EXPIRES_IN=3600000
EMAIL_VERIFICATION_EXPIRES_IN=86400000

# ========================================
# CORS CONFIGURATION
# ========================================
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL=info
ENABLE_AUDIT_LOGGING=true

# ========================================
# DEVELOPMENT CONFIGURATION
# ========================================
DEBUG=true
ENABLE_SWAGGER=true
ENABLE_MOCK_DATA=false
```

### Step 2: Set up Gmail App Password

1. **Go to your Google Account settings**: https://myaccount.google.com/
2. **Enable 2-Factor Authentication** (if not already enabled)
3. **Go to Security → App passwords**
4. **Generate a new app password** for "Mail"
5. **Use that 16-character password** in your `EMAIL_PASS` variable

### Step 3: Test Email Configuration

1. **Start your server**:
   ```bash
   npm start
   ```

2. **Test environment variables**:
   ```bash
   GET http://localhost:5000/api/test/config
   ```

3. **Test email sending**:
   ```bash
   POST http://localhost:5000/api/test/email
   Content-Type: application/json
   
   {
     "email": "your-test-email@gmail.com",
     "name": "Test User"
   }
   ```

## 🔧 Alternative Email Services

### SendGrid (Recommended for Production)

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=Threat Combat <noreply@yourdomain.com>
```

**Setup Steps:**
1. Create a SendGrid account
2. Generate an API key
3. Verify your sender domain
4. Use the API key as `EMAIL_PASS`

### AWS SES

```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-access-key
EMAIL_PASS=your-ses-secret-key
EMAIL_FROM=Threat Combat <noreply@yourdomain.com>
```

**Setup Steps:**
1. Create an AWS account
2. Set up SES in your preferred region
3. Create SMTP credentials
4. Verify your sender email/domain

### Outlook/Hotmail

```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=Threat Combat <your-email@outlook.com>
```

### Yahoo Mail

```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Threat Combat <your-email@yahoo.com>
```

## 📧 Email Templates Available

The system includes the following email templates:

1. **Email Verification** - Sent when users register
2. **Password Reset** - Sent when users request password reset
3. **Welcome Email** - Sent after successful email verification
4. **Account Lockout** - Sent when account is locked due to failed attempts
5. **Security Alert** - Sent for suspicious login attempts

## 🧪 Testing Email Configuration

### Using Postman

1. Import the `Threat_Combat_API.postman_collection.json`
2. Go to the "Testing" folder
3. Use "Test Environment Variables" to check configuration
4. Use "Test Email Configuration" to send a test email

### Using cURL

```bash
# Test environment variables
curl -X GET http://localhost:5000/api/test/config

# Test email sending
curl -X POST http://localhost:5000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@gmail.com",
    "name": "Test User"
  }'
```

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Check your email and password
   - Ensure you're using an app password for Gmail
   - Verify 2FA is enabled for Gmail

2. **"Connection timeout" error**:
   - Check your internet connection
   - Verify the SMTP host and port
   - Check firewall settings

3. **"Authentication failed" error**:
   - Double-check your credentials
   - Ensure you're using the correct email service
   - Try regenerating app passwords

4. **Emails not received**:
   - Check spam/junk folder
   - Verify sender email address
   - Check email service limits

### Debug Mode

Enable debug mode in your `.env`:

```bash
DEBUG=true
```

This will show detailed SMTP communication logs.

## 🚀 Production Deployment

For production, consider:

1. **Use a professional email service** (SendGrid, AWS SES, Mailgun)
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery rates**
4. **Set up email analytics**
5. **Implement email queuing** for high volume

## 📊 Email Service Comparison

| Service | Free Tier | Setup Difficulty | Reliability | Cost |
|---------|-----------|------------------|-------------|------|
| Gmail | 500/day | Easy | Good | Free |
| SendGrid | 100/day | Medium | Excellent | $14.95/month |
| AWS SES | 62,000/month | Hard | Excellent | $0.10/1000 |
| Mailgun | 5,000/month | Medium | Good | $35/month |

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use app passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Monitor for suspicious activity**
5. **Use environment-specific configurations**

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the server logs for detailed error messages
3. Test with a different email service
4. Verify your network connectivity

---

**Note**: This email system is designed for the Threat Combat cybersecurity education platform and includes security features like rate limiting, audit logging, and secure token generation. 