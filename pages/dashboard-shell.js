// This is a redirect file for backwards compatibility
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

// This page redirects to the dashboard page
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard-new',
      permanent: false,
    },
  }
}

function DashboardShellPage() {
  return <div>Redirecting to dashboard...</div>
}

// Wrap with auth protection
export default withPageAuthRequired(DashboardShellPage)