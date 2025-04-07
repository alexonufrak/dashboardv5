import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Import the server profile page component
import ProfileDialogButton from '../profile/components/ProfileDialogButton'
import ProfileFormStateExample from './components/ProfileFormStateExample'

/**
 * Server Actions Example Page
 * Demonstrates the integration of Server Actions with Client Components
 */
export default function ServerActionsExample() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-row items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Server Actions Example</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="dialog">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="dialog">Dialog Form</TabsTrigger>
              <TabsTrigger value="formstate">useFormState</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dialog">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Update with Server Actions</CardTitle>
                  <CardDescription>
                    This example demonstrates how to use Server Actions to update user profile data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Click the button below to open the profile edit dialog. This dialog uses a Server 
                    Action to update the profile data directly on the server, without the need for a 
                    custom API endpoint.
                  </p>
                  
                  <div className="flex justify-center py-4">
                    <ProfileDialogButton variant="default" size="lg">
                      Open Profile Edit Form
                    </ProfileDialogButton>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-1">Implementation Details</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      The Server Action implementation can be found in:
                      <code className="px-1 py-0.5 mx-1 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">
                        /app/actions/profile/update-profile.js
                      </code>
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      The client component that uses the Server Action can be found in:
                      <code className="px-1 py-0.5 mx-1 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">
                        /app/dashboard/profile/components/ProfileEditForm.js
                      </code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="formstate">
              <ProfileFormStateExample />
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mt-4">
                <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-1">Implementation Details</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  This form uses the useFormState hook to manage form state with Server Actions.
                  The implementation can be found in:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 mt-1">
                  <li>
                    Server Action: 
                    <code className="px-1 py-0.5 mx-1 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">
                      /app/actions/profile/update-profile-with-formstate.js
                    </code>
                  </li>
                  <li>
                    Client Component:
                    <code className="px-1 py-0.5 mx-1 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">
                      /app/dashboard/server-actions-example/components/ProfileFormStateExample.js
                    </code>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Benefits of Server Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Direct server mutations without custom API endpoints</li>
                <li>Progressive enhancement with native form submissions</li>
                <li>Built-in CSRF protection</li>
                <li>Automatic serialization of form data</li>
                <li>Seamless integration with React's suspense and streaming</li>
                <li>Support for optimistic updates with useOptimistic</li>
                <li>Simplified state management with useFormState</li>
                <li>Full type safety with TypeScript</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                For more information on how to implement Server Actions in your components,
                refer to the documentation below:
              </p>
              
              <ul className="space-y-1 list-disc list-inside text-sm">
                <li>
                  <Link 
                    href="/docs/SERVER_ACTIONS_IMPLEMENTATION.md" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Server Actions Implementation Guide
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Next.js Server Actions Documentation
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}