import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";

const afterCallback = async (req: any, res: any, session: any, state: any) => {
  try {
    console.log("Auth0 callback received with query params:", req.query);
    
    const { 
      institution, 
      institutionId, 
      degreeType, 
      major, 
      graduationYear, 
      firstName, 
      lastName,
      referralSource,
      cohortId,
      email, // User's email address from query params
      contactId, // Airtable contact ID if available
      educationId, // Airtable education ID if available
      airtableId, // Legacy parameter for contactId
      invitationToken // Team invitation token if coming from an invite
    } = req.query;

    // The verified email might come from query parameters or login_hint
    const verifiedEmail = email || req.query.login_hint;
    
    // Check if there's a verified email to compare against
    if (verifiedEmail && session.user.email && verifiedEmail !== session.user.email) {
      console.error(`Email mismatch: Verified ${verifiedEmail} but authenticated with ${session.user.email}`);
      // Add a flag to indicate email mismatch - this will be checked on the frontend
      session.user.emailMismatch = {
        verifiedEmail: verifiedEmail,
        authEmail: session.user.email
      };
    }

    // Add metadata to the session regardless of whether institution is provided
    // This ensures we always capture metadata even when going straight to Google auth
    
    // Process institution info if available
    if (institution && institutionId) {
      session.user.institution = {
        name: institution,
        id: institutionId,
        degreeType: degreeType || "",
        major: major || "",
        graduationYear: graduationYear || "",
      }
    }
    
    // Add personal information if available
    if (firstName) session.user.firstName = firstName;
    if (lastName) session.user.lastName = lastName;
    
    // Add referral source and cohortId as user metadata
    if (referralSource) session.user.referralSource = referralSource;
    if (cohortId) session.user.cohortId = cohortId;
    
    // Save invitation token if provided
    if (invitationToken) session.user.invitationToken = invitationToken;

    // Initialize session metadata - ensure onboarding is properly set up
    session.user.user_metadata = {
      ...session.user.user_metadata,
      onboarding: ['register'],
      onboardingCompleted: false, // Explicitly set to false to ensure checklist shows for new users
      ...(cohortId ? { selectedCohort: cohortId } : {})
    };

    // Update user metadata in Auth0 using Management API
    try {
      // Import the Auth0 module
      const auth0Module = await import('../../../lib/auth0');
      
      // This is a fix for updated auth0 module - using default export
      const auth0 = auth0Module.default;
      const userId = session.user.sub;
      
      // Get the current date for timestamp
      const now = new Date().toISOString();
      
      // Prepare user metadata updates
      const metadata = {
        // Personal info
        firstName: firstName || session.user.given_name || '',
        lastName: lastName || session.user.family_name || '',
        
        // Institution info
        ...(institution ? { institution } : {}),
        ...(institutionId ? { institutionId } : {}),
        ...(degreeType ? { degreeType } : {}),
        ...(graduationYear ? { graduationYear } : {}),
        ...(major ? { major } : {}),
        
        // Additional metadata
        onboarding: ['register'], // First step is always completed for new users
        ...(referralSource ? { referralSource } : {}),
        ...(cohortId ? { selectedCohort: cohortId } : {}),
        ...(invitationToken ? { invitationToken } : {}),
        
        // Explicitly set onboardingCompleted to false for new users
        // This ensures the checklist will show on first login
        onboardingCompleted: false,
        
        // Store the verified email in metadata for future reference
        ...(verifiedEmail ? { verifiedEmail } : {}),
        
        // Store Airtable IDs in metadata if available
        ...(contactId ? { contactId } : {}),
        ...(airtableId ? { airtableId } : {}),
        ...(educationId ? { educationId } : {}),
        
        // Add timestamps
        lastLogin: now,
        ...(session.user.user_metadata?.createdAt ? {} : { createdAt: now })
      };
      
      console.log("Updating user metadata in Auth0:", metadata);
      
      // Get direct management API token for Auth0
      const token = await auth0.getDirectAuth0Token();
      if (token) {
        const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
        
        // Use Axios to make a direct API call
        const axios = (await import('axios')).default;
        const updateResponse = await axios({
          method: 'PATCH',
          url: `https://${domain}/api/v2/users/${userId}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: {
            user_metadata: metadata
          }
        });
        
        console.log("Auth0 metadata update response status:", updateResponse.status);
      } else {
        console.error("Failed to get Auth0 token for metadata update");
      }
      
      console.log("Successfully updated user metadata in Auth0");
    } catch (err: any) {
      console.error("Error updating Auth0 user metadata:", err);
      console.error("Error details:", err.stack);
    }
    
    // Log all the metadata we're capturing
    console.log("User session data:", {
      email: session.user.email,
      sub: session.user.sub,
      institution: session.user.institution,
      firstName: session.user.firstName || firstName,
      lastName: session.user.lastName || lastName,
      referralSource,
      cohortId,
      verifiedEmail,
      contactId,
      airtableId,
      educationId,
      invitationToken,
      metadata: session.user.user_metadata
    });
    
    // Get the user's Airtable contact ID - either from query params or look up in Airtable
    let userContactId = contactId || airtableId;
    
    if (!userContactId) {
      try {
        // Import the user profile and Airtable utils
        const { getUserByEmail, createRecord, updateRecord, lookupInstitutionByEmail } = await import('@/lib/airtableClient');
        
        // Try to find an existing Airtable record for this user by email
        const existingUser = await getUserByEmail(session.user.email);
        if (existingUser && existingUser.contactId) {
          userContactId = existingUser.contactId;
          console.log(`Found existing Airtable contact for ${session.user.email}: ${userContactId}`);
          
          // Update the session with the found contactId
          session.user.contactId = userContactId;
        } else {
          // Create a new user record in Airtable if none exists
          console.log(`No existing Airtable contact found for ${session.user.email}, creating one`);
          
          // Prepare contact data
          const contactData: any = {
            'Email': session.user.email,
            'Auth0ID': session.user.sub
          };
          
          // Add optional fields if available
          if (firstName || session.user.given_name) contactData['First Name'] = firstName || session.user.given_name;
          if (lastName || session.user.family_name) contactData['Last Name'] = lastName || session.user.family_name;
          
          // If we have a verified email, look up institution by domain
          if (!institutionId && session.user.email) {
            const suggestedInstitution = await lookupInstitutionByEmail(session.user.email);
            if (suggestedInstitution && suggestedInstitution.id) {
              contactData['Institution'] = [suggestedInstitution.id];
            }
          }
          
          try {
            // Create the contact record in Airtable
            const newContact = await createRecord('CONTACTS', contactData);
            userContactId = newContact.id;
            console.log(`Created new Airtable contact for ${session.user.email}: ${userContactId}`);
            
            // Update the session with the new contactId
            session.user.contactId = userContactId;
            
            // Create education record if we have institution data
            if (institutionId || (degreeType && graduationYear)) {
              const educationData: any = {
                'Contact': [userContactId] // Link to contact
              };
              
              // Add optional fields if available
              if (institutionId) educationData['Institution'] = [institutionId];
              if (degreeType) educationData['Degree Type'] = degreeType;
              if (graduationYear) educationData['Graduation Year'] = graduationYear;
              if (major) educationData['Major'] = [major]; // Major needs to be a record ID array
              
              // Create the education record
              const newEducation = await createRecord('EDUCATION', educationData);
              const newEducationId = newEducation.id;
              console.log(`Created new Airtable education record: ${newEducationId}`);
              
              // Update the session with the new educationId
              session.user.educationId = newEducationId;
              
              // Link education back to contact
              await updateRecord('CONTACTS', userContactId, {
                'Education': [newEducationId]
              });
            }
          } catch (createError) {
            console.error("Error creating Airtable records:", createError);
          }
        }
      } catch (lookupError) {
        console.error("Error looking up or creating Airtable user:", lookupError);
      }
    }

    // Handle invitation acceptance if there's a token and we have a contact ID
    if (invitationToken && userContactId) {
      try {
        console.log("Processing team invitation acceptance with token:", invitationToken);
        
        // Try to import team invitation acceptance function
        try {
          const { acceptTeamInvitation } = await import('@/lib/airtableClient');
          
          // Accept the invitation if the function exists
          if (typeof acceptTeamInvitation === 'function') {
            const acceptResult = await acceptTeamInvitation(invitationToken as string, userContactId as string);
            
            if (acceptResult && acceptResult.success) {
              console.log("Successfully accepted team invitation:", acceptResult);
              
              // Store result in session for the frontend to access
              session.user.teamInviteAccepted = {
                success: true,
                team: acceptResult.invitation?.team || null
              };
            } else {
              console.error("Failed to accept team invitation:", acceptResult?.error || "Unknown error");
              
              // Store error in session for the frontend to handle
              session.user.teamInviteAccepted = {
                success: false,
                error: acceptResult?.error || "Failed to accept team invitation"
              };
            }
          } else {
            // Function not available yet
            console.log("Team invitation acceptance function not implemented");
            
            // Store a placeholder in session for the frontend
            session.user.teamInviteAccepted = {
              success: true,
              pendingProcess: true,
              message: "Invitation token received, will be processed on dashboard load",
              token: invitationToken,
              contactId: userContactId
            };
          }
        } catch (importError) {
          console.error("Error importing team invitation acceptance function:", importError);
          
          // Store a placeholder in session for the frontend
          session.user.teamInviteAccepted = {
            success: true,
            pendingProcess: true,
            message: "Invitation token received, will be processed on dashboard load",
            token: invitationToken,
            contactId: userContactId
          };
        }
      } catch (error: any) {
        console.error("Error accepting team invitation:", error);
        
        // Store error in session
        session.user.teamInviteAccepted = {
          success: false,
          error: error.message
        };
      }
    }

    return session;
  } catch (error: any) {
    console.error("Error in afterCallback:", error);
    throw error;
  }
};

export default handleAuth({
  async callback(req: NextApiRequest, res: NextApiResponse) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error: any) {
      console.error("Error during Auth0 callback:", error);
      res.status(error.status || 500).end(error.message);
    }
  },
});