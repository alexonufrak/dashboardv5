import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileData, useUpdateProfile, useCompositeProfile } from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { School, Mail, MapPin, Briefcase, Pencil } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0';

/**
 * ProfileCard Component - Refactored to use the new Airtable hooks
 * Displays a user's profile information with edit capability
 */
export default function ProfileCard() {
  const { user } = useUser();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Use the composite profile hook to fetch comprehensive user profile data
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError 
  } = useCompositeProfile({
    enabled: !!user?.sub,
    alwaysEnabled: true
  });
  
  // Handle loading state
  if (profileLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle error state
  if (profileError) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Profile</CardTitle>
          <CardDescription className="text-red-600">
            {profileError.message || 'Failed to load profile details'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Handle case where profile is not found
  if (!profile) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-700">Profile Not Found</CardTitle>
          <CardDescription className="text-orange-600">
            Your profile information could not be loaded.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage 
            src={profile.avatarUrl || user?.picture} 
            alt={profile.name} 
          />
          <AvatarFallback>
            {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <CardTitle>{profile.name}</CardTitle>
            
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <ProfileEditForm 
                  profile={profile} 
                  onSuccess={() => setIsEditOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <CardDescription className="mt-1">
            {profile.headline || profile.role || 'No headline set'}
          </CardDescription>
          
          {profile.pronouns && (
            <Badge variant="outline" className="mt-2">
              {profile.pronouns}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-6">
            {profile.bio}
          </p>
        )}
        
        <div className="space-y-3">
          {profile.email && (
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
              <span>{profile.email}</span>
            </div>
          )}
          
          {(profile.institutionName || profile.institution?.name || profile.institutionId) && (
            <div className="flex items-center text-sm">
              <School className="h-4 w-4 mr-3 text-muted-foreground" />
              <span>
                {profile.institutionName || 
                 profile.institution?.name || 
                 (profile.institution?.fields?.Name) || 
                 (profile.institutionId && !profile.institutionId.startsWith('rec') 
                  ? profile.institutionId 
                  : "Unknown Institution")}
              </span>
            </div>
          )}
          
          {profile.location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
              <span>{profile.location}</span>
            </div>
          )}
          
          {(profile.major || profile.majorName || profile.education?.major || profile.graduationYear || profile.gradYear) && (
            <div className="flex items-center text-sm">
              <Briefcase className="h-4 w-4 mr-3 text-muted-foreground" />
              <span>
                {profile.majorName || profile.major || profile.education?.major}
                {(profile.majorName || profile.major || profile.education?.major) && 
                 (profile.graduationYear || profile.gradYear) && ' • '}
                {(profile.graduationYear || profile.gradYear) && 
                 `Class of ${profile.graduationYear || profile.gradYear}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Profile Edit Form Component
function ProfileEditForm({ profile, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: profile.name || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    pronouns: profile.pronouns || '',
    location: profile.location || '',
    avatarUrl: profile.avatarUrl || '',
    // Include education and institution fields for better record updating
    educationId: profile?.education?.id || profile?.educationId || null,
    institutionId: profile?.institution?.id || profile?.institutionId || null,
    contactId: profile?.contactId || null
  });
  
  // Use the mutation hook for profile updates with proper debugging
  const updateProfileMutation = useUpdateProfile();
  
  // Log the available profile data to debug
  useEffect(() => {
    if (profile) {
      console.log('ProfileEditForm received profile:', {
        institutionName: profile.institutionName,
        institution: profile.institution,
        educationId: profile.educationId,
        contactId: profile.contactId
      });
    }
  }, [profile]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Submitting profile update with data:', formData);
      
      await updateProfileMutation.mutateAsync({
        auth0Id: profile.auth0Id, 
        contactId: profile.contactId, // Include contactId for more reliable updates
        updateData: formData
      });
      
      // Invalidate related queries to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['contact', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['education', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'composed'] });
      
      onSuccess?.();
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
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
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
          <Label htmlFor="avatarUrl">Profile Picture URL</Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleChange}
            placeholder="https://..."
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
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}