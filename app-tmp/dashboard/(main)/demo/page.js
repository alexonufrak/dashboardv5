import { Suspense } from 'react'
import UserProfileData from '../../server-components/UserProfileData'

export const metadata = {
  title: 'App Router Demo | xFoundry',
  description: 'Demonstration of App Router features like Server Components',
}

// Loading state component shown while the server component is fetching data
function LoadingProfile() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-md" />
      <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Demo page for App Router features
 */
export default function AppRouterDemo() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">App Router Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates key features of the Next.js App Router
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Server Components</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Server Components allow data fetching directly on the server, reducing 
            client-side JavaScript and improving performance.
          </p>
          
          {/* Server Component wrapped in Suspense */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Server-fetched Profile:</h3>
            <Suspense fallback={<LoadingProfile />}>
              <UserProfileData />
            </Suspense>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">New App Router Features</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-green-500 rounded-full h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Metadata API</strong>
                <p className="text-muted-foreground">Improved SEO with static and dynamic metadata</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-500 rounded-full h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Route Groups</strong>
                <p className="text-muted-foreground">Organize routes without affecting URL paths</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-500 rounded-full h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Route Handlers</strong>
                <p className="text-muted-foreground">API endpoints using modern Web Request/Response APIs</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-500 rounded-full h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Parallel Routes</strong>
                <p className="text-muted-foreground">Multiple pages in the same view with independent navigation</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-500 rounded-full h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Intercepting Routes</strong>
                <p className="text-muted-foreground">Show content in a modal while keeping current page</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 mt-6">
        <h2 className="text-blue-800 dark:text-blue-300 font-medium text-lg mb-2">Next Steps in the Migration</h2>
        <ul className="list-disc pl-5 space-y-2 text-blue-700 dark:text-blue-400">
          <li>
            <strong>API Routes:</strong> Convert all API routes to Route Handlers
          </li>
          <li>
            <strong>Server Components:</strong> Move data fetching to Server Components
          </li>
          <li>
            <strong>Data Caching:</strong> Utilize server-side caching with fetch()
          </li>
          <li>
            <strong>Authentication:</strong> Update auth flow for App Router
          </li>
          <li>
            <strong>Testing:</strong> Verify all functionality works correctly
          </li>
        </ul>
      </div>
    </div>
  )
}