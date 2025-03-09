let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

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
  // Add rewrites for legacy routes
  async rewrites() {
    return [
      // Redirect legacy program routes to new program routes
      {
        source: '/program/:programId',
        destination: '/program-new/:programId',
      },
      {
        source: '/program/:programId/milestones',
        destination: '/program-new/:programId/milestones',
      },
      {
        source: '/program/:programId/team',
        destination: '/program-new/:programId/team',
      },
      {
        source: '/program/:programId/bounties',
        destination: '/program-new/:programId/bounties',
      },
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