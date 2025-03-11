"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import Head from "next/head";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/common/Logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, AlertCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Login() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userExists, setUserExists] = useState(null);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }

    // Get email from URL query parameters if available
    if (router.query.email) {
      setEmail(router.query.email);
      
      // Auto-verify if email is in the URL
      if (router.query.email.includes('@')) {
        setTimeout(() => verifyEmailAndInstitution(), 500);
      }
    }
  }, [user, router, router.query]);

  // Function to verify the institution and check if user exists
  const verifyEmailAndInstitution = async () => {
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
      // We consider a user to exist if they're in either system to prevent duplicate accounts
      setUserExists(userCheckData.exists);
      
      // Check for potential Auth0 visibility issue
      if (userCheckData.potentialVisibilityIssue) {
        console.log("NOTE: User exists in Airtable but not visible to Auth0 Management API");
        console.log("This could be due to application authorization configuration in Auth0");
        
        // If we have signup metadata from Airtable, store it for the signup process
        if (userCheckData.signupMetadata) {
          console.log("Storing Airtable metadata for signup:", userCheckData.signupMetadata);
          // Store in localStorage to use during signup
          localStorage.setItem('xFoundry_signupMetadata', JSON.stringify(userCheckData.signupMetadata));
        }
      }
      
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
  };

  // Function to proceed to login or signup based on user existence
  const proceedToAuth = () => {
    setIsRedirecting(true);
    const encodedEmail = encodeURIComponent(email);
    
    // Store the verified email in localStorage before redirecting
    // This will be used as a backup to ensure email consistency
    if (email) {
      localStorage.setItem('xFoundry_verifiedEmail', email);
    }
    
    if (userExists) {
      // If user exists, redirect directly to Google Auth
      // Bypass Auth0 login screen by specifying connection=google-oauth2
      window.location.href = `/api/auth/login?connection=google-oauth2&login_hint=${encodedEmail}&prompt=login`;
    } else {
      // If user doesn't exist, redirect to signup with email prefilled
      router.push(`/signup?email=${encodedEmail}`);
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading - xFoundry</title>
        </Head>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex min-h-screen w-full items-center justify-center py-10 px-4 bg-background">
          <div className="w-full max-w-md">
            <Skeleton className="h-12 w-48 mx-auto mb-8" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In - xFoundry</title>
      </Head>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen w-full items-center justify-center py-10 px-4 bg-background">
        <div className="w-full max-w-md">
          <Card className="p-6 md:p-8 shadow-md">
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <Logo variant="horizontal" color="auto" height={40} />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Sign In</h1>
                <p className="text-muted-foreground text-sm">Enter your institutional email to continue</p>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Institutional Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="your.name@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isVerifying || isRedirecting}
                    className="h-10"
                  />
                  {emailError && (
                    <p className="text-sm font-medium text-destructive">{emailError}</p>
                  )}
                </div>
                
                {/* Only show verify button when not yet verified */}
                {(institutionStatus === null || institutionStatus === "error") && (
                  <Button 
                    onClick={verifyEmailAndInstitution}
                    disabled={isVerifying || !email || isRedirecting}
                    className="w-full h-10 bg-curious hover:bg-curious/90"
                  >
                    {isVerifying ? (
                      <div className="flex items-center">
                        <span className="mr-2">Verifying</span>
                        <span className="inline-block animate-pulse">•</span>
                        <span className="inline-block animate-pulse delay-75">•</span>
                        <span className="inline-block animate-pulse delay-150">•</span>
                      </div>
                    ) : "Continue"}
                  </Button>
                )}
                
                {/* Verification Results */}
                <div className="space-y-3">
                  {/* User exists message */}
                  {userExists === true && institutionStatus === "success" && (
                    <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        Welcome back! Your account was found.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* User doesn't exist message */}
                  {userExists === false && institutionStatus === "success" && (
                    <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        No account found with this email. We'll help you create one.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Institution verification error */}
                  {institutionStatus === "error" && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        We couldn't verify your institution. Please use your school email.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Institution verification success */}
                  {institutionStatus === "success" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 px-3 py-1.5">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      {institution.name}
                    </Badge>
                  )}
                </div>
                
                {/* Sign In button - only shown when user exists */}
                {institutionStatus === "success" && userExists === true && (
                  <Button
                    onClick={proceedToAuth}
                    disabled={isRedirecting}
                    className="w-full bg-eden hover:bg-eden/90"
                    size="lg"
                  >
                    {isRedirecting ? (
                      <div className="flex items-center">
                        <span className="mr-2">Signing in</span>
                        <span className="inline-block animate-pulse">•</span>
                        <span className="inline-block animate-pulse delay-75">•</span>
                        <span className="inline-block animate-pulse delay-150">•</span>
                      </div>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
                
                {/* Create Account button - only shown when user doesn't exist */}
                {institutionStatus === "success" && userExists === false && (
                  <Button
                    onClick={proceedToAuth}
                    disabled={isRedirecting}
                    className="w-full bg-gold text-eden hover:bg-gold/90"
                    size="lg"
                  >
                    {isRedirecting ? (
                      <div className="flex items-center">
                        <span className="mr-2">Redirecting</span>
                        <span className="inline-block animate-pulse">•</span>
                        <span className="inline-block animate-pulse delay-75">•</span>
                        <span className="inline-block animate-pulse delay-150">•</span>
                      </div>
                    ) : (
                      <>
                        Create New Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button variant="outline" asChild className="w-full border-curious text-curious hover:bg-curious/5">
                    <a href="/signup">Create New Account</a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}