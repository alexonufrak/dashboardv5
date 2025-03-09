// This page has been refactored. It now serves as a redirect to maintain backward compatibility.
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

// This page redirects to the new dashboard
export async function getServerSideProps(context) {
  // Get any query parameters from the current URL
  const { query } = context
  
  // Handle special cases - if there's a programId in the query, redirect to program page
  if (query.programId) {
    return {
      redirect: {
        destination: `/program-new/${query.programId}`,
        permanent: false,
      },
    }
  }
  
  // Standard redirect to dashboard-new with any query parameters
  const queryString = Object.keys(query).length > 0 
    ? `?${new URLSearchParams(query).toString()}`
    : ''
  
  return {
    redirect: {
      destination: `/dashboard-new${queryString}`,
      permanent: false,
    },
  }
}

function Dashboard() {
  return <div>Redirecting to new dashboard...</div>
}

// Wrap with auth protection
export default withPageAuthRequired(Dashboard)