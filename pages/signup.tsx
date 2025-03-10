import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Spinner,
  Alert,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Link
} from "@heroui/react";

import { 
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon as AlertCircleIcon,
  UserIcon,
  EnvelopeIcon as MailIcon,
  AcademicCapIcon as GraduationCapIcon
} from "@heroicons/react/24/solid";
import { ThemeSwitch } from "@/components/theme-switch";

export default function SignUp() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [institutionStatus, setInstitutionStatus] = useState<string | null>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  const [isEmailFromRedirect, setIsEmailFromRedirect] = useState(false);
  const hasVerifiedEmailRef = useRef(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    graduationYear: "",
    degreeType: "",
    referralSource: ""
  });

  // Function to continue to the next step
  const nextStep = useCallback(() => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  // Function to go back to the previous step
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Function to check email domain against institution domains and check if user exists
  const verifyInstitution = useCallback(async () => {
    // Basic email validation
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    // Don't re-verify if already in success state
    if (institutionStatus === "success" && !isVerifying) {
      return;
    }
    
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
      
      if (!userCheckResponse.ok) {
        console.error("Failed user check response:", userCheckResponse);
        throw new Error("Failed to check user existence");
      }
      
      const userCheckData = await userCheckResponse.json();
      
      // If user exists in Auth0, show message and prepare for redirect
      if (userCheckData.exists) {
        console.log("User already exists in Auth0, redirecting to login");
        setUserExists(true);
        setIsRedirecting(true);
        
        // Hide the continue button by setting institutionStatus to a special value
        setInstitutionStatus("user-exists");
        
        // Delay redirect to show message to user for 2 seconds
        setTimeout(() => {
          window.location.href = `/api/auth/login?prompt=login`;
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
            degreeType: metadata.degreeType || formData.degreeType
          };
          
          console.log("Prefilling form data:", updatedFormData);
          setFormData(updatedFormData);
          setHasPrefilledData(true);
          
          // Automatically proceed to step 2 if we have good prefilled data
          if (metadata.firstName && metadata.lastName) {
            // Brief delay to ensure institution verification completes
            setTimeout(() => {
              if (institutionStatus === "success" || institutionStatus === null) {
                nextStep();
              }
            }, 500);
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
      
      if (data.success) {
        console.log(`Institution found: ${data.institution.name}`);
        setInstitution(data.institution);
        setInstitutionStatus("success");
        // Set our flag to indicate successful verification
        hasVerifiedEmailRef.current = true;
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
  }, [email, formData, institutionStatus, nextStep, isVerifying]);

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
  }, [user, router, router.query.cohortId]);
  
  // Handle email from URL query parameters and auto-verification
  useEffect(() => {
    // Get email from URL query parameters if available
    if (router.query.email && !hasVerifiedEmailRef.current) {
      const emailFromQuery = router.query.email as string;
      setEmail(emailFromQuery);
      
      // Only mark as redirected from login if we have both email query param and from_login flag
      const isFromLogin = router.query.from_login === 'true';
      setIsEmailFromRedirect(isFromLogin && emailFromQuery.includes('@'));
      
      // Automatically initiate verification if email is provided via URL
      if (typeof emailFromQuery === 'string' && emailFromQuery.includes('@')) {
        // Set the flag to prevent multiple verifications
        hasVerifiedEmailRef.current = true;
        
        // Need to wait for component to fully mount
        const timer = setTimeout(() => {
          verifyInstitution();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [router.query.email, router.query.from_login, verifyInstitution]);

  // Function to handle input changes for personal info form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Function to handle the Google sign up/in
  const handleGoogleSignup = () => {
    // Create query params with user data for Auth0
    const queryParams = new URLSearchParams({
      institution: institution?.name || "",
      institutionId: institution?.id || "",
      degreeType: formData.degreeType,
      graduationYear: formData.graduationYear,
      firstName: formData.firstName,
      lastName: formData.lastName,
      referralSource: formData.referralSource,
      // Use email parameter instead of login_hint to ensure metadata is captured correctly
      email: email, 
    });
    
    // Add cohortId if it exists in URL parameters
    if (router.query.cohortId) {
      queryParams.append("cohortId", router.query.cohortId as string);
    }
    
    // Add Airtable ID if available in localStorage
    const airtableId = localStorage.getItem('xFoundry_airtableId');
    if (airtableId) {
      queryParams.append("airtableId", airtableId);
    }
    
    // Add signup metadata from Airtable if available
    const signupMetadata = localStorage.getItem('xFoundry_signupMetadata');
    if (signupMetadata) {
      try {
        const metadata = JSON.parse(signupMetadata);
        
        // Add all metadata fields as query parameters
        Object.entries(metadata).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value as string);
          }
        });
      } catch (error) {
        console.error("Error parsing signup metadata:", error);
      }
    }
    
    // Store the verified email in localStorage before redirecting
    if (email) {
      localStorage.setItem('xFoundry_verifiedEmail', email);
    }
    
    // Encode the email to use as login_hint for Google authentication
    const encodedEmail = encodeURIComponent(email);
    
    // Redirect directly to Google authentication, bypassing Auth0 login screen
    window.location.href = `/api/auth/login?connection=google-oauth2&${queryParams.toString()}&prompt=login&login_hint=${encodedEmail}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center py-10 px-4">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
        <div className="max-w-5xl w-full">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-primary">xFoundry</h1>
              <ThemeSwitch />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary sm:text-4xl">
                Join Our Multidisciplinary Community
              </h1>
              <p className="mt-3 text-xl text-default-500">
                Break down academic silos and collaborate across disciplines to tackle global challenges
              </p>
            </div>
          </div>
          
          {/* Signup Card */}
          <Card className="p-6 md:p-8 shadow-lg bg-content1 dark:bg-content1">
            {/* Enhanced Step Indicators */}
            <div className="mb-8 w-full">
              <div className="flex justify-center items-center mb-6">
                <div className="w-full max-w-md flex items-center">
                  {/* Step 1 */}
                  <div className="flex-1 text-center">
                    <div 
                      className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-base font-medium mb-2 transition-all duration-500 shadow-md
                        ${currentStep >= 1 
                          ? 'bg-primary text-white scale-110 ring-4 ring-primary/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'}`}
                    >
                      <span className="animate-fade-in">1</span>
                    </div>
                    <span className={`text-sm font-medium transition-all duration-300 ${currentStep >= 1 ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
                      Institution
                    </span>
                  </div>

                  {/* Connecting Line */}
                  <div className="w-24 h-1 mx-2 rounded-full transition-all duration-500 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full`}></div>
                    <div 
                      className={`absolute inset-0 bg-primary rounded-full transition-all duration-1000 ease-out
                        ${currentStep >= 2 ? 'w-full' : 'w-0'}`}
                    ></div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex-1 text-center">
                    <div 
                      className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-base font-medium mb-2 transition-all duration-500 shadow-md
                        ${currentStep >= 2 
                          ? 'bg-primary text-white scale-110 ring-4 ring-primary/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'}`}
                    >
                      <span className="animate-fade-in">2</span>
                    </div>
                    <span className={`text-sm font-medium transition-all duration-300 ${currentStep >= 2 ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
                      Profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Content container with animation */}
              <div className="relative overflow-hidden">
                {/* Step 1: Institution Verification */}
                <div 
                  className={`transition-all duration-500 transform ${
                    currentStep === 1 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute inset-0'
                  }`}
                >
                  <div className="max-w-lg mx-auto">
                    <div className="space-y-6">
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <MailIcon className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-center">Verify Your Institution</h2>
                      <p className="text-default-500 text-center">
                        Enter your institutional email to get started. We'll verify that your school is part of our network.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="email">Institutional Email</label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.name@school.edu"
                            isDisabled={isVerifying || isRedirecting || isEmailFromRedirect}
                            className="h-12"
                            startContent={isEmailFromRedirect && 
                              <CheckCircleIcon className="h-5 w-5 text-success" aria-label="Email pre-filled from login" />}
                          />
                          {emailError && (
                            <p className="text-sm font-medium text-danger">{emailError}</p>
                          )}
                          {isEmailFromRedirect && !emailError && (
                            <p className="text-xs text-success">Email pre-filled from login attempt</p>
                          )}
                        </div>
                        
                        {/* Verify Button */}
                        {(institutionStatus === null || institutionStatus === "error") && (
                          <Button 
                            onPress={verifyInstitution}
                            isDisabled={isVerifying || !email || isRedirecting}
                            className="w-full h-12"
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
                            ) : "Verify Institution"}
                          </Button>
                        )}
                        
                        {/* Results */}
                        <div className="space-y-4 mt-2">
                          {/* User exists message */}
                          {userExists && (
                            <Alert
                              color="primary"
                              title="Account Found"
                            >
                              An account with this email already exists. Redirecting you to the login page...
                            </Alert>
                          )}
                          
                          {/* Institution verification success */}
                          {institutionStatus === "success" && !userExists && (
                            <Alert
                              color="success"
                              title={`Institution Verified: ${institution?.name}`}
                            >
                              Your institution has been verified. Continue to complete your profile.
                            </Alert>
                          )}
                          
                          {/* Institution verification error */}
                          {institutionStatus === "error" && !userExists && (
                            <Alert
                              color="danger"
                              title="Verification Failed"
                            >
                              Institution not recognized. Please use your school email address.
                            </Alert>
                          )}
                          
                          {/* Continue Button */}
                          {institutionStatus === "success" && !userExists && (
                            <Button
                              onPress={nextStep}
                              className="w-full h-12 group"
                              color="primary"
                            >
                              Continue to Profile Details
                              <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Profile Details */}
                <div 
                  className={`transition-all duration-500 transform ${
                    currentStep === 2 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0'
                  }`}
                >
                  <div className="max-w-lg mx-auto">
                    <div className="space-y-6">
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-center">Complete Your Profile</h2>
                      {hasPrefilledData ? (
                        <Alert
                          color="primary"
                          title="Existing Information Found"
                        >
                          We found your existing information! Please verify it's correct before continuing.
                        </Alert>
                      ) : (
                        <p className="text-default-500 text-center">
                          Please provide the following information to complete your profile.
                        </p>
                      )}
                      
                      <div className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
                            <Input
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="h-12"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
                            <Input
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="h-12"
                            />
                          </div>
                        </div>
                        
                        {/* Education Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="graduationYear">Expected Graduation Year</label>
                            <Input
                              id="graduationYear"
                              name="graduationYear"
                              value={formData.graduationYear}
                              onChange={handleInputChange}
                              placeholder="YYYY"
                              className="h-12"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="degreeType">Degree Type</label>
                            <Select
                              id="degreeType"
                              selectedKeys={formData.degreeType ? [formData.degreeType] : []}
                              onChange={(e) => handleSelectChange("degreeType", e.target.value)}
                              placeholder="Select Degree Type"
                              className="h-12"
                            >
                              <SelectItem key="Undergraduate">Undergraduate</SelectItem>
                              <SelectItem key="Graduate">Graduate</SelectItem>
                              <SelectItem key="Doctorate">Doctorate</SelectItem>
                              <SelectItem key="Certificate">Certificate</SelectItem>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Referral Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="referralSource">How did you hear about xFoundry?</label>
                          <Select
                            id="referralSource"
                            selectedKeys={formData.referralSource ? [formData.referralSource] : []}
                            onChange={(e) => handleSelectChange("referralSource", e.target.value)}
                            placeholder="Please select..."
                            className="h-12"
                          >
                            <SelectItem key="Friend">Friend or Classmate</SelectItem>
                            <SelectItem key="Professor">Professor or Advisor</SelectItem>
                            <SelectItem key="Email">Email</SelectItem>
                            <SelectItem key="SocialMedia">Social Media</SelectItem>
                            <SelectItem key="Event">Campus Event</SelectItem>
                            <SelectItem key="Search">Search Engine</SelectItem>
                            <SelectItem key="Other">Other</SelectItem>
                          </Select>
                        </div>
                        
                        {/* Buttons */}
                        <div className="flex flex-col md:flex-row gap-3 pt-4">
                          <Button 
                            variant="bordered" 
                            onPress={prevStep}
                            className="h-12 md:flex-1 border-primary text-primary group"
                          >
                            <ArrowRightIcon className="mr-2 h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
                            Back
                          </Button>
                          
                          <Button 
                            onPress={handleGoogleSignup}
                            isDisabled={!formData.firstName || !formData.lastName || !formData.graduationYear || !formData.degreeType}
                            className="h-12 md:flex-2"
                            color="warning"
                          >
                            <div className="flex items-center">
                              Create Account with Google
                            </div>
                          </Button>
                        </div>
                        
                        <p className="text-sm text-center text-default-500 mt-4">
                          By creating an account, you agree to our Terms of Service and Privacy Policy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-default-500">
              Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}