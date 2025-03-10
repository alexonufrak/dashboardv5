import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Alert, Button } from '@heroui/react';
import { XCircleIcon } from '@heroui/icons/solid';

export default function EmailMismatchAlert() {
  const { user } = useUser();
  const [mismatchDetails, setMismatchDetails] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has email mismatch in their session
    if (user && user.emailMismatch) {
      setMismatchDetails(user.emailMismatch);
      setIsVisible(true);
    }
  }, [user]);

  if (!isVisible || !mismatchDetails) {
    return null;
  }

  const handleLogout = () => {
    // Redirect to logout
    window.location.href = '/api/auth/logout';
  };

  return (
    <Alert 
      className="mb-6 mx-auto max-w-4xl"
      color="danger"
      title="Authentication Error"
      startContent={<XCircleIcon className="h-5 w-5" />}
    >
      <div className="space-y-3">
        <p>
          <strong>Email mismatch detected:</strong> You verified with{' '}
          <span className="font-semibold">{mismatchDetails.verifiedEmail}</span> but authenticated with{' '}
          <span className="font-semibold">{mismatchDetails.authEmail}</span>.
        </p>
        <p>
          This can happen if you use different email addresses with your Google account.
          Please sign out and log in with the correct address.
        </p>
        <div className="flex justify-end">
          <Button 
            color="danger" 
            onPress={handleLogout}
            className="mt-2"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Alert>
  );
}