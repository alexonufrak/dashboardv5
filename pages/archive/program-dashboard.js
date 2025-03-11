// This is a redirect file for backwards compatibility
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

// This page redirects to the dashboard page
export async function getServerSideProps(context) {
  // Get any query parameters from the current URL
  const { query } = context
  
  // If there's a programId, redirect to the program page
  if (query.programId) {
    return {
      redirect: {
        destination: `/program-new/${query.programId}`,
        permanent: false,
      },
    }
  }
  
  // Otherwise, redirect to the dashboard
  return {
    redirect: {
      destination: '/dashboard-new',
      permanent: false,
    },
  }
}

function ProgramDashboardLegacy() {
  return <div>Redirecting to your program dashboard...</div>
}

// Wrap with auth protection
export default withPageAuthRequired(ProgramDashboardLegacy)