import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// Dynamically import DashboardShell to prevent SSR
// This ensures the DashboardProvider is available before the component renders
const DashboardShell = dynamic(() => import('@/components/DashboardShell'), {
  ssr: false
})

export default function ProgramDashboardPage() {
  const router = useRouter()
  
  // The App component will wrap this with DashboardProvider
  return <DashboardShell />
}

// Set a static property to flag that this component needs DashboardContext
ProgramDashboardPage.needsDashboardContext = true;

// Disable static generation for this page to avoid rendering issues
export async function getServerSideProps() {
  return {
    props: {
      needsDashboardContext: true // Alternative way to flag needed context
    },
  }
}