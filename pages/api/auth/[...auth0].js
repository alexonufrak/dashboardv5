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
      referralSource 
    } = req.query

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
      
      // Add referral source as user metadata
      if (referralSource) session.user.referralSource = referralSource;

      // Here you would typically update the user's metadata in Auth0
      // Log all the metadata we're capturing
      console.log("Updating user metadata:", {
        institution: session.user.institution,
        firstName,
        lastName,
        referralSource
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

