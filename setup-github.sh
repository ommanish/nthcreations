#!/bin/bash

# Nthcreation - GitHub Setup Script
# This script helps you publish your project to GitHub

echo "🚀 Nthcreation GitHub Setup"
echo "=============================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if already has remote
if git remote | grep -q origin; then
    echo "✅ Git remote 'origin' already exists:"
    git remote -v
    echo ""
    read -p "Do you want to update the remote URL? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your GitHub repository URL: " REPO_URL
        git remote set-url origin "$REPO_URL"
        echo "✅ Remote URL updated!"
    fi
else
    echo "📝 Let's set up your GitHub repository"
    echo ""
    read -p "Enter your GitHub repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ Repository URL cannot be empty"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo "✅ Remote 'origin' added!"
fi

echo ""
echo "📋 Current status:"
git status --short

echo ""
read -p "Push to GitHub? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "📚 Next steps:"
        echo "1. Go to your GitHub repository"
        echo "2. Navigate to Settings → Secrets and variables → Actions"
        echo "3. Add these secrets:"
        echo "   - OPENAI_API_KEY_PROD (for production)"
        echo "   - OPENAI_API_KEY_STAGING (for staging)"
        echo ""
        echo "4. GitHub Actions will automatically run on push to main/staging branches"
    else
        echo "❌ Failed to push to GitHub"
        echo "Please check your repository URL and permissions"
    fi
else
    echo "⏭️  Skipped push. You can push later with: git push -u origin main"
fi

echo ""
echo "✅ Setup complete!"
