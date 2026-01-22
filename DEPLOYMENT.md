# Nthcreation - Deployment Guide

## Environment Configuration

This project supports three environments: **development**, **staging**, and **production**.

### Environment Files

Each environment has its own configuration file in `apps/api/`:

- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Setup

1. **Development**
```bash
# Copy example file
cp apps/api/.env.example apps/api/.env

# Add your OpenAI API key
# Edit apps/api/.env and set OPENAI_API_KEY
```

2. **Staging**
```bash
# Edit apps/api/.env.staging
# Set your staging OpenAI API key
```

3. **Production**
```bash
# Edit apps/api/.env.production
# Set your production OpenAI API key
```

### Running Different Environments

```bash
# Development (default)
pnpm dev

# Staging
pnpm dev:staging

# Production
pnpm dev:production
```

### Building for Deployment

```bash
# Build for staging
pnpm build:staging

# Build for production
pnpm build:production
```

## GitHub Deployment

### Initial Setup

```bash
# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Nthcreation v2.0.0"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/nthcreation.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Environment Variables on GitHub

For GitHub Actions or deployment platforms:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `OPENAI_API_KEY_DEV`
   - `OPENAI_API_KEY_STAGING`
   - `OPENAI_API_KEY_PROD`

### Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

Set environment variables in Vercel dashboard:
- `OPENAI_API_KEY`
- `NODE_ENV=production`

#### Railway / Render / Heroku

1. Connect your GitHub repository
2. Set environment variables in platform dashboard
3. Deploy

## Security Notes

⚠️ **Never commit `.env` files with real API keys!**

- `.env` files are in `.gitignore`
- Only `.env.example` should be committed
- Use platform-specific secret management for production

## Port Configuration

- Development: `http://localhost:3000` (web), `http://localhost:4000` (api)
- Staging: Configure in `.env.staging`
- Production: Configure in `.env.production`
