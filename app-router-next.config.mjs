/**
 * Next.js configuration for App Router-only mode
 * To be used after the migration is complete
 */

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

// Function to ensure URLs always have a protocol prefix
const ensureProtocol = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
};

// Get base URL that always uses HTTPS to ensure secure cookie compatibility
const getAppBaseUrl = () => {
  // Check if AUTH0_BASE_URL is provided
  if (process.env.AUTH0_BASE_URL) {
    return ensureProtocol(process.env.AUTH0_BASE_URL);
  }
  
  // Always use HTTPS for both environments (secure cookies require this)
  return process.env.NODE_ENV === 'production' 
    ? 'https://hub.xfoundry.org' 
    : 'https://localhost:3000';
};

// Make base URL available to both client and server
process.env.NEXT_PUBLIC_APP_URL = getAppBaseUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // These packages should be processed by webpack normally
    serverComponentsExternalPackages: ['auth0'],
  },
  // Make base URL available to client
  env: {
    NEXT_PUBLIC_APP_URL: getAppBaseUrl(),
  },
  // IMPORTANT: Disable Pages Router entirely
  // This setting prevents Next.js from using files in the pages directory
  pageExtensions: [],
  // Add redirects for legacy routes
  async redirects() {
    return [
      // Redirect from pages directory (if anyone has bookmarked them)
      {
        source: '/pages/:path*',
        destination: '/:path*',
        permanent: true,
      },
      // Redirect old pages to their new locations
      {
        source: '/program-dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashboard-shell',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/program/:path*',
        destination: '/dashboard/program/:path*',
        permanent: true,
      },
    ]
  },
  // Add rewrites for any API routes that need to be maintained for compatibility
  async rewrites() {
    return [
      // Example: Rewrite legacy API routes to the new Route Handlers
      {
        source: '/api/user/profile',
        destination: '/api/user/profile-legacy',
      },
    ]
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig