"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import Layout from "../components/Layout";
import LoadingScreen from "../components/LoadingScreen";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, AlertCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";

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
      
      // Set whether the user exists
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
  };

  // Function to proceed to login or signup based on user existence
  const proceedToAuth = () => {
    setIsRedirecting(true);
    const encodedEmail = encodeURIComponent(email);
    
    if (userExists) {
      // If user exists, redirect to login with email prefilled
      window.location.href = `/api/auth/login?login_hint=${encodedEmail}`;
    } else {
      // If user doesn't exist, redirect to signup with email prefilled
      router.push(`/signup?email=${encodedEmail}`);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Layout title="Sign In - xFoundry">
      <div className="flex min-h-[calc(100vh-100px)] w-full items-center justify-center py-10 px-4 md:px-6">
        <div className="flex w-full max-w-4xl flex-col-reverse md:flex-row overflow-hidden rounded-xl shadow-xl">
          {/* Left content - Login Form */}
          <div className="w-full md:w-1/2 bg-white p-8">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Welcome Back</h1>
                <p className="text-muted-foreground">Sign in to your xFoundry account</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your Institutional Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="your.name@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isVerifying || isRedirecting}
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
                    className="w-full"
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
                    className="w-full"
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
                    className="w-full"
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
                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline" asChild>
                    <a href="/signup">Create New Account</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content - Benefits */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-8 text-white">
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-6">Why Join xFoundry?</h2>
              
              <ul className="space-y-6 my-8">
                <li className="flex">
                  <div className="rounded-full bg-white/10 p-1.5 mr-4 h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Access Exclusive Programs</h3>
                    <p className="text-white/80 text-sm">Discover opportunities curated for your profile and institution</p>
                  </div>
                </li>
                
                <li className="flex">
                  <div className="rounded-full bg-white/10 p-1.5 mr-4 h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect With Mentors</h3>
                    <p className="text-white/80 text-sm">Build relationships with industry professionals and peers</p>
                  </div>
                </li>
                
                <li className="flex">
                  <div className="rounded-full bg-white/10 p-1.5 mr-4 h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Track Your Progress</h3>
                    <p className="text-white/80 text-sm">Manage your application status and program participation</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-auto">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm italic">
                    "xFoundry helped me discover internship opportunities I wouldn't have found otherwise. The personalized approach made all the difference in my career journey."
                  </p>
                  <p className="text-sm font-medium mt-2">— Maria C., Computer Science Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}