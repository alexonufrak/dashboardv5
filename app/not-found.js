import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Not Found Page - Server Component
 * Displays when a page is not found
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center space-y-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}