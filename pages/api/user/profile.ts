import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth0ManagementClient } from '@/lib/auth0';
import { getCompleteUserProfile, updateUserProfileData } from '@/lib/userProfile';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    
    // For GET request - return profile data
    if (req.method === 'GET') {
      try {
        // Use the new integrated function to get complete profile from Airtable and Auth0
        const profile = await getCompleteUserProfile(session.user);
        return res.status(200).json(profile);
      } catch (profileError) {
        console.error('Error fetching complete profile:', profileError);
        
        // Fallback to Auth0-only profile if Airtable integration fails
        const auth0 = await getAuth0ManagementClient();
        const userResponse = await auth0.users.get({ id: userId });
        const user = userResponse?.data || {};
        
        // Extract profile data from user metadata and identity
        const metadata = user.user_metadata || {};
        
        const fallbackProfile = {
          id: userId,
          email: session.user.email,
          firstName: metadata.firstName || session.user.given_name || '',
          lastName: metadata.lastName || session.user.family_name || '',
          institutionName: metadata.institution || '',
          institution: metadata.institutionId ? {
            id: metadata.institutionId,
            name: metadata.institution || ''
          } : null,
          contactId: metadata.contactId || null,
          educationId: metadata.educationId || null,
          degreeType: metadata.degreeType || '',
          major: metadata.major || '',
          programId: metadata.programId || metadata.major || '',
          graduationYear: metadata.graduationYear || '',
          headshot: session.user.picture || null,
          showMajor: true,
          needsInstitutionConfirm: !metadata.institutionId && !metadata.institution,
          isProfileComplete: false
        };
        
        return res.status(200).json(fallbackProfile);
      }
    }
    
    // For PUT request - update profile data
    if (req.method === 'PUT') {
      const updateData = req.body;
      
      // Validate required fields
      if (!updateData) {
        return res.status(400).json({ error: 'No update data provided' });
      }

      if (!updateData.contactId) {
        return res.status(400).json({ error: 'Contact ID is required for updates' });
      }
      
      // 1. Update the Auth0 user metadata to keep both systems in sync
      const auth0 = await getAuth0ManagementClient();
      
      // Prepare metadata update for Auth0
      const metadataUpdate = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        degreeType: updateData.degreeType,
        major: updateData.major,
        programId: updateData.programId || updateData.major,
        graduationYear: updateData.graduationYear,
        contactId: updateData.contactId, // Keep track of Airtable record ID
        educationId: updateData.educationId,
        institutionId: updateData.institutionId || updateData.institution?.id,
        institution: updateData.institution?.name || updateData.institutionName
      };
      
      // Update user metadata in Auth0
      await auth0.users.update(
        { id: userId },
        { user_metadata: metadataUpdate }
      );
      
      // 2. Update Airtable records using our integrated function
      try {
        const updatedProfile = await updateUserProfileData(userId, updateData.contactId, updateData);
        return res.status(200).json(updatedProfile);
      } catch (airtableError) {
        console.error('Error updating Airtable profile:', airtableError);
        
        // If Airtable update fails, return what we have from Auth0
        return res.status(200).json({
          id: userId,
          ...updateData,
          airtableError: 'Failed to update Airtable record'
        });
      }
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Profile API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);