import { useRouter } from 'next/router'
import DashboardShell from '@/components/DashboardShell'

export default function ProgramDashboardPage() {
  const router = useRouter()
  
  // The DashboardShell component will handle rendering the appropriate program
  // based on the programId from the router query
  return <DashboardShell />
}