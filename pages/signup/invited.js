"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import Layout from "@/components/layout/Layout"
import AuthLayout from "@/components/layout/AuthLayout"
import { useUser } from "@auth0/nextjs-auth0"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import Logo from "@/components/common/Logo"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, CheckCircle, XCircle, AlertCircle, Mail, User, Users } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function InvitedSignup() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Form data will be pre-filled from invitation
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    graduationYear: "",
    degreeType: "",
    referralSource: "Team Invite"
  });

  // Handle token from query parameters
  useEffect(() => {
    if (router.query.token) {
      verifyInvitation(router.query.token);
    }
  }, [router.query.token, verifyInvitation]);

  // Check if user is already logged in
  useEffect(() => {
    if (user && invitation) {
      // If user is logged in and we have invitation details
      handleExistingUserInvite();
    } else if (user) {
      // User is logged in but no invitation - redirect to dashboard
      router.push("/dashboard");
    }
  }, [user, invitation, handleExistingUserInvite, router]);

  // Function to verify the invitation token
  const verifyInvitation = useCallback(async (token) => {
    setIsVerifying(true);
    setInvitationStatus(null);
    
    try {
      const response = await fetch(`/api/invite/${token}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify invitation");
      }
      
      const data = await response.json();
      console.log("Invitation data:", data);
      
      setInvitation(data);
      
      // Check if invitation is valid
      if (data.isValid) {
        setInvitationStatus("valid");
        // Pre-fill form data from invitation
        setFormData({
          ...formData,
          email: data.email,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        });
      } else if (data.status === "Expired") {
        setInvitationStatus("expired");
      } else if (data.status === "Accepted") {
        setInvitationStatus("accepted");
      } else {
        setInvitationStatus("invalid");
      }
    } catch (error) {
      console.error("Error verifying invitation:", error);
      setInvitationStatus("error");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Handle existing user accepting the invitation
  const handleExistingUserInvite = useCallback(async () => {
    if (!invitation || !invitation.token || hasAccepted) {
      return;
    }
    
    setIsAccepting(true);
    
    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: invitation.token }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invitation");
      }
      
      const data = await response.json();
      console.log("Accepted invitation:", data);
      
      setHasAccepted(true);
      toast.success("You've successfully joined the team!", {
        description: `Welcome to ${data.team?.name || "the team"}!`,
      });
      
      // Redirect to team page after a brief delay
      setIsRedirecting(true);
      setTimeout(() => {
        router.push(`/dashboard`);
      }, 2000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation", {
        description: error.message,
      });
    } finally {
      setIsAccepting(false);
    }
  }, [invitation, hasAccepted, router]);

  // Function to handle input changes for personal info form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Function to continue to the next step
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Function to go back to the previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to handle the Google sign up/in
  const handleGoogleSignup = () => {
    // Create query params with user data for Auth0
    const queryParams = new URLSearchParams({
      institution: invitation?.team?.institutionName || "",
      institutionId: invitation?.team?.institutionId || "",
      degreeType: formData.degreeType,
      graduationYear: formData.graduationYear,
      firstName: formData.firstName,
      lastName: formData.lastName,
      referralSource: formData.referralSource,
      email: formData.email,
      invitationToken: invitation?.token || "", // Pass the invitation token
    });
    
    // Store the invitation token in localStorage before redirecting
    if (invitation?.token) {
      localStorage.setItem('xFoundry_invitationToken', invitation.token);
    }
    
    // Store the verified email in localStorage before redirecting
    if (formData.email) {
      localStorage.setItem('xFoundry_verifiedEmail', formData.email);
    }
    
    // Encode the email to use as login_hint for Google authentication
    const encodedEmail = encodeURIComponent(formData.email);
    
    // Redirect directly to Google authentication, bypassing Auth0 login screen
    window.location.href = `/auth/login?connection=google-oauth2&${queryParams.toString()}&prompt=login&login_hint=${encodedEmail}`;
  };

  if (isLoading || isVerifying) {
    return (
      <AuthLayout title="Loading - xFoundry" showLogo={false}>
        <div className="flex min-h-[calc(100vh-100px)] w-full items-center justify-center py-10 px-4">
          <div className="w-full max-w-md">
            <Skeleton className="h-12 w-48 mx-auto mb-8" />
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!router.query.token) {
    return (
      <AuthLayout title="Invalid Invitation - xFoundry" showLogo={true}>
        <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Missing Invitation
              </h1>
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  No invitation token provided. Please use the link from your invitation email.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => router.push("/")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Return to Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (invitationStatus === "error" || invitationStatus === "invalid") {
    return (
      <AuthLayout title="Invalid Invitation - xFoundry">
        <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Invalid Invitation
              </h1>
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This invitation is invalid or has been revoked.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => router.push("/")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Return to Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (invitationStatus === "expired") {
    return (
      <AuthLayout title="Expired Invitation - xFoundry">
        <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Invitation Expired
              </h1>
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Please ask the team administrator to send you a new invitation.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => router.push("/")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Return to Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (invitationStatus === "accepted") {
    return (
      <AuthLayout title="Invitation Already Accepted - xFoundry">
        <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Invitation Already Accepted
              </h1>
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This invitation has already been accepted. You can sign in to access the team.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => router.push("/login")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Sign In
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (user && hasAccepted) {
    return (
      <AuthLayout title="Invitation Accepted - xFoundry">
        <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Invitation Accepted!
              </h1>
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-center mb-2">
                Welcome to the Team!
              </h2>
              
              <p className="text-gray-600 text-center mb-4">
                You have successfully joined {invitation?.team?.name || "the team"}.
              </p>
              
              <Alert className="bg-green-50 text-green-800 border-green-200 mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Redirecting you to the dashboard...
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Button 
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (user && !hasAccepted) {
    return (
      <AuthLayout title="Accept Invitation - xFoundry">
        <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Team Invitation
              </h1>
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-center mb-2">
                You&apos;re Invited!
              </h2>
              
              <p className="text-gray-600 text-center mb-4">
                You&apos;ve been invited to join {invitation?.team?.name || "a team"} on xFoundry.
              </p>
              
              <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Since you&apos;re already signed in, you can accept this invitation directly.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Button 
                  onClick={handleExistingUserInvite}
                  disabled={isAccepting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isAccepting ? "Accepting..." : "Accept Invitation"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Team Invitation - xFoundry">
      <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="horizontal" color="eden" height={50} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Join Your Team
            </h1>
            <p className="mt-3 text-xl text-gray-500">
              Create an account to accept your invitation to {invitation?.team?.name || "join the team"}
            </p>
          </div>
          
          {/* Team Invitation Badge */}
          {invitation?.team && (
            <div className="flex justify-center mb-6">
              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary px-4 py-2 text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Invited to join: <strong>{invitation.team.name}</strong></span>
              </Badge>
            </div>
          )}
          
          {/* Signup Card */}
          <Card className="p-6 md:p-8 shadow-lg border-0 bg-white rounded-xl">
            <Tabs 
              defaultValue="step1" 
              value={currentStep === 1 ? "step1" : "step2"}
              className="w-full"
            >
              {/* Simple Step Indicators Only */}
              <div className="mb-8 w-full flex justify-center space-x-16">
                {/* Step 1 */}
                <div className="text-center">
                  <div 
                    className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 transition-all duration-300 shadow-sm
                      ${currentStep >= 1 
                        ? 'bg-curious text-white' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                  >
                    1
                  </div>
                  <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-curious' : 'text-gray-400'}`}>
                    Verify Email
                  </span>
                </div>
                
                {/* Step 2 */}
                <div className="text-center">
                  <div 
                    className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 transition-all duration-300 shadow-sm
                      ${currentStep >= 2 
                        ? 'bg-eden text-white' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                  >
                    2
                  </div>
                  <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-eden' : 'text-gray-400'}`}>
                    Profile
                  </span>
                </div>
              </div>
              
              {/* Hidden tabs for content control */}
              <TabsList className="sr-only">
                <TabsTrigger value="step1" disabled={currentStep !== 1}>Verify Email</TabsTrigger>
                <TabsTrigger value="step2" disabled={currentStep !== 2}>Profile Details</TabsTrigger>
              </TabsList>
              
              {/* Step 1: Email Verification */}
              <TabsContent value="step1" className="space-y-6">
                <div className="max-w-lg mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-center">Verify Your Email</h2>
                    <p className="text-gray-500 text-center">
                      Your invitation was sent to the following email address. Confirm it&apos;s correct.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="your.email@example.com"
                          className="h-12"
                          readOnly
                          disabled
                        />
                      </div>
                      
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Email verified! This matches the email address from your invitation.
                        </AlertDescription>
                      </Alert>
                      
                      {/* Continue Button */}
                      <Button
                        onClick={nextStep}
                        className="w-full h-12 bg-eden hover:bg-eden/90"
                      >
                        Continue to Profile Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Step 2: Profile Details */}
              <TabsContent value="step2" className="space-y-6">
                <div className="max-w-lg mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-center">Complete Your Profile</h2>
                    <p className="text-gray-500 text-center">
                      Please provide the following information to complete your profile.
                    </p>
                    
                    <div className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="h-12"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="h-12"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Education Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="graduationYear">Expected Graduation Year</Label>
                          <Input
                            id="graduationYear"
                            name="graduationYear"
                            value={formData.graduationYear}
                            onChange={handleInputChange}
                            placeholder="YYYY"
                            className="h-12"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="degreeType">Degree Type</Label>
                          <Select
                            name="degreeType"
                            value={formData.degreeType}
                            onValueChange={(value) => handleInputChange({ target: { name: 'degreeType', value }})}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select Degree Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                              <SelectItem value="Graduate">Graduate</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                              <SelectItem value="Certificate">Certificate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex flex-col md:flex-row gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={prevStep}
                          className="h-12 md:flex-1 border-eden text-eden hover:bg-eden/5"
                        >
                          Back
                        </Button>
                        
                        <Button 
                          onClick={handleGoogleSignup}
                          disabled={!formData.firstName || !formData.lastName || !formData.graduationYear || !formData.degreeType}
                          className="h-12 md:flex-2 bg-gold text-eden hover:bg-gold/90"
                        >
                          <div className="flex items-center">
                            Create Account with Google
                          </div>
                        </Button>
                      </div>
                      
                      <p className="text-sm text-center text-gray-500 mt-4">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}