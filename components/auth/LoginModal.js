"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const LoginModal = ({ isOpen, onClose, initialEmail = "" }) => {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userExists, setUserExists] = useState(null);
  
  // Update email if initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);
  
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
      // If user exists, redirect to login with email prefilled - use Auth0 v4 path
      window.location.href = `/auth/login?login_hint=${encodedEmail}`;
    } else {
      // If user doesn't exist, redirect to signup with email prefilled
      router.push(`/signup?email=${encodedEmail}`);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="transition-all duration-200">
      <DialogContent className="sm:max-w-[500px] dialog-content">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary">Enter Your School Email</DialogTitle>
        </DialogHeader>
        
        <div className="py-5">
          <p className="text-sm text-muted-foreground mb-6">
            Please use your school email address. We&apos;ll verify your institution 
            and either sign you in or help you create a new account.
          </p>
          
          <div className="grid gap-4 mb-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right col-span-1">
                Email
                <span className="ml-1 text-muted-foreground cursor-help" title="Use your school email (e.g., name@school.edu)">ⓘ</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@school.edu"
                disabled={isVerifying || isRedirecting}
                className="col-span-3"
              />
            </div>
            {emailError && (
              <div className="text-sm text-destructive ml-auto col-span-3 col-start-2">
                {emailError}
              </div>
            )}
          </div>
          
          {/* Only show verify button when not yet verified or there was an error */}
          {(institutionStatus === null || institutionStatus === "error") && (
            <Button 
              onClick={verifyEmailAndInstitution}
              disabled={isVerifying || !email || isRedirecting}
              className="w-full py-6 text-base font-medium transition-all duration-200 bg-primary hover:bg-primary/90"
            >
              {isVerifying ? 
                <div className="flex items-center justify-center">
                  <span className="mr-2">Verifying</span>
                  <span className="inline-block animate-pulse">•</span>
                  <span className="inline-block animate-pulse delay-75">•</span>
                  <span className="inline-block animate-pulse delay-150">•</span>
                </div> 
                : "Continue"
              }
            </Button>
          )}
          
          {/* Verification Results */}
          <div className="space-y-3 mt-4">
            {/* User exists message */}
            {userExists === true && institutionStatus === "success" && (
              <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription className="flex items-center">
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Welcome back! Your account was found. Continue to sign in.
                </AlertDescription>
              </Alert>
            )}
            
            {/* User doesn't exist message */}
            {userExists === false && institutionStatus === "success" && (
              <Alert variant="info" className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertDescription className="flex items-center">
                  <InfoIcon className="mr-2 h-4 w-4" />
                  No account found with this email. Continue to create a new account.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Institution verification success */}
            {institutionStatus === "success" && (
              <div className="flex items-center">
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 px-3 py-1">
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Verified: {institution.name}
                </Badge>
              </div>
            )}
            
            {/* Institution verification error */}
            {institutionStatus === "error" && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center">
                  <CrossIcon className="mr-2 h-4 w-4" />
                  Institution not recognized. Please use your institutional email.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Sign In button - only shown when user exists */}
          {institutionStatus === "success" && userExists === true && (
            <Button
              onClick={proceedToAuth}
              disabled={isRedirecting}
              className="w-full mt-4 py-6 text-base font-medium transition-all duration-200 bg-green-600 hover:bg-green-700"
            >
              {isRedirecting ? 
                <div className="flex items-center justify-center">
                  <span className="mr-2">Redirecting</span>
                  <span className="inline-block animate-pulse">•</span>
                  <span className="inline-block animate-pulse delay-75">•</span>
                  <span className="inline-block animate-pulse delay-150">•</span>
                </div> 
                : "Sign In to Your Account"
              }
            </Button>
          )}
          
          {/* Create Account button - only shown when user doesn't exist */}
          {institutionStatus === "success" && userExists === false && (
            <Button
              onClick={proceedToAuth}
              disabled={isRedirecting}
              className="w-full mt-4 py-6 text-base font-medium transition-all duration-200 bg-green-600 hover:bg-green-700"
            >
              {isRedirecting ? 
                <div className="flex items-center justify-center">
                  <span className="mr-2">Redirecting</span>
                  <span className="inline-block animate-pulse">•</span>
                  <span className="inline-block animate-pulse delay-75">•</span>
                  <span className="inline-block animate-pulse delay-150">•</span>
                </div> 
                : "Create New Account"
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Icon components
const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CrossIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default LoginModal;