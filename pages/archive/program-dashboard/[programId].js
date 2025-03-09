// This is a simple redirect page - it will redirect to the main dashboard
// which will then detect the program ID from the URL and show the correct program

// Export a getServerSideProps function to handle the redirect
export async function getServerSideProps(context) {
  // Get the program ID from the URL
  const { programId } = context.params;
  
  // Return a redirect to the dashboard page
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
}

// This component won't actually render, but we need to export something
export default function ProgramDashboardPage() {
  return <div>Redirecting...</div>;
}