import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDashboard } from '@/contexts/DashboardContext';

/**
 * Example component showcasing the enhanced user lookup capabilities
 * Demonstrates how to use the findUser function from DashboardContext
 */
export default function UserLookupExample() {
  const { findUser } = useDashboard();
  const [searchInput, setSearchInput] = useState('');
  const [userResults, setUserResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle search by various identifiers
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine if input might be an email, Auth0 ID, or record ID
      const searchTerm = searchInput.trim();
      let identifiers = {};
      
      // Check if it's an email
      if (searchTerm.includes('@')) {
        identifiers.email = searchTerm;
      } 
      // Check if it might be an Auth0 ID
      else if (searchTerm.includes('|')) {
        identifiers.auth0Id = searchTerm;
      } 
      // Check if it might be a record ID
      else if (searchTerm.startsWith('rec')) {
        identifiers.contactId = searchTerm;
      }
      // Default to trying as email
      else {
        identifiers.email = searchTerm;
      }
      
      // Use the enhanced user lookup function with multi-path strategy
      const user = await findUser(identifiers, true); // true = fetch details like applications
      
      setUserResults(user);
    } catch (err) {
      console.error('Error looking up user:', err);
      setError(err.message || 'Failed to find user');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enhanced User Lookup</CardTitle>
        <CardDescription>
          Search for users by email, Auth0 ID, or record ID using our optimized lookup strategy
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="searchInput" className="sr-only">
                Search
              </Label>
              <Input
                id="searchInput"
                placeholder="Enter email, Auth0 ID, or record ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isLoading || !searchInput.trim()}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {error && (
            <div className="rounded bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}
          
          {userResults && (
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-2">Search Results</h3>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src={userResults.pictureUrl} />
                    <AvatarFallback>
                      {userResults.firstName ? userResults.firstName[0] : '?'}
                      {userResults.lastName ? userResults.lastName[0] : ''}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h4 className="font-medium">{userResults.firstName} {userResults.lastName}</h4>
                    <p className="text-sm text-muted-foreground">{userResults.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Contact ID:</p>
                    <p className="text-muted-foreground">{userResults.contactId}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Auth0 ID:</p>
                    <p className="text-muted-foreground">{userResults.auth0Id || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Onboarding Status:</p>
                    <p className="text-muted-foreground">{userResults.onboardingStatus || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Has Participation:</p>
                    <p className="text-muted-foreground">{userResults.hasParticipation ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                {userResults.applications && userResults.applications.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Applications ({userResults.applications.length})</h4>
                    <ul className="space-y-1 text-sm">
                      {userResults.applications.map(app => (
                        <li key={app.applicationId} className="text-muted-foreground">
                          {app.status || 'Unknown Status'} - {app.cohort || 'Unknown Cohort'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div>Using enhanced lookup with linked record traversal</div>
      </CardFooter>
    </Card>
  );
}