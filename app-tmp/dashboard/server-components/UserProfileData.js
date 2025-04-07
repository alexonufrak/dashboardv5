import { cookies } from 'next/headers'
import { auth0 } from '@/lib/auth0'

/**
 * Server Component for fetching user profile data
 * Demonstrates direct data fetching in a Server Component
 */
export default async function UserProfileData() {
  // Get the session from cookie
  const cookieStore = cookies()
  const appSession = cookieStore.get('appSession')?.value
  
  if (!appSession) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <h3 className="font-medium text-yellow-900 mb-1">Authentication Required</h3>
        <p className="text-sm">Please sign in to view your profile data.</p>
      </div>
    )
  }
  
  try {
    // Create a request object with the appSession cookie
    const req = {
      headers: {
        cookie: `appSession=${appSession}`
      }
    }
    
    // Get session and check auth
    const session = await auth0.getSession(req)
    if (!session) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          <h3 className="font-medium text-yellow-900 mb-1">Authentication Required</h3>
          <p className="text-sm">Your session has expired. Please sign in again.</p>
        </div>
      )
    }
    
    // Get user profile data
    const { getCompleteUserProfile } = await import('@/lib/userProfile.refactored')
    const profile = await getCompleteUserProfile(session.user, { minimal: false })
    
    // Render the profile data
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Profile Data (Server Component)</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
              <p className="text-base">{profile.firstName} {profile.lastName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
              <p className="text-base">{profile.email}</p>
            </div>
            {profile.institution && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Institution</h3>
                <p className="text-base">{profile.institution.name}</p>
              </div>
            )}
            {profile.degreeType && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Degree</h3>
                <p className="text-base">{profile.degreeType}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Programs</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {profile.hasActiveParticipation ? (
                <ul className="list-disc pl-5 space-y-1">
                  {profile.cohorts?.map((cohort, idx) => (
                    <li key={idx} className="text-sm">
                      {cohort.initiativeDetails?.name} - {cohort.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">No active programs</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>This data was fetched directly in a Server Component</p>
          <p className="mt-1">Fetched at: {new Date().toLocaleString()}</p>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching profile data in server component:', error)
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        <h3 className="font-medium text-red-900 mb-1">Error Loading Profile</h3>
        <p className="text-sm">{error.message || 'An unexpected error occurred'}</p>
      </div>
    )
  }
}