import { handleProfile } from '@auth0/nextjs-auth0';

// Required configuration for Auth0 v3
const config = {
  baseURL: process.env.AUTH0_BASE_URL || 'https://hub.xfoundry.org',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET
};

console.log('Auth0 profile handler config with baseURL:', config.baseURL);

export default function profileHandler(req, res) {
  try {
    return handleProfile(req, res, config);
  } catch (error) {
    console.error('Profile handler error:', error);
    res.status(error.status || 500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}