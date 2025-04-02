import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { School, Mail, MapPin, Briefcase, Pencil } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0';
import { useMyContact, useUpdateContact } from '@/lib/hooks/useContact';
import { useMyEducation } from '@/lib/airtable/hooks/useEducation';
import DataDisplay from '@/components/common/DataDisplay';

/**
 * ProfileCard Component - Refactored to use domain-driven hooks
 * Displays user profile information combining contact and education data
 */
export default function ProfileCard() {
  const { user } = useUser();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Use domain-specific hooks to fetch user data
  const { 
    data: contact, 
    isLoading: contactLoading, 
    isError: contactError,
    error: contactErrorDetails,
    refetch: refetchContact
  } = useMyContact();
  
  const {
    data: education,
    isLoading: educationLoading,
    isError: educationError
  } = useMyEducation();
  
  // Combined loading state
  const isLoading = contactLoading || educationLoading;
  
  // Combined error state
  const isError = contactError || educationError;
  const error = contactError ? contactErrorDetails : null;
  
  // Create a combined profile object from contact and education
  const profile = React.useMemo(() => {
    if (!contact) return null;
    
    return {
      contactId: contact.contactId,
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      email: contact.email,
      auth0Id: contact.auth0Id,
      // Education-related fields
      institutionName: education?.institutionName,
      degreeType: education?.degreeType,
      major: education?.majorName,
      gradYear: education?.graduationYear,
      gradSemester: education?.graduationSemester,
      // These fields would come from a separate profile table, simulated here
      headline: contact.headline || (education?.degreeType ? `${education.degreeType} Student` : ''),
      bio: contact.bio || '',
      pronouns: contact.pronouns || '',
      location: contact.location || '',
      avatarUrl: user?.picture || ''
    };
  }, [contact, education, user]);
  
  return (
    <Card className="w-full">
      <DataDisplay
        data={profile}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetchContact}
        loadingComponent={
          <div>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </div>
        }
        errorComponent={
          <div>
            <CardHeader>
              <CardTitle className="text-red-700">Error Loading Profile</CardTitle>
              <CardDescription className="text-red-600">
                {error?.message || 'Failed to load profile details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={refetchContact} variant="outline" size="sm">
                Retry
              </Button>
            </CardContent>
          </div>
        }
        emptyComponent={
          <div>
            <CardHeader>
              <CardTitle className="text-orange-700">Profile Not Found</CardTitle>
              <CardDescription className="text-orange-600">
                Your profile information could not be loaded.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please complete your profile information.
              </p>
            </CardContent>
          </div>
        }
      >
        {(data) => (
          <>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={data.avatarUrl || user?.picture} 
                  alt={data.name} 
                />
                <AvatarFallback>
                  {data.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle>{data.name}</CardTitle>
                  
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <ProfileEditForm 
                        profile={data} 
                        onSuccess={() => setIsEditOpen(false)} 
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                
                <CardDescription className="mt-1">
                  {data.headline || data.degreeType ? `${data.degreeType} Student` : 'No headline set'}
                </CardDescription>
                
                {data.pronouns && (
                  <Badge variant="outline" className="mt-2">
                    {data.pronouns}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {data.bio && (
                <p className="text-sm text-muted-foreground mb-6">
                  {data.bio}
                </p>
              )}
              
              <div className="space-y-3">
                {data.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{data.email}</span>
                  </div>
                )}
                
                {data.institutionName && (
                  <div className="flex items-center text-sm">
                    <School className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{data.institutionName}</span>
                  </div>
                )}
                
                {data.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{data.location}</span>
                  </div>
                )}
                
                {(data.major || data.gradYear) && (
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>
                      {data.major}
                      {data.major && data.gradYear && ' • '}
                      {data.gradYear && `Class of ${data.gradYear}`}
                      {data.gradSemester && ` (${data.gradSemester})`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}
      </DataDisplay>
    </Card>
  );
}

// Profile Edit Form Component
function ProfileEditForm({ profile, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: profile.name?.split(' ')[0] || '',
    lastName: profile.name?.split(' ').slice(1).join(' ') || '',
    location: profile.location || '',
    bio: profile.bio || '',
    pronouns: profile.pronouns || '',
    headline: profile.headline || ''
  });
  
  // Use the domain-specific hook for updates
  const { update, isUpdating } = useUpdateContact();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      update({
        contactId: profile.contactId,
        ...formData
      }, {
        onSuccess: () => {
          onSuccess?.();
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Your Profile</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="Student, Engineer, Designer, etc."
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            name="pronouns"
            value={formData.pronouns}
            onChange={handleChange}
            placeholder="e.g. she/her, they/them, he/him"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, State/Province, Country"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onSuccess?.()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

// Export the component
export { ProfileCard };