#!/bin/bash
# Helper script to push code to GitHub
# Usage: ./push-to-github.sh YOUR_GITHUB_REPO_URL

if [ -z "$1" ]; then
    echo "Usage: ./push-to-github.sh https://github.com/YOUR_USERNAME/REPO_NAME.git"
    echo ""
    echo "First, create a GitHub repository at: https://github.com/new"
    echo "Then run this script with your repository URL"
    exit 1
fi

REPO_URL=$1

echo "Adding remote origin: $REPO_URL"
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Next step: Deploy on Render.com (see DEPLOY.md)"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "  1. You created the GitHub repository"
    echo "  2. The repository URL is correct"
    echo "  3. You have push access to the repository"
fi

