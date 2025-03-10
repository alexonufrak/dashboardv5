import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button, Card, CardBody, Spinner } from "@heroui/react";

export default function IndexPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  
  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Simple landing page for unauthenticated users
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardBody className="flex flex-col items-center gap-8 p-8 text-center">
            <h1 className="text-4xl font-bold text-primary">xFoundry</h1>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to xFoundry</h2>
              <p className="text-default-500">Connect, collaborate, and create across disciplines</p>
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <Button 
                color="primary" 
                size="lg" 
                className="w-full"
                as="a"
                href="/login"
              >
                Sign In
              </Button>
              
              <Button 
                variant="bordered" 
                color="primary" 
                size="lg" 
                className="w-full"
                as="a"
                href="/signup"
              >
                Create Account
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // This should not be visible, as authenticated users will be redirected to dashboard
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" color="primary" />
        <p className="text-default-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}