import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, LogOut } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      timestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console - could be extended to an error reporting service
    console.error('Dashboard Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRefresh = () => {
    // Reload the current page
    window.location.reload();
  }

  handleTryRecover = () => {
    // Clear error state and attempt to recover
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleLogout = () => {
    // Redirect to Auth0 v4 logout URL
    window.location.href = '/auth/logout';
  }

  formatComponentStack(componentStack) {
    if (!componentStack) return null;
    
    return componentStack
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, index) => (
        <div key={index} className="py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
          {line}
        </div>
      ));
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, timestamp } = this.state;
      const errorMessage = error?.toString() || 'Unknown error';
      const componentStack = this.formatComponentStack(errorInfo?.componentStack);
      
      return (
        <div className="container max-w-3xl my-8 px-4">
          <Card className="border-destructive/30 dark:border-destructive/30 shadow-md">
            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-t-lg">
              <div className="flex flex-row items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-xl">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 pb-2">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Error Details</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                  {timestamp && (
                    <div className="text-xs mt-2 opacity-70">Occurred at: {new Date(timestamp).toLocaleString()}</div>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Troubleshooting Steps</h3>
                  <div className="space-y-2 pl-1">
                    <div className="flex items-start gap-2">
                      <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                        <RefreshCw className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        Try refreshing the page - this often resolves temporary issues
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                        <ArrowLeft className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        Return to the <Link href="/dashboard" className="text-primary hover:underline font-medium">main dashboard</Link>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                        <LogOut className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        Try logging out and logging back in
                      </div>
                    </div>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="error-details" className="border-neutral-200 dark:border-neutral-800">
                    <AccordionTrigger className="text-sm font-medium">
                      Technical Error Details
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-3 text-xs overflow-auto max-h-[200px] font-mono">
                        {componentStack || "No component stack available"}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 pb-6">
              <Button 
                variant="default" 
                className="w-full sm:w-auto" 
                onClick={this.handleRefresh}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                asChild
              >
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/10" 
                onClick={this.handleTryRecover}
              >
                Try to Recover
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;