let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

// Determine the application's base URL based on environment
const getAppBaseUrl = () => {
  // 1. Custom domain for production
  if (process.env.NODE_ENV === 'production') {
    return 'https://hub.xfoundry.org';
  }
  
  // 2. Vercel preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Local development
  return 'http://localhost:3000';
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