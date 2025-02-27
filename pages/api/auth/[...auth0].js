import { handleAuth, handleCallback } from "@auth0/nextjs-auth0"

const afterCallback = async (req, res, session, state) => {
  try {
    const { institution, institutionId, degreeType, major, graduationYear } = req.query

    if (institution && institutionId) {
      session.user.institution = {
        name: institution,
        id: institutionId,
        degreeType: degreeType || "",
        major: major || "",
        graduationYear: graduationYear || "",
      }

      // Here you would typically update the user's metadata in Auth0
      // This is just a placeholder for that operation
      console.log("Updating user metadata:", session.user.institution)
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

