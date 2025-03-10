import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Divider, 
  Spinner,
  Alert
} from "@heroui/react";
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon as AlertCircleIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
} from "@heroicons/react/24/solid";

export default function Login() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState<string | null>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Function to verify the institution and check if user exists
  const verifyEmailAndInstitution = useCallback(async () => {
    // Basic email validation
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsVerifying(true);
    setEmailError("");
    setInstitutionStatus(null);
    setUserExists(null);
    
    try {
      console.log(`Checking if email exists: ${email}`);
      // First check if the user already exists
      const userCheckResponse = await fetch("/api/user/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      console.log(`User check response status: ${userCheckResponse.status}`);
      
      if (!userCheckResponse.ok) {
        console.error("Failed user check response:", userCheckResponse);
        throw new Error("Failed to check user existence");
      }
      
      const userCheckData = await userCheckResponse.json();
      console.log("User check data:", userCheckData);
      
      // Set user existence based on combined check
      setUserExists(userCheckData.exists);
      
      // Check institution regardless of whether user exists
      console.log(`Verifying institution for email: ${email}`);
      const institutionResponse = await fetch("/api/institution-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!institutionResponse.ok) {
        throw new Error("Failed to verify institution");
      }
      
      const data = await institutionResponse.json();
      console.log("Institution lookup response:", data);
      
      if (data.success) {
        console.log(`Institution found: ${data.institution.name}`);
        setInstitution(data.institution);
        setInstitutionStatus("success");
      } else {
        console.log("No matching institution found");
        setInstitutionStatus("error");
      }
    } catch (error) {
      console.error("Error verifying email or institution:", error);
      setInstitutionStatus("error");
    } finally {
      setIsVerifying(false);
    }
  }, [email]);
  
  // Handle email from URL query parameters and auto-verification
  useEffect(() => {
    // Get email from URL query parameters if available
    if (router.query.email) {
      setEmail(router.query.email as string);
      
      // Auto-verify if email is in the URL
      if (typeof router.query.email === 'string' && router.query.email.includes('@')) {
        // We use setTimeout to ensure component is fully mounted
        const timer = setTimeout(() => {
          verifyEmailAndInstitution();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [router.query, verifyEmailAndInstitution]);

  // Function to proceed to login or signup based on user existence
  const proceedToAuth = () => {
    setIsRedirecting(true);
    const encodedEmail = encodeURIComponent(email);
    
    // Store the verified email in localStorage before redirecting
    if (email) {
      localStorage.setItem('xFoundry_verifiedEmail', email);
    }
    
    if (userExists) {
      // If user exists, redirect directly to Google Auth
      window.location.href = `/api/auth/login?connection=google-oauth2&login_hint=${encodedEmail}&prompt=login`;
    } else {
      // If user doesn't exist, redirect to signup with email prefilled
      router.push(`/signup?email=${encodedEmail}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center py-10 px-4">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center py-10 px-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="p-6 md:p-8 shadow-md bg-white">
          <CardBody className="space-y-6">
            <div className="flex justify-center mb-6">
              <h1 className="text-2xl font-bold text-primary">xFoundry</h1>
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-primary">Sign In</h1>
              <p className="text-default-500 text-sm">Enter your institutional email to continue</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Institutional Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isDisabled={isVerifying || isRedirecting}
                  className="h-10"
                />
                {emailError && (
                  <p className="text-sm font-medium text-danger">{emailError}</p>
                )}
              </div>
              
              {/* Only show verify button when not yet verified */}
              {(institutionStatus === null || institutionStatus === "error") && (
                <Button 
                  onPress={verifyEmailAndInstitution}
                  isDisabled={isVerifying || !email || isRedirecting}
                  className="w-full h-10"
                  color="primary"
                >
                  {isVerifying ? (
                    <div className="flex items-center">
                      <span className="mr-2">Verifying</span>
                      <div className="flex space-x-1">
                        <span className="inline-block animate-pulse">•</span>
                        <span className="inline-block animate-pulse delay-75">•</span>
                        <span className="inline-block animate-pulse delay-150">•</span>
                      </div>
                    </div>
                  ) : "Continue"}
                </Button>
              )}
              
              {/* Verification Results */}
              <div className="space-y-3">
                {/* User exists message */}
                {userExists === true && institutionStatus === "success" && (
                  <Alert 
                    color="success"
                    title={`Welcome back - ${institution?.name}`}
                  >
                    Your account was found. You can sign in now.
                  </Alert>
                )}
                
                {/* User doesn't exist message */}
                {userExists === false && institutionStatus === "success" && (
                  <Alert 
                    color="primary"
                    title={`Institution verified: ${institution?.name}`}
                  >
                    No account found with this email. We'll help you create one.
                  </Alert>
                )}
                
                {/* Institution verification error */}
                {institutionStatus === "error" && (
                  <Alert 
                    color="danger"
                    title="Verification Failed"
                  >
                    We couldn't verify your institution. Please use your school email.
                  </Alert>
                )}
              </div>
              
              {/* Sign In button - only shown when user exists */}
              {institutionStatus === "success" && userExists === true && (
                <Button
                  onPress={proceedToAuth}
                  isDisabled={isRedirecting}
                  className="w-full"
                  color="primary"
                  size="lg"
                >
                  {isRedirecting ? (
                    <div className="flex items-center">
                      <span className="mr-2">Signing in</span>
                      <div className="flex space-x-1">
                        <span className="inline-block animate-pulse">•</span>
                        <span className="inline-block animate-pulse delay-75">•</span>
                        <span className="inline-block animate-pulse delay-150">•</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              
              {/* Create Account button - only shown when user doesn't exist */}
              {institutionStatus === "success" && userExists === false && (
                <Button
                  onPress={proceedToAuth}
                  isDisabled={isRedirecting}
                  className="w-full"
                  color="warning"
                  size="lg"
                >
                  {isRedirecting ? (
                    <div className="flex items-center">
                      <span className="mr-2">Redirecting</span>
                      <div className="flex space-x-1">
                        <span className="inline-block animate-pulse">•</span>
                        <span className="inline-block animate-pulse delay-75">•</span>
                        <span className="inline-block animate-pulse delay-150">•</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      Create New Account
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Divider className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-default-500">Or</span>
                </div>
              </div>
              
              <div className="text-center">
                <Button variant="bordered" className="w-full border-primary text-primary" as="a" href="/signup">
                  Create New Account
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}