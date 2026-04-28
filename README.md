# Budget App - Netlify Deployment Guide

## How to Deploy to Netlify
1. Create a new repository on [GitHub](https://github.com/new).
2. Upload the files from this `netlify_deployment` folder to your new repository.
3. Go to [Netlify](https://app.netlify.com/).
4. Click "Add new site" -> "Import from existing project".
5. Connect your GitHub repository.
6. Under "Build settings", ensure:
   - Base directory: (leave empty)
   - Build command: `echo 'Deploying static site'`
   - Publish directory: `.`
7. Click "Deploy site".
8. Once deployed, go to **Site settings** -> **Domain management** -> **Custom domains**.
9. Add `nevels1953.com`.
10. Follow the instructions to update your DNS records at your domain registrar.
