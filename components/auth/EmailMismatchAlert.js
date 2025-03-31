import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Alert component shown when user signs in with a different email than they verified
 */
export default function EmailMismatchAlert({ emailMismatch }) {
  const [dismissed, setDismissed] = useState(false);
  const [mismatchData, setMismatchData] = useState(emailMismatch);
  
  // On mount, check if there's a stored verified email in localStorage
  // This is a backup mechanism in case the email isn't passed through Auth0
  useEffect(() => {
    // Only run this if we don't already have mismatch data
    if (!emailMismatch) {
      const storedEmail = typeof window !== 'undefined' 
        ? localStorage.getItem('xFoundry_verifiedEmail') 
        : null;
        
      if (storedEmail) {
        // Get the current user email from the URL or session
        const currentAuth0Email = window.location.pathname.includes('/dashboard') 
          ? JSON.parse(document.cookie.split('; ')
              .find(row => row.startsWith('user='))
              ?.split('=')[1] || '{}')?.email
          : null;
          
        // If we have both emails and they don't match, create mismatch data
        if (currentAuth0Email && storedEmail !== currentAuth0Email) {
          setMismatchData({
            verifiedEmail: storedEmail,
            authEmail: currentAuth0Email
          });
        }
      }
    }
  }, [emailMismatch]);

  if ((!mismatchData && !emailMismatch) || dismissed) {
    return null;
  }

  const { verifiedEmail, authEmail } = mismatchData || emailMismatch || {};
  
  if (!verifiedEmail || !authEmail) {
    return null;
  }

  // Create URL for sign out, then sign in with correct email
  const handleCorrectEmail = () => {
    // Updated paths for Auth0 v4
    const redirectUrl = encodeURIComponent(`/auth/login?login_hint=${encodeURIComponent(verifiedEmail)}`);
    window.location.href = `/auth/logout?returnTo=${redirectUrl}`;
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold mb-2">Email Mismatch Detected</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          You verified with <strong>{verifiedEmail}</strong> but signed in with <strong>{authEmail}</strong>.
          To maintain consistent access to your account, please use the same email address.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="destructive" onClick={handleCorrectEmail}>
            Sign in with {verifiedEmail}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Continue anyway
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}