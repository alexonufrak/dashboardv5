import { initAuth0 } from "@auth0/nextjs-auth0"

export default initAuth0({
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  clockTolerance: 60,
  httpTimeout: 5000,
  authorizationParams: {
    scope: "openid profile email",
  },
  routes: {
    callback: "/api/auth/callback",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours in seconds
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days in seconds
  },
})

