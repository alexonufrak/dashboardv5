import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

export default handleAuth({
  async callback(req, res) {
    try {
      // Custom callback logic to add extra information to the user session
      return await handleCallback(req, res, {
        afterCallback: (req, res, session) => {
          // Add any additional data to the session
          if (req.query.institution) {
            session.user.institution = {
              name: req.query.institution,
              id: req.query.institutionId,
              degreeType: req.query.degreeType || "",
              major: req.query.major || "",
              graduationYear: req.query.graduationYear || "",
              graduationSemester: req.query.graduationSemester || "",
            };
          }
          
          if (req.query.firstName) session.user.firstName = req.query.firstName;
          if (req.query.lastName) session.user.lastName = req.query.lastName;
          
          if (req.query.referralSource) session.user.referralSource = req.query.referralSource;
          if (req.query.cohortId) session.user.cohortId = req.query.cohortId;
          
          if (req.query.invitationToken) session.user.invitationToken = req.query.invitationToken;
          
          // Email mismatch check
          const verifiedEmail = req.query.email || req.query.login_hint;
          if (verifiedEmail && session.user.email && verifiedEmail !== session.user.email) {
            console.error(`Email mismatch: Verified ${verifiedEmail} but authenticated with ${session.user.email}`);
            session.user.emailMismatch = {
              verifiedEmail: verifiedEmail,
              authEmail: session.user.email
            };
          }
          
          return session;
        }
      });
    } catch (error) {
      console.error('Auth0 callback error:', error);
      res.status(error.status || 500).end(error.message);
    }
  }
});