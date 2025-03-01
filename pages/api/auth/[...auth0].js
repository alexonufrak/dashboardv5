import { handleAuth, handleCallback } from "@auth0/nextjs-auth0"

const afterCallback = async (req, res, session, state) => {
  try {
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
      email, // New parameter that replaces login_hint
      contactId, // Airtable contact ID if available
      educationId, // Airtable education ID if available
      airtableId // Legacy parameter for contactId
    } = req.query

    // The verified email might come from either email or login_hint
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

    if (institution && institutionId) {
      session.user.institution = {
        name: institution,
        id: institutionId,
        degreeType: degreeType || "",
        major: major || "",
        graduationYear: graduationYear || "",
      }
      
      // Add personal information
      if (firstName) session.user.firstName = firstName;
      if (lastName) session.user.lastName = lastName;
      
      // Add referral source and cohortId as user metadata
      if (referralSource) session.user.referralSource = referralSource;
      if (cohortId) session.user.cohortId = cohortId;

      // Initialize onboarding steps - first step is always completed
      session.user.user_metadata = {
        ...session.user.user_metadata,
        onboarding: ['register'],
        ...(cohortId ? { selectedCohort: cohortId } : {})
      };

      // Update user metadata in Auth0 using Management API
      try {
        const auth0Management = await import('../../../lib/auth0').then(mod => mod.auth0ManagementClient());
        const userId = session.user.sub;
        
        // Prepare user metadata updates
        const metadata = {
          onboarding: ['register'], // First step is always completed for new users
          ...(referralSource ? { referralSource } : {}),
          ...(cohortId ? { selectedCohort: cohortId } : {}),
          // Store the verified email in metadata for future reference
          ...(verifiedEmail ? { verifiedEmail: verifiedEmail } : {}),
          // Store Airtable IDs in metadata if available
          ...(contactId ? { contactId } : {}),
          ...(airtableId ? { airtableId } : {}),
          ...(educationId ? { educationId } : {})
        };
        
        // Update user metadata in Auth0
        await auth0Management.updateUserMetadata({ id: userId }, metadata);
        
        console.log("Updated user metadata in Auth0:", metadata);
      } catch (err) {
        console.error("Error updating Auth0 user metadata:", err);
      }
      
      // Log all the metadata we're capturing
      console.log("User session data:", {
        institution: session.user.institution,
        firstName,
        lastName,
        referralSource,
        cohortId,
        verifiedEmail,
        contactId,
        airtableId,
        educationId,
        metadata: session.user.user_metadata
      });
    }

    return session
  } catch (error) {
    console.error("Error in afterCallback:", error)
    throw error
  }
}

export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback })
    } catch (error) {
      console.error("Error during Auth0 callback:", error)
      res.status(error.status || 500).end(error.message)
    }
  },
})

