import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

// A fixed configuration with baseURL that Auth0 v3 requires
const config = {
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  authorizationParams: {
    scope: 'openid profile email'
  },
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout'
  }
};

console.log('Auth0 config initialized with baseURL:', config.baseURL);

export default handleAuth({
  ...config,
  async callback(req, res) {
    try {
      // Custom callback logic to add extra information to the user session
      return await handleCallback(req, res, {
        ...config,
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