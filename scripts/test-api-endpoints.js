/**
 * Simple utility script to test API endpoint responses
 * Run this from the browser console when logged in to test API response formats
 */

// Function to test the team API endpoint
async function testTeamEndpoint(teamId) {
  try {
    console.log('Testing GET /api/teams/{teamId}');
    const response = await fetch(`/api/teams/${teamId}`);
    const data = await response.json();
    
    console.log('Response format:');
    console.log('- Has .team property:', data.team !== undefined);
    console.log('- Response structure:', data);
    
    // Extract team data using our utility
    const teamData = data.team ? data.team : data;
    console.log('- Extracted team data:', teamData);
    
    return data;
  } catch (error) {
    console.error('Error testing team endpoint:', error);
  }
}

// Usage instructions
console.log(`
=== API Response Testing Utility ===
To test the team API endpoint:
1. Navigate to the teams page in the dashboard
2. Open your browser console
3. Run: testTeamEndpoint('<teamId>')
4. Check the console output to see the response format
`);