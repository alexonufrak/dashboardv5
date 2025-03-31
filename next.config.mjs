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
  // Add rewrites for legacy routes
  async rewrites() {
    return [
      // Redirect program-dashboard to dashboard-new
      {
        source: '/program-dashboard',
        destination: '/dashboard-new',
      },
      // Redirect dashboard-shell to dashboard-new
      {
        source: '/dashboard-shell',
        destination: '/dashboard-new',
      },
      // Redirect program to dashboard/programs
      {
        source: '/program/:path*',
        destination: '/dashboard/programs/:path*',
      },
      // Redirect old dashboard/program to dashboard/programs
      {
        source: '/dashboard/program/:path*',
        destination: '/dashboard/programs/:path*',
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
