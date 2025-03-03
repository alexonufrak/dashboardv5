import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { DashboardLayout } from "../../../components/v2/dashboard-layout";
import { ActiveProgramsDashboard } from "../../../components/v2/ActiveProgramsDashboard";

export default function ProgramsPage({ user, profile }) {
  return (
    <DashboardLayout 
      title="My Programs | xFoundry Dashboard"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Programs", href: "/dashboard/programs" }
      ]}
      profile={profile}
    >
      <ActiveProgramsDashboard userProfile={profile} />
    </DashboardLayout>
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