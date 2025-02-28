import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfileCard = ({ profile, onEditClick }) => {
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
          {onEditClick && (
            <Button onClick={onEditClick} size="sm">
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Academic Information</h3>
          
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="font-semibold">Institution:</div>
              <div>{userData.institutionName || "Not specified"}</div>
              {userData.needsInstitutionConfirm && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Needs confirmation
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Degree Type:</div>
              <div>{userData.degreeType || "Not specified"}</div>
            </div>
            {userData.showMajor && (
              <div className="space-y-1">
                <div className="font-semibold">Major:</div>
                <div>{userData.major || "Not specified"}</div>
              </div>
            )}
            <div className="space-y-1">
              <div className="font-semibold">Graduation Year:</div>
              <div>{userData.graduationYear || "Not specified"}</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <Alert className={userData.isProfileComplete ? 
          "bg-green-50 border-green-200 text-green-800 w-full" : 
          "bg-amber-50 border-amber-200 text-amber-800 w-full"
        }>
          <AlertDescription className="flex items-center justify-center font-medium">
            {userData.isProfileComplete ? (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                Profile Complete
              </>
            ) : (
              <>
                <WarningIcon className="mr-2 h-4 w-4" />
                Profile Incomplete
                {onEditClick && (
                  <Button 
                    onClick={onEditClick} 
                    variant="link" 
                    className="p-0 h-auto ml-2 font-medium text-amber-800 underline"
                  >
                    Update Your Information
                  </Button>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
        
        {!userData.institution?.id && !userData.suggestedInstitution && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 w-full">
            <AlertDescription className="space-y-2">
              <p>
                Please add your education information to see available programs for your institution.
              </p>
              {onEditClick && (
                <Button onClick={onEditClick} variant="secondary" size="sm" className="mt-2">
                  Add Education Details
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
};

// Icon components
const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const WarningIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default ProfileCard;