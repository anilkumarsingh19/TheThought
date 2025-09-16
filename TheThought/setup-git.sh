#!/bin/bash

# TheThought - Git Initialization Script
# This script helps you initialize your git repository and push to GitHub

echo "🚀 TheThought - Git Setup Script"
echo "================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Initial commit: TheThought social media platform with backend API"
    echo "✅ Changes committed"
fi

# Ask for GitHub repository URL
echo ""
echo "🔗 Please provide your GitHub repository URL:"
echo "   Example: https://github.com/yourusername/thethought.git"
read -p "GitHub URL: " github_url

if [ -z "$github_url" ]; then
    echo "❌ GitHub URL is required"
    exit 1
fi

# Add remote origin
echo "🌐 Adding remote origin..."
git remote add origin "$github_url" 2>/dev/null || git remote set-url origin "$github_url"
echo "✅ Remote origin added"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Success! Your code has been pushed to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Set up MongoDB Atlas database"
    echo "2. Deploy backend to Vercel"
    echo "3. Enable GitHub Pages for frontend"
    echo "4. Update environment variables"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Failed to push to GitHub. Please check your credentials and try again."
fi
