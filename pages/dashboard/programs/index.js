import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import DashboardShell from "../../../components/DashboardShell";

export default function ProgramsPage({ user, profile }) {
  return (
    <DashboardShell 
      title="My Programs | xFoundry Dashboard"
      profile={profile}
    >
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">My Programs</h1>
        <p className="text-muted-foreground">
          Your active programs will be displayed here. Please check back later.
        </p>
      </div>
    </DashboardShell>
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    // Get user profile from session
    const { user } = await getSession(req, res);
    
    // Here you would fetch the user's profile data from Airtable or other data source
    // This is a placeholder for the actual implementation
    const profile = {
      id: user.sub,
      firstName: user.given_name || user.name?.split(' ')[0] || 'User',
      lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      picture: user.picture
    };

    return {
      props: { 
        profile
      }
    };
  }
});

// Helper function to get the user session
async function getSession(req, res) {
  try {
    return await require('@auth0/nextjs-auth0').getSession(req, res);
  } catch (error) {
    return { user: null };
  }
}