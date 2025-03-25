"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0"
import Head from "next/head"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import Logo from "@/components/common/Logo"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowRight, CheckCircle, XCircle, AlertCircle, GraduationCap, Mail, User } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignUp() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  // Use a ref to track if we've already auto-advanced to step 2 to prevent infinite loops
  const hasAutoAdvanced = useRef(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    graduationYear: "",
    graduationSemester: "",
    degreeType: "",
    referralSource: ""
  });

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

  // Track if verification has been run at least once
  const hasVerified = useRef(false);

  // Function to check email domain against institution domains and check if user exists
  const verifyInstitution = useCallback(async () => {
    // Skip if we've already verified to prevent loops
    if (hasVerified.current && isVerifying) {
      console.log("Skipping duplicate verification call");
      return;
    }

    // Basic email validation
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    // Mark that we've started verification
    hasVerified.current = true;
    setIsVerifying(true);
    setEmailError("");
    setInstitutionStatus(null);
    
    try {
      console.log(`Verifying institution for email: ${email}`);
      
      // First check if the user already exists
      console.log(`Checking if email exists: ${email}`);
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
      
      // If user exists in Auth0, show message and prepare for redirect
      if (userCheckData.exists) {
        console.log("User already exists in Auth0, redirecting to login");
        setUserExists(true);
        setIsRedirecting(true);
        
        // Hide the continue button by setting institutionStatus to a special value
        // This prevents the continue button from showing
        setInstitutionStatus("user-exists");
        
        // Delay redirect to show message to user for 2 seconds
        setTimeout(() => {
          window.location.href = `/auth/login?prompt=login`;
        }, 2000);
        return;
      }
      
      // If the user is found in Airtable but not Auth0, prefill the form data
      if (userCheckData.airtableExists) {
        console.log("User exists in Airtable but not in Auth0, prefilling form data");
        // Store the Airtable ID in localStorage to associate during signup
        localStorage.setItem('xFoundry_airtableId', userCheckData.airtableId || '');
        
        // If there's metadata from Airtable, store it for the signup
        if (userCheckData.signupMetadata) {
          console.log("Found Airtable metadata for signup:", userCheckData.signupMetadata);
          localStorage.setItem('xFoundry_signupMetadata', JSON.stringify(userCheckData.signupMetadata));
          
          // Pre-fill form data with all available information
          const metadata = userCheckData.signupMetadata;
          const updatedFormData = {
            ...formData,
            firstName: metadata.firstName || '',
            lastName: metadata.lastName || '',
            graduationYear: metadata.graduationYear || '',
            graduationSemester: metadata.graduationSemester || '',
            degreeType: metadata.degreeType || formData.degreeType,
            referralSource: metadata.referralSource || formData.referralSource
          };
          
          console.log("Prefilling form data:", updatedFormData);
          // Don't update state if the data is the same to avoid loops
          const hasChanged = JSON.stringify(updatedFormData) !== JSON.stringify(formData);
          if (hasChanged) {
            setFormData(updatedFormData);
            setHasPrefilledData(true);
            
            // Automatically proceed to step 2 if we have good prefilled data
            if (metadata.firstName && metadata.lastName && !hasAutoAdvanced.current) {
              // Mark that we've auto-advanced to prevent infinite loops
              hasAutoAdvanced.current = true;
              
              // Brief delay to ensure institution verification completes
              setTimeout(() => {
                nextStep();
              }, 500);
            }
            
            // Show notification about found details
            toast.success("We found your existing details! Continue with signup to access your account.");
          }
        }
      }
      
      // If user doesn't exist, continue with institution verification
      const response = await fetch("/api/institution-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to verify institution");
      }
      
      const data = await response.json();
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
      console.error("Error verifying institution:", error);
      setInstitutionStatus("error");
    } finally {
      setIsVerifying(false);
    }
  }, [email, formData, nextStep]);

  // Function to handle input changes for personal info form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Track if verification was auto-triggered from URL params
  const autoVerifiedRef = useRef(false);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      // If there's a cohortId parameter, add it to the dashboard redirect
      if (router.query.cohortId) {
        router.push(`/dashboard?cohortId=${router.query.cohortId}`);
      } else {
        router.push("/dashboard");
      }
    }
    
    // Get email from URL query parameters if available
    if (router.query.email && !autoVerifiedRef.current) {
      console.log("Setting email from URL param:", router.query.email);
      setEmail(router.query.email);
      
      // Automatically initiate verification if email is provided via URL
      if (router.query.email.includes('@')) {
        console.log("Auto-triggering verification from URL param");
        // Mark that we've triggered verification to prevent loops
        autoVerifiedRef.current = true;
        
        // Need to wait for component to fully mount
        setTimeout(() => {
          if (!hasVerified.current) {
            verifyInstitution();
          }
        }, 500);
      }
    }
  }, [user, router, router.query, verifyInstitution]);

  // Function to handle the Google sign up/in
  const handleGoogleSignup = () => {
    // Create query params with user data for Auth0
    const queryParams = new URLSearchParams({
      institution: institution?.name || "",
      institutionId: institution?.id || "",
      degreeType: formData.degreeType,
      graduationYear: formData.graduationYear,
      graduationSemester: formData.graduationSemester,
      firstName: formData.firstName,
      lastName: formData.lastName,
      referralSource: formData.referralSource,
      // Use email parameter instead of login_hint to ensure metadata is captured correctly
      email: email, 
    });
    
    // Add cohortId if it exists in URL parameters
    if (router.query.cohortId) {
      queryParams.append("cohortId", router.query.cohortId);
    }
    
    // Add Airtable ID if available in localStorage
    // This happens when a user exists in Airtable but not in Auth0
    const airtableId = localStorage.getItem('xFoundry_airtableId');
    if (airtableId) {
      queryParams.append("airtableId", airtableId);
      console.log("Adding existing Airtable ID to auth params:", airtableId);
    }
    
    // Add signup metadata from Airtable if available
    const signupMetadata = localStorage.getItem('xFoundry_signupMetadata');
    if (signupMetadata) {
      try {
        const metadata = JSON.parse(signupMetadata);
        
        // Add all metadata fields as query parameters
        Object.entries(metadata).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
        
        console.log("Added Airtable metadata to auth params");
      } catch (error) {
        console.error("Error parsing signup metadata:", error);
      }
    }
    
    // Store the verified email in localStorage before redirecting
    // This will be used as a backup to ensure email consistency
    if (email) {
      localStorage.setItem('xFoundry_verifiedEmail', email);
    }
    
    // Encode the email to use as login_hint for Google authentication
    const encodedEmail = encodeURIComponent(email);
    
    // Redirect directly to Google authentication, bypassing Auth0 login screen
    // Use login_hint with connection=google-oauth2 to go straight to Google
    window.location.href = `/auth/login?connection=google-oauth2&${queryParams.toString()}&prompt=login&login_hint=${encodedEmail}`;
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
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up - xFoundry</title>
      </Head>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8 bg-background min-h-screen">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="horizontal" color="auto" height={50} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary dark:text-primary">
              Join Our Multidisciplinary Community
            </h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Break down academic silos and collaborate across disciplines to tackle global challenges
            </p>
          </div>
          
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
                    Institution
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
                <TabsTrigger value="step1" disabled={currentStep !== 1}>Institution</TabsTrigger>
                <TabsTrigger value="step2" disabled={currentStep !== 2}>Profile Details</TabsTrigger>
              </TabsList>
              
              {/* Step 1: Institution Verification */}
              <TabsContent value="step1" className="space-y-6">
                <div className="max-w-lg mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-center">Verify Your Institution</h2>
                    <p className="text-gray-500 text-center">
                      Enter your institutional email to get started. We&apos;ll verify that your school is part of our network.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Institutional Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.name@school.edu"
                          disabled={isVerifying || isRedirecting}
                          className="h-12"
                        />
                        {emailError && (
                          <p className="text-sm font-medium text-destructive">{emailError}</p>
                        )}
                      </div>
                      
                      {/* Verify Button */}
                      {(institutionStatus === null || institutionStatus === "error") && (
                        <Button 
                          onClick={verifyInstitution}
                          disabled={isVerifying || !email || isRedirecting}
                          className="w-full h-12 bg-curious hover:bg-curious/90"
                        >
                          {isVerifying ? (
                            <div className="flex items-center">
                              <span className="mr-2">Verifying</span>
                              <span className="inline-block animate-pulse">•</span>
                              <span className="inline-block animate-pulse delay-75">•</span>
                              <span className="inline-block animate-pulse delay-150">•</span>
                            </div>
                          ) : "Verify Institution"}
                        </Button>
                      )}
                      
                      {/* Results */}
                      <div className="space-y-4 mt-2">
                        {/* User exists message */}
                        {userExists && (
                          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>
                              An account with this email already exists. Redirecting you to the login page...
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Institution verification success */}
                        {institutionStatus === "success" && !userExists && (
                          <Alert className="bg-green-50 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <AlertDescription className="flex flex-col">
                              <div className="font-medium">Verification Successful</div>
                              <div>Institution: {institution.name}</div>
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Institution verification error */}
                        {institutionStatus === "error" && !userExists && (
                          <Alert variant="destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>
                              Institution not recognized. Please use your school email address.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Continue Button */}
                        {institutionStatus === "success" && !userExists && (
                          <Button
                            onClick={nextStep}
                            className="w-full h-12 bg-eden hover:bg-eden/90"
                          >
                            Continue to Profile Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
                    {hasPrefilledData ? (
                      <Alert className="mt-2 bg-blue-50 text-blue-800 border-blue-200">
                        <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                        <AlertDescription>
                          We found your existing information! Please verify it&apos;s correct before continuing.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-gray-500 text-center">
                        Please provide the following information to complete your profile.
                      </p>
                    )}
                    
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
                          <Label htmlFor="graduationSemester">Graduation Semester</Label>
                          <Select
                            name="graduationSemester"
                            value={formData.graduationSemester}
                            onValueChange={(value) => handleInputChange({ target: { name: 'graduationSemester', value }})}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Fall">Fall</SelectItem>
                              <SelectItem value="Spring">Spring</SelectItem>
                              <SelectItem value="Summer">Summer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Degree Type */}
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
                      
                      {/* Referral Field */}
                      <div className="space-y-2">
                        <Label htmlFor="referralSource">How did you hear about xFoundry?</Label>
                        <Select
                          name="referralSource"
                          value={formData.referralSource}
                          onValueChange={(value) => handleInputChange({ target: { name: 'referralSource', value }})}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Please select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Friend">Friend or Classmate</SelectItem>
                            <SelectItem value="Professor">Professor or Advisor</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="SocialMedia">Social Media</SelectItem>
                            <SelectItem value="Event">Campus Event</SelectItem>
                            <SelectItem value="Search">Search Engine</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                          disabled={!formData.firstName || !formData.lastName || !formData.graduationYear || !formData.graduationSemester || !formData.degreeType}
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
    </>
  );
}