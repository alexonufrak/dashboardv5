// This page has been refactored. It now serves as a redirect to maintain backward compatibility.
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

// This page redirects to the new program page structure
export async function getServerSideProps(context) {
  const { programId } = context.params
  
  return {
    redirect: {
      destination: `/program-new/${programId}`,
      permanent: false,
    },
  }
}

function ProgramPage() {
  return <div>Redirecting to new program dashboard...</div>
}

// Wrap with auth protection
export default withPageAuthRequired(ProgramPage)