import { getCompleteUserProfile } from "../../../lib/userProfile"
import { updateUserProfile } from "../../../lib/airtable"
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0"

async function handlerImpl(req, res) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // Auth0 v3 session handling
    const session = await auth0.getSession(req, res)
    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
  
    if (req.method === "GET") {
      // Check if minimal mode is requested (for onboarding flow)
      const minimal = req.query.minimal === 'true';
      
      // Set shorter timeout for minimal mode
      const timeoutDuration = minimal ? 3000 : 9000;
      
      // Add timeout control to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timed out")), timeoutDuration)
      );
      
      try {
        // For minimal mode, use a special function or add a parameter
        let profilePromise;
        
        if (minimal) {
          console.log("Fetching minimal profile with cohorts for onboarding");
          // Fetch essential fields plus cohorts for onboarding
          profilePromise = getCompleteUserProfile(session.user, { minimal: true });
        } else {
          profilePromise = getCompleteUserProfile(session.user);
        }
        
        // Race the profile fetch against a timeout
        const profile = await Promise.race([
          profilePromise,
          timeoutPromise
        ]);
        
        if (!profile) {
          console.log("No profile data returned, sending minimal response");
          return res.status(404).json({
            auth0Id: session.user.sub,
            email: session.user.email,
            name: session.user.name,
            picture: session.user.picture,
            isProfileComplete: false,
            _meta: {
              error: "No profile data found",
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        console.log(`User profile fetched in ${processingTime}ms`);
        
        // Set cache control headers - cache for 5 minutes (300 seconds)
        // Client caching for 1 minute, CDN/edge caching for 5 minutes
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        
        // Include processing metadata in response
        return res.status(200).json({
          profile: profile, // Wrap the profile in a profile key for consistency
          _meta: {
            processingTime,
            timestamp: new Date().toISOString()
          }
        });
      } catch (profileError) {
        console.error("Error fetching complete profile:", profileError);
        
        // Return a basic profile with auth0 data as fallback, wrapped in a profile key
        return res.status(200).json({
          profile: {
            auth0Id: session.user.sub,
            email: session.user.email,
            name: session.user.name,
            picture: session.user.picture,
            isProfileComplete: false,
          },
          _meta: {
            error: profileError.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    } else if (req.method === "PUT") {
      const { contactId, ...updateData } = req.body

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required for updates" })
      }

      // Check if major ID is valid - it must be an Airtable record ID format or null/undefined
      if (updateData.major !== undefined && updateData.major !== null) {
        if (typeof updateData.major === 'string') {
          // Log the received major value for debugging
          console.log(`Major field received in update: "${updateData.major}" (${typeof updateData.major})`);
          
          // Validate the major field is an Airtable record ID (usually starts with "rec")
          if (!updateData.major.startsWith('rec')) {
            console.warn(`Invalid major ID format received: ${updateData.major}`);
            return res.status(400).json({ 
              error: "Invalid major ID format. Expected record ID but received text value.",
              receivedValue: updateData.major
            });
          }
        } else {
          // If it's not a string or null, it's invalid
          console.warn(`Invalid major field type received: ${typeof updateData.major}`);
          return res.status(400).json({
            error: "Invalid major field type. Expected string record ID or null.",
            receivedType: typeof updateData.major
          });
        }
      } else {
        // Handle explicit null/undefined case (clearing the field)
        console.log("Major field is null or undefined - will be cleared");
      }

      // Map fields to Airtable field names
      const airtableData = {
        FirstName: updateData.firstName,
        LastName: updateData.lastName,
        DegreeType: updateData.degreeType,
        // Use programId (the ID reference) instead of text value for Major
        Major: updateData.major,  // This should be a record ID from the Programs table
        GraduationYear: updateData.graduationYear,
        GraduationSemester: updateData.graduationSemester,
        ReferralSource: updateData.referralSource,
        InstitutionId: updateData.institutionId,
        educationId: updateData.educationId, // Include education record ID for updating
      }
      
      // Debug the data being sent
      console.log("Updating user profile with data:", JSON.stringify(airtableData, null, 2));

      try {
        // Add timeout for update operation
        const updateTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Profile update timed out")), 9000)
        );
        
        // Race the update against a timeout
        const updatedProfile = await Promise.race([
          updateUserProfile(contactId, airtableData),
          updateTimeoutPromise
        ]);
        
        // Return a simplified profile if complete profile fetch fails
        try {
          const completeProfile = await Promise.race([
            getCompleteUserProfile(session.user),
            new Promise((_, reject) => setTimeout(() => 
              reject(new Error("Complete profile fetch timed out")), 5000))
          ]);
          
          return res.status(200).json(completeProfile);
        } catch (fetchError) {
          console.error("Error fetching complete profile after update:", fetchError);
          
          // Return basic updated profile info
          return res.status(200).json({
            contactId,
            ...updateData,
            auth0Id: session.user.sub,
            email: session.user.email,
            _meta: {
              partial: true,
              error: "Partial profile returned - complete profile fetch failed",
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (updateError) {
        console.error("Error updating profile:", updateError);
        return res.status(500).json({ 
          error: "Failed to update profile", 
          message: updateError.message 
        });
      }
    } else {
      return res.status(405).json({ error: "Method not allowed" })
    }
  } catch (error) {
    console.error("Error in profile API:", error);
    // Provide basic user data from auth0 even in error case, wrapped in profile key
    if (req.method === "GET" && error.session && error.session.user) {
      return res.status(200).json({
        profile: {
          auth0Id: error.session.user.sub,
          email: error.session.user.email,
          name: error.session.user.name,
          picture: error.session.user.picture,
          isProfileComplete: false,
        },
        _meta: {
          error: error.message,
          timestamp: new Date().toISOString(),
          fallback: true
        }
      });
    }
    return res.status(500).json({ error: "Internal server error", message: error.message })
  }
}

// In Auth0 v3, we use withApiAuthRequired to protect API routes
export default async function handler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return handlerImpl(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

