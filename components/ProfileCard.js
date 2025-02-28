import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from "./ui/card"
import { Button } from "./ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { CheckCircle2, AlertTriangle, School } from "lucide-react"

const ProfileCard = ({ profile, onEditClick }) => {
  // Use real data or fallback to placeholders if no profile is provided
  const userData = profile || {};
  
  // Get profile picture from Airtable or Auth0
  const profilePicture = userData.Headshot || userData.picture || '/placeholder-user.jpg';
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage 
            src={profilePicture} 
            alt={userData.name || "Profile"} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-user.jpg';
            }}
          />
          <AvatarFallback>{userData.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{userData.name || "No Name"}</h2>
          <p className="text-muted-foreground">{userData.email || "No Email"}</p>
        </div>
        {onEditClick && (
          <Button onClick={onEditClick}>
            Edit Profile
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">Academic Information</h3>
          
          {userData.needsInstitutionConfirm && userData.suggestedInstitution && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
              <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Is this your institution?</p>
              <p className="text-blue-800 dark:text-blue-400 mb-3">
                Based on your email domain, we think you might be from <strong>{userData.suggestedInstitution.name}</strong>.
              </p>
              <Button onClick={onEditClick} variant="secondary">
                Confirm Institution
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm mb-1">Institution:</p>
              <div className="flex flex-col">
                <span>{userData.institutionName || "Not specified"}</span>
                {userData.needsInstitutionConfirm && (
                  <span className="text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 py-0.5 px-2 rounded-sm mt-1 inline-flex self-start">
                    Needs confirmation
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Degree Type:</p>
              <span>{userData.degreeType || "Not specified"}</span>
            </div>
            {userData.showMajor && (
              <div>
                <p className="font-medium text-sm mb-1">Major:</p>
                <span>{userData.major || "Not specified"}</span>
              </div>
            )}
            <div>
              <p className="font-medium text-sm mb-1">Graduation Year:</p>
              <span>{userData.graduationYear || "Not specified"}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className={`w-full text-center py-2 px-4 rounded-md flex items-center justify-center font-medium ${
          userData.isProfileComplete 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
            : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
        }`}>
          {userData.isProfileComplete ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Profile Complete
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Profile Incomplete 
              {onEditClick && (
                <Button 
                  variant="link" 
                  onClick={onEditClick} 
                  className="px-1 h-auto font-medium underline text-amber-800 dark:text-amber-300"
                >
                  Update Your Information
                </Button>
              )}
            </>
          )}
        </div>
        
        {!userData.institution?.id && !userData.suggestedInstitution && (
          <div className="w-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 mt-2">
            <div className="flex gap-3 items-start">
              <School className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="text-blue-800 dark:text-blue-400 font-medium">
                  Please add your education information to see available programs for your institution.
                </p>
                {onEditClick && (
                  <Button onClick={onEditClick} variant="secondary" size="sm">
                    Add Education Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export default ProfileCard