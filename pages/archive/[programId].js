// This is a redirect file for backwards compatibility
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

// This page redirects directly to the new program page
export async function getServerSideProps(context) {
  // Get the program ID from the URL parameters
  const { programId } = context.params
  
  // Redirect to the new program page with the same programId
  return {
    redirect: {
      destination: `/program-new/${programId}`,
      permanent: false,
    },
  }
}

function ProgramDashboardPage() {
  return <div>Redirecting to program dashboard...</div>
}

// Wrap with auth protection
export default withPageAuthRequired(ProgramDashboardPage)