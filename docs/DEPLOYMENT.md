# Deployment Guide

This document provides step-by-step instructions for deploying the xFoundry Dashboard application.

## Prerequisites

Before deploying, you will need:

1. An Auth0 account with an application set up
2. An Airtable account with the necessary base and tables created
3. A Vercel account for deployment and Blob storage
4. Your codebase ready for production

## Deploying to Vercel

### Step 1: Prepare Your Repository

Make sure your code is in a git repository and is ready for production:

```bash
# Install dependencies
npm install

# Run tests and lint checks
npm run lint

# Build the application to verify it compiles correctly
npm run build
```

### Step 2: Set Up Vercel Blob

1. Log in to your Vercel account
2. Go to the Dashboard and navigate to Storage
3. Click "Create" and select "Blob"
4. Give your store a name (e.g., "xfoundry-files")
5. Click "Create Store"
6. Copy the blob read-write token for use in environment variables

### Step 3: Connect to Vercel

Using the Vercel CLI:

```bash
# Install Vercel CLI if you don't have it
npm install -g vercel

# Log in to Vercel
vercel login

# Link your project
vercel link
```

Or use the Vercel dashboard to import your GitHub repository directly.

### Step 4: Configure Environment Variables

Add the following environment variables to your Vercel project:

```
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TEAMS_TABLE_ID=your_airtable_teams_table_id
AIRTABLE_MEMBERS_TABLE_ID=your_airtable_members_table_id
AIRTABLE_CONTACTS_TABLE_ID=your_airtable_contacts_table_id
AIRTABLE_SUBMISSIONS_TABLE_ID=your_airtable_submissions_table_id
AIRTABLE_MILESTONES_TABLE_ID=your_airtable_milestones_table_id
AIRTABLE_COHORTS_TABLE_ID=your_airtable_cohorts_table_id

# Vercel Blob Configuration
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=your_vercel_app_url
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
```

You can set these via the Vercel dashboard or using the CLI:

```bash
vercel env add AIRTABLE_API_KEY
# Follow prompts to add the value
```

### Step 5: Configure Auth0 Callback URLs

Update your Auth0 application settings with the correct callback URLs:

1. Log in to your Auth0 dashboard
2. Navigate to Applications > Your Application
3. Update the following URLs:
   - Allowed Callback URLs: `https://your-vercel-app.vercel.app/api/auth/callback`
   - Allowed Logout URLs: `https://your-vercel-app.vercel.app`
   - Allowed Web Origins: `https://your-vercel-app.vercel.app`

### Step 6: Deploy Your Application

Using Vercel CLI:

```bash
vercel --prod
```

Or deploy through the Vercel dashboard by clicking "Deploy" in your project.

### Step 7: Verify Deployment

Once deployed, verify the following:

1. The application loads correctly
2. Authentication works (login/logout)
3. File uploads work through Vercel Blob
4. Data is correctly fetched from and saved to Airtable

## Post-Deployment Steps

### Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to Settings > Domains
2. Add your custom domain and follow the instructions for DNS configuration

### Set Up Monitoring

1. Enable Vercel Analytics in your project settings
2. Consider setting up an error monitoring service like Sentry

### Enable Automatic Deployments

If your project is hosted on GitHub, GitLab, or Bitbucket:

1. Connect your Git repository to Vercel
2. Configure auto-deployments for specific branches

## Troubleshooting

### Authentication Issues

- Verify that Auth0 environment variables are correctly set
- Check that callback URLs in Auth0 match your deployed application URL
- Look for CORS errors in browser console

### File Upload Issues

- Ensure BLOB_READ_WRITE_TOKEN is correctly set
- Verify the Vercel Blob store is properly configured
- Check file sizes and types against allowed configurations

### Airtable Connection Issues

- Verify all Airtable environment variables are set correctly
- Ensure the Airtable API key has access to the base
- Check for rate limiting issues in the Vercel logs

## Maintenance

### Updating Environment Variables

When updating environment variables in Vercel:

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Update the variable and redeploy if necessary

### Redeploying After Changes

When making changes to your code:

1. Commit and push to your repository
2. Vercel will automatically deploy if auto-deployments are enabled
3. Alternatively, run `vercel --prod` from your local machine

### Scaling Considerations

As your application grows:

1. Consider upgrading your Vercel plan for additional resources
2. Optimize database queries to Airtable to avoid rate limits
3. Implement caching strategies for frequently accessed data