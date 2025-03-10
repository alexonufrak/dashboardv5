import { useState, useEffect } from "react";
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
  Tab
} from "@heroui/react";
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  UserIcon,
  MailIcon,
  GraduationCapIcon
} from "@heroui/icons/solid";

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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    graduationYear: "",
    degreeType: "",
    referralSource: ""
  });

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
    if (router.query.email) {
      setEmail(router.query.email as string);
      // Automatically initiate verification if email is provided via URL
      if (typeof router.query.email === 'string' && router.query.email.includes('@')) {
        // Need to wait for component to fully mount
        setTimeout(() => verifyInstitution(), 500);
      }
    }
  }, [user, router, router.query]);

  // Function to check email domain against institution domains and check if user exists
  const verifyInstitution = async () => {
    // Basic email validation
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
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
  };

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <h1 className="text-3xl font-bold text-primary">xFoundry</h1>
            </div>
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              Join Our Multidisciplinary Community
            </h1>
            <p className="mt-3 text-xl text-default-500">
              Break down academic silos and collaborate across disciplines to tackle global challenges
            </p>
          </div>
          
          {/* Signup Card */}
          <Card className="p-6 md:p-8 shadow-lg bg-white">
            {/* Step Indicators */}
            <div className="mb-8 w-full flex justify-center space-x-16">
              {/* Step 1 */}
              <div className="text-center">
                <div 
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 transition-all duration-300 shadow-sm
                    ${currentStep >= 1 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                >
                  1
                </div>
                <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                  Institution
                </span>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div 
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 transition-all duration-300 shadow-sm
                    ${currentStep >= 2 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                >
                  2
                </div>
                <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                  Profile
                </span>
              </div>
            </div>

            <Tabs 
              selectedKey={currentStep === 1 ? "step1" : "step2"}
            >
              {/* Step 1: Institution Verification */}
              <Tab key="step1" title="Institution" className="space-y-6">
                <div className="max-w-lg mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
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
                          isDisabled={isVerifying || isRedirecting}
                          className="h-12"
                        />
                        {emailError && (
                          <p className="text-sm font-medium text-danger">{emailError}</p>
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
                            startContent={<AlertCircleIcon className="h-4 w-4" />}
                          >
                            An account with this email already exists. Redirecting you to the login page...
                          </Alert>
                        )}
                        
                        {/* Institution verification success */}
                        {institutionStatus === "success" && !userExists && (
                          <Alert
                            color="success"
                            startContent={<CheckCircleIcon className="h-4 w-4" />}
                            title="Verification Successful"
                          >
                            Institution: {institution.name}
                          </Alert>
                        )}
                        
                        {/* Institution verification error */}
                        {institutionStatus === "error" && !userExists && (
                          <Alert
                            color="danger"
                            startContent={<XCircleIcon className="h-4 w-4" />}
                          >
                            Institution not recognized. Please use your school email address.
                          </Alert>
                        )}
                        
                        {/* Continue Button */}
                        {institutionStatus === "success" && !userExists && (
                          <Button
                            onPress={nextStep}
                            className="w-full h-12"
                            color="primary"
                          >
                            Continue to Profile Details
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>
              
              {/* Step 2: Profile Details */}
              <Tab key="step2" title="Profile" className="space-y-6">
                <div className="max-w-lg mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-center">Complete Your Profile</h2>
                    {hasPrefilledData ? (
                      <Alert
                        color="primary"
                        startContent={<CheckCircleIcon className="h-4 w-4" />}
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
                            <SelectItem key="Undergraduate" value="Undergraduate">Undergraduate</SelectItem>
                            <SelectItem key="Graduate" value="Graduate">Graduate</SelectItem>
                            <SelectItem key="Doctorate" value="Doctorate">Doctorate</SelectItem>
                            <SelectItem key="Certificate" value="Certificate">Certificate</SelectItem>
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
                          <SelectItem key="Friend" value="Friend">Friend or Classmate</SelectItem>
                          <SelectItem key="Professor" value="Professor">Professor or Advisor</SelectItem>
                          <SelectItem key="Email" value="Email">Email</SelectItem>
                          <SelectItem key="SocialMedia" value="SocialMedia">Social Media</SelectItem>
                          <SelectItem key="Event" value="Event">Campus Event</SelectItem>
                          <SelectItem key="Search" value="Search">Search Engine</SelectItem>
                          <SelectItem key="Other" value="Other">Other</SelectItem>
                        </Select>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex flex-col md:flex-row gap-3 pt-4">
                        <Button 
                          variant="bordered" 
                          onPress={prevStep}
                          className="h-12 md:flex-1 border-primary text-primary"
                        >
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
              </Tab>
            </Tabs>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-default-500">
              Already have an account? <a href="/login" className="text-primary font-semibold hover:underline">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}