# Security Policy

## Environment Variables

**CRITICAL**: Never commit actual API keys, passwords, or secrets to the repository!

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Flask Configuration
SECRET_KEY=your-secret-key-here-change-in-production

# Google Gemini API
GOOGLE_API_KEY=your-google-gemini-api-key-here
```

### Setup Instructions

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and replace placeholder values with your actual credentials

3. Never commit `.env` files to git

### Getting API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GOOGLE_API_KEY`

#### MongoDB Atlas
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Add it to your `.env` file as `MONGO_URI`

#### AbuseIPDB (Optional)
1. Visit [AbuseIPDB](https://www.abuseipdb.com/api)
2. Register for a free API key
3. Add it to your `.env` file as `ABUSEIPDB_API_KEY`

## Security Best Practices

### 1. API Key Rotation
- Rotate all API keys regularly (every 90 days minimum)
- Rotate immediately if exposed or compromised

### 2. Access Control
- Use least privilege principle for database access
- Enable IP whitelisting on MongoDB Atlas
- Use strong passwords for all services

### 3. Secret Management
- Use environment variables for all secrets
- Never hardcode credentials in source code
- Use secrets management tools in production (e.g., AWS Secrets Manager, HashiCorp Vault)

### 4. Docker Security
- Don't build Docker images with secrets
- Use Docker secrets or environment variables at runtime
- Scan images for vulnerabilities regularly

## Reporting Security Issues

If you discover a security vulnerability, please email: security@rakshak.ai

**DO NOT** open a public issue for security vulnerabilities.

## Checklist Before Committing

- [ ] No `.env` files in commits
- [ ] No API keys in code
- [ ] No passwords in code
- [ ] No MongoDB connection strings with credentials
- [ ] `env.example` updated with new variables (without actual values)
- [ ] `.gitignore` includes all sensitive files

## Git History Cleanup

If you accidentally committed secrets:

1. Remove the file from git:
   ```bash
   git rm --cached .env
   ```

2. Add to .gitignore:
   ```bash
   echo ".env" >> .gitignore
   ```

3. Commit the changes:
   ```bash
   git add .gitignore
   git commit -m "Remove sensitive files from tracking"
   ```

4. **IMPORTANT**: Rotate all exposed credentials immediately!

5. Clean git history (use with caution):
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all
   ```

## Production Security

### Environment Variables in Production

Use your hosting platform's environment variable management:

- **Heroku**: `heroku config:set VARIABLE_NAME=value`
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Docker**: Use Docker secrets or pass via environment
- **Vercel/Netlify**: Use dashboard environment variables

### HTTPS Only
- Always use HTTPS in production
- Enable HSTS headers
- Use secure cookies

### Rate Limiting
- Implement rate limiting on all API endpoints
- Use API gateways for additional protection

### Monitoring
- Monitor for unusual API usage patterns
- Set up alerts for failed authentication attempts
- Log security events (without logging secrets!)

