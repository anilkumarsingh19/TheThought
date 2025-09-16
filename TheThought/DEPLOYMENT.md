# Deployment Guide for TheThought

This guide will help you deploy your TheThought social media platform online using GitHub and various cloud services.

## Prerequisites

- GitHub account
- Node.js installed locally
- MongoDB Atlas account (for cloud database)
- Vercel account (for backend deployment)
- Git installed

## Step 1: Set up GitHub Repository

1. **Create a new repository on GitHub:**
   - Go to GitHub.com and click "New repository"
   - Name it "thethought" (or your preferred name)
   - Make it public for GitHub Pages
   - Don't initialize with README (we already have one)

2. **Initialize git and push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TheThought social media platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/thethought.git
   git push -u origin main
   ```

## Step 2: Set up MongoDB Atlas (Database)

1. **Create MongoDB Atlas account:**
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account
   - Create a new cluster (choose the free tier)

2. **Configure database access:**
   - Create a database user with read/write permissions
   - Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
   - Get your connection string

3. **Update environment variables:**
   - Copy `env.example` to `.env`
   - Update `MONGODB_URI` with your Atlas connection string
   - Change `JWT_SECRET` to a secure random string

## Step 3: Deploy Backend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Set up environment variables in Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add all variables from your `.env` file

4. **Get your backend URL:**
   - Note down your Vercel deployment URL (e.g., `https://thethought-backend.vercel.app`)

## Step 4: Enable GitHub Pages

1. **Go to your GitHub repository settings:**
   - Click on "Settings" tab
   - Scroll down to "Pages" section

2. **Configure GitHub Pages:**
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Folder: `/ (root)`

3. **GitHub Actions will automatically deploy:**
   - The workflow will create a `gh-pages` branch
   - Your frontend will be available at `https://YOUR_USERNAME.github.io/thethought`

## Step 5: Update Frontend to Use Backend API

1. **Update the frontend JavaScript to use your backend:**
   ```javascript
   // In script.js, update the API base URL
   const API_BASE_URL = 'https://your-backend-url.vercel.app/api';
   ```

2. **Add authentication functions:**
   ```javascript
   // Add these functions to handle authentication
   async function login(email, password) {
     const response = await fetch(`${API_BASE_URL}/auth/login`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     return response.json();
   }
   
   async function register(userData) {
     const response = await fetch(`${API_BASE_URL}/auth/register`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(userData)
     });
     return response.json();
   }
   ```

## Step 6: Test Your Deployment

1. **Test the backend:**
   - Visit `https://your-backend-url.vercel.app/api/health`
   - Should return `{"status":"OK","timestamp":"..."}`

2. **Test the frontend:**
   - Visit `https://YOUR_USERNAME.github.io/thethought`
   - Try registering a new user
   - Test posting thoughts and uploading reels

## Step 7: Custom Domain (Optional)

1. **For GitHub Pages:**
   - Add a `CNAME` file to your repository with your domain
   - Configure DNS settings with your domain provider

2. **For Vercel:**
   - Add your domain in Vercel dashboard
   - Configure DNS settings

## Environment Variables Reference

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thethought
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://YOUR_USERNAME.github.io/thethought
```

## Troubleshooting

### Common Issues:

1. **CORS errors:**
   - Make sure `FRONTEND_URL` in backend matches your frontend URL exactly

2. **Database connection issues:**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format

3. **File upload issues:**
   - Ensure Vercel has proper file size limits
   - Check multer configuration

4. **Authentication issues:**
   - Verify JWT_SECRET is set correctly
   - Check token expiration settings

### Getting Help:

- Check Vercel logs in dashboard
- Check GitHub Actions logs
- Use browser developer tools for frontend debugging
- Check MongoDB Atlas logs

## Security Considerations

1. **Change default JWT secret**
2. **Use HTTPS only**
3. **Implement rate limiting**
4. **Validate all inputs**
5. **Use environment variables for secrets**

## Monitoring and Maintenance

1. **Set up monitoring:**
   - Use Vercel Analytics
   - Monitor MongoDB Atlas metrics

2. **Regular updates:**
   - Keep dependencies updated
   - Monitor security advisories

3. **Backup strategy:**
   - MongoDB Atlas provides automatic backups
   - Consider additional backup solutions

Your TheThought platform should now be live and accessible worldwide! 🚀
