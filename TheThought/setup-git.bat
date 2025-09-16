@echo off
echo 🚀 TheThought - Git Setup Script
echo ================================

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
if not exist ".git" (
    echo 📁 Initializing git repository...
    git init
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

REM Add all files
echo 📝 Adding files to git...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% equ 0 (
    echo ℹ️  No changes to commit
) else (
    echo 💾 Committing changes...
    git commit -m "Initial commit: TheThought social media platform with backend API"
    echo ✅ Changes committed
)

REM Ask for GitHub repository URL
echo.
echo 🔗 Please provide your GitHub repository URL:
echo    Example: https://github.com/yourusername/thethought.git
set /p github_url="GitHub URL: "

if "%github_url%"=="" (
    echo ❌ GitHub URL is required
    pause
    exit /b 1
)

REM Add remote origin
echo 🌐 Adding remote origin...
git remote add origin "%github_url%" 2>nul || git remote set-url origin "%github_url%"
echo ✅ Remote origin added

REM Push to GitHub
echo ⬆️  Pushing to GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo 🎉 Success! Your code has been pushed to GitHub!
    echo.
    echo Next steps:
    echo 1. Set up MongoDB Atlas database
    echo 2. Deploy backend to Vercel
    echo 3. Enable GitHub Pages for frontend
    echo 4. Update environment variables
    echo.
    echo 📖 See DEPLOYMENT.md for detailed instructions
) else (
    echo ❌ Failed to push to GitHub. Please check your credentials and try again.
)

pause
