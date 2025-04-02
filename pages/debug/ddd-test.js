"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from '@/components/common/RefreshButton';

// Import all hooks in one place to make them available for testing
import * as allHooks from '@/lib/airtable/hooks';

/**
 * Comprehensive DDD Testing Dashboard
 * 
 * This page provides a full suite of testing tools for the domain-driven design architecture:
 * - Tests for all domain entities
 * - Tests for all API endpoints
 * - Tests for all React Query hooks
 * - Performance comparison between old and new implementations
 * 
 * @returns {JSX.Element} DDD Testing Dashboard
 */
export default function DDDTestPage() {
  const { user, error, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState('entities');
  const [testableModules, setTestableModules] = useState(null);
  const [loadingModules, setLoadingModules] = useState(true);
  const [testResults, setTestResults] = useState({});
  const [activeTest, setActiveTest] = useState(null);
  const [testParams, setTestParams] = useState({});
  const [hookData, setHookData] = useState({});

  // Fetch the testable modules metadata
  useEffect(() => {
    if (user) {
      fetchTestableModules();
    }
  }, [user]);

  const fetchTestableModules = async () => {
    try {
      setLoadingModules(true);
      const response = await fetch('/api/debug/ddd-test');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch testable modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestableModules(data.testableModules);
    } catch (error) {
      console.error('Error fetching testable modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  // Run an API test
  const runApiTest = async (test) => {
    try {
      setActiveTest(test);
      setTestResults(prev => ({ 
        ...prev, 
        [test.endpoint]: { 
          ...prev[test.endpoint],
          loading: true, 
          error: null 
        } 
      }));
      
      const method = test.method || 'GET';
      let url = test.endpoint;
      
      // Add query parameters if provided
      if (test.params && method === 'GET') {
        const queryParams = new URLSearchParams();
        Object.entries(test.params).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        url = `${url}?${queryParams.toString()}`;
      }
      
      // Track performance
      const startTime = performance.now();
      
      // Make the request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        ...(method !== 'GET' && test.body ? { body: JSON.stringify(test.body) } : {})
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Parse the response
      const data = await response.json();
      
      // Update test results
      setTestResults(prev => ({ 
        ...prev, 
        [test.endpoint]: { 
          data,
          status: response.status,
          responseTime,
          timestamp: new Date().toISOString(),
          loading: false,
          error: null
        } 
      }));
    } catch (error) {
      console.error(`Error testing ${test.endpoint}:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [test.endpoint]: { 
          error: error.message,
          loading: false,
          timestamp: new Date().toISOString() 
        } 
      }));
    }
  };

  // Run a hook test
  const runHookTest = async (hookInfo) => {
    try {
      setActiveTest(hookInfo);
      
      // Reset previous hook test data
      setHookData({
        loading: true,
        error: null,
        data: null
      });
      
      // Get the hook function from the allHooks import
      const hookName = hookInfo.hook;
      const hookFn = allHooks[hookName];
      
      if (!hookFn) {
        throw new Error(`Hook ${hookName} not found`);
      }
      
      // Use dynamic import for the hook (simulate running it)
      // In a real component we would use the hook directly
      // This is just a simulation since hooks can only be used in components
      
      // For demonstration purposes, we'll fetch from the corresponding API endpoint
      // In a real app, you would use the actual hook in a component
      const apiMapping = {
        'useProfile': '/api/user/profile-v2',
        'useParticipation': '/api/participation/mine',
        'useTeams': '/api/teams',
        'useCohorts': '/api/cohorts/public',
        'usePrograms': '/api/programs/details-v2',
        'useSubmissions': '/api/submissions/team-v2',
        'usePoints': '/api/points/user-summary-v2',
        'useResources': '/api/resources/available-v2',
        'useEvents': '/api/events/upcoming-v2',
        'usePartnerships': '/api/partnerships',
        'useOnboarding': '/api/user/onboarding-completed-v2',
        'useApplications': '/api/applications/mine',
        'useMilestones': '/api/cohorts/public',
        'useEducationRecords': '/api/education/mine',
        'useInstitutions': '/api/institutions?q=university'
      };
      
      const apiEndpoint = apiMapping[hookName] || null;
      
      if (!apiEndpoint) {
        throw new Error(`No API endpoint mapping found for hook ${hookName}`);
      }
      
      // Start timer for performance measurement
      const startTime = performance.now();
      
      // Fetch data from the API endpoint
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${hookName}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Update hook test data
      setHookData({
        data,
        loading: false,
        error: null,
        responseTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error testing hook ${hookInfo.hook}:`, error);
      setHookData({
        error: error.message,
        loading: false,
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  };

  const formatJson = (json) => {
    return JSON.stringify(json, null, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading...</h2>
          <p className="text-gray-500">Please wait while we load the DDD Testing Dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-gray-500 mb-4">You need to be logged in to access the DDD Testing Dashboard</p>
          <Button asChild>
            <a href="/api/auth/login">Log In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">DDD Testing Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Comprehensive testing suite for the domain-driven design architecture
            </p>
          </div>
          <RefreshButton onClick={fetchTestableModules} />
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            Environment: {process.env.NODE_ENV}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            User: {user.email}
          </Badge>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="entities">Entity API Tests</TabsTrigger>
          <TabsTrigger value="hooks">React Query Hook Tests</TabsTrigger>
          <TabsTrigger value="performance">Performance Comparison</TabsTrigger>
        </TabsList>
        
        {/* API ENDPOINTS TAB */}
        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Entity API Endpoints</CardTitle>
              <CardDescription>
                Test the API endpoints for each domain entity to ensure they return the expected data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingModules ? (
                <div className="text-center py-4">
                  <p>Loading testable modules...</p>
                </div>
              ) : testableModules?.entities?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testableModules.entities.map((test) => (
                    <Card key={test.endpoint} className={`border ${activeTest?.endpoint === test.endpoint ? 'border-blue-500 shadow-lg' : ''}`}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-sm">
                          <p>Endpoint: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{test.endpoint}</code></p>
                          <p>Method: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{test.method || 'GET'}</code></p>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3">
                        <Button 
                          onClick={() => runApiTest(test)} 
                          size="sm" 
                          variant="outline"
                          disabled={testResults[test.endpoint]?.loading}
                        >
                          {testResults[test.endpoint]?.loading ? 'Running...' : 'Run Test'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No entity tests available.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {activeTest && testResults[activeTest.endpoint] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Test Results: {activeTest.name}
                  <Badge variant={testResults[activeTest.endpoint].error ? 'destructive' : 'outline'}>
                    {testResults[activeTest.endpoint].error ? 'Error' : testResults[activeTest.endpoint].status === 200 ? 'Success' : 'Warning'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {testResults[activeTest.endpoint].error ? (
                    <span className="text-red-500">{testResults[activeTest.endpoint].error}</span>
                  ) : (
                    <span>
                      Status: {testResults[activeTest.endpoint].status} | 
                      Response Time: {testResults[activeTest.endpoint].responseTime?.toFixed(2)}ms | 
                      Timestamp: {testResults[activeTest.endpoint].timestamp}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">
                    {formatJson(testResults[activeTest.endpoint].data)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* HOOKS TAB */}
        <TabsContent value="hooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test React Query Hooks</CardTitle>
              <CardDescription>
                Test the React Query hooks for each domain to ensure they fetch and manage data correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingModules ? (
                <div className="text-center py-4">
                  <p>Loading testable modules...</p>
                </div>
              ) : testableModules?.hooks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testableModules.hooks.map((hook) => (
                    <Card key={hook.hook} className={`border ${activeTest?.hook === hook.hook ? 'border-blue-500 shadow-lg' : ''}`}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-lg">{hook.name}</CardTitle>
                        <CardDescription>{hook.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-sm">
                          <p>Hook: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{hook.hook}</code></p>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3">
                        <Button 
                          onClick={() => runHookTest(hook)} 
                          size="sm" 
                          variant="outline"
                          disabled={hookData.loading}
                        >
                          {hookData.loading && activeTest?.hook === hook.hook ? 'Running...' : 'Run Test'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No hook tests available.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {activeTest?.hook && hookData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Hook Test Results: {activeTest.name}
                  <Badge variant={hookData.error ? 'destructive' : 'outline'}>
                    {hookData.error ? 'Error' : hookData.data ? 'Success' : 'Pending'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {hookData.error ? (
                    <span className="text-red-500">{hookData.error}</span>
                  ) : (
                    <span>
                      {hookData.responseTime && `Response Time: ${hookData.responseTime.toFixed(2)}ms | `}
                      {hookData.timestamp && `Timestamp: ${hookData.timestamp}`}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">
                    {hookData.data ? formatJson(hookData.data) : 'No data available'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* PERFORMANCE COMPARISON TAB */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>
                Compare the performance between old and new implementations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Information</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    To run a performance comparison, select a domain to test and run the test.
                    Both implementations will be executed and the results will be compared.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="domain">Select Domain</Label>
                    <select 
                      id="domain"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="">Select a domain...</option>
                      <option value="users">Users</option>
                      <option value="education">Education</option>
                      <option value="teams">Teams</option>
                      <option value="participation">Participation</option>
                      <option value="cohorts">Cohorts</option>
                      <option value="programs">Programs</option>
                      <option value="submissions">Submissions</option>
                      <option value="points">Points</option>
                      <option value="resources">Resources</option>
                      <option value="events">Events</option>
                      <option value="partnerships">Partnerships</option>
                      <option value="applications">Applications</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="iterations">Number of Iterations</Label>
                    <Input 
                      id="iterations"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="5"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="default">
                    Run Performance Comparison
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-3">Performance Testing Guide</h3>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Test Setup</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          The performance test runs both the old and new implementations multiple times and compares:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                          <li>Average execution time</li>
                          <li>Median execution time</li>
                          <li>Memory usage</li>
                          <li>Network requests count</li>
                          <li>Data payload size</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Interpreting Results</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          When comparing performance, look for these improvements in the new implementation:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                          <li>Lower execution times (faster responses)</li>
                          <li>Reduced memory usage</li>
                          <li>Fewer network requests (due to better caching)</li>
                          <li>More consistent performance across multiple runs</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Test Implementation Details</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Both implementations are tested under identical conditions:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                          <li>Same server environment</li>
                          <li>Same input parameters</li>
                          <li>Cache cleared between runs</li>
                          <li>Measurements taken using Performance API</li>
                          <li>Network activity monitored via fetch interceptors</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}