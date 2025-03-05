import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfileCard = ({ profile, onEditClick, isLoading = false }) => {
  // Use real data or fallback to placeholders if no profile is provided
  const userData = profile || {};
  
  // Get profile picture from Airtable or Auth0
  const profilePicture = userData.Headshot || userData.picture || '/placeholder-user.jpg';
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (!userData.name) return "NN";
    return userData.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="mb-5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <>
              <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-7 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-60 animate-pulse"></div>
              </div>
            </>
          ) : (
            <>
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={profilePicture} 
                  alt={userData.name || "Profile"} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-user.jpg';
                  }}
                />
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">{userData.name || "No Name"}</CardTitle>
                <p className="text-muted-foreground">{userData.email || "No Email"}</p>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <>
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          </>
        ) : (
          <>
            {userData.needsInstitutionConfirm && userData.suggestedInstitution && (
              <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
                <div className="mb-2 font-semibold">Is this your institution?</div>
                <AlertDescription className="space-y-2">
                  <p>
                    Based on your email domain, we think you might be from <strong>{userData.suggestedInstitution.name}</strong>.
                  </p>
                  <Button onClick={onEditClick} className="mt-2" variant="secondary">
                    Confirm Institution
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {userData.showMajor && (
              <div className="space-y-1 mb-4">
                <div className="font-semibold">Major:</div>
                <div>{userData.major || "Not specified"}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse w-full">
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
          </div>
        ) : (
          <>
            {!userData.isProfileComplete ? (
              <Alert className="bg-amber-50 border-amber-200 text-amber-800 w-full">
                <AlertDescription className="flex items-center justify-center font-medium">
                  <WarningIcon className="mr-2 h-4 w-4" />
                  Profile Incomplete
                </AlertDescription>
              </Alert>
            ) : null}
            
            {onEditClick && (
              <Button 
                onClick={onEditClick} 
                size="lg"
                className="w-full transition-all duration-300 ease-in-out hover:scale-105"
              >
                <Edit className="mr-2 h-5 w-5" />
                Edit Profile
              </Button>
            )}
            
            {!userData.institution?.id && !userData.suggestedInstitution && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 w-full">
                <AlertDescription className="space-y-2">
                  <p>
                    Please add your education information to see available programs for your institution.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

// Icon components
const WarningIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Edit icon
const Edit = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default ProfileCard;