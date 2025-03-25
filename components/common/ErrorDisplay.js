"use client"

import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, RotateCcw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/**
 * Reusable error display component with detailed error information and recovery options
 * 
 * @param {Object} props
 * @param {string} props.title - The error title
 * @param {string} props.message - The main error message to display
 * @param {Object} props.error - The error object (optional)
 * @param {string} props.errorCode - An error code to display (optional)
 * @param {string} props.errorDetails - Additional error details (optional)
 * @param {string} props.redirectUrl - URL to redirect users to (defaults to /dashboard)
 * @param {string} props.redirectLabel - Label for the redirect button
 * @param {Function} props.onRetry - Function to call when the retry button is clicked
 * @param {Function} props.onRefresh - Function to call when the refresh button is clicked
 * @param {boolean} props.compact - Whether to display a compact version of the error
 * @param {React.ReactNode} props.children - Additional content to display
 */
const ErrorDisplay = ({ 
  title = "Something went wrong",
  message = "An error occurred while processing your request.",
  error = null,
  errorCode = null,
  errorDetails = null,
  redirectUrl = "/dashboard",
  redirectLabel = "Return to Dashboard",
  onRetry = null,
  onRefresh = null,
  compact = false,
  children
}) => {
  const timestamp = new Date().toLocaleString();
  const errorMessage = error?.message || error?.toString() || message;
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  // Compact version for inline errors
  if (compact) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription>
          {errorMessage}
          <div className="mt-3 space-x-2">
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 px-2"
                onClick={onRetry}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-7 px-2"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Full error display
  return (
    <Card className="border-destructive/30 dark:border-destructive/30 shadow-md">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-t-lg">
        <div className="flex flex-row items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-2">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Error Details</AlertTitle>
          <AlertDescription>
            {errorMessage}
            {errorCode && (
              <div className="text-xs mt-1 font-mono">Error code: {errorCode}</div>
            )}
            <div className="text-xs mt-1 opacity-70">Occurred at: {timestamp}</div>
          </AlertDescription>
        </Alert>
        
        {children ? (
          <div className="mb-6">{children}</div>
        ) : (
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
                    Return to the <Link href={redirectUrl} className="text-primary hover:underline font-medium">
                      {redirectLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {errorDetails && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="error-details" className="border-neutral-200 dark:border-neutral-800">
              <AccordionTrigger className="text-sm font-medium">
                Technical Error Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-3 text-xs overflow-auto max-h-[200px] font-mono">
                  {errorDetails}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 pb-6">
        <Button 
          variant="default" 
          className="w-full sm:w-auto" 
          onClick={handleRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Page
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full sm:w-auto" 
          asChild
        >
          <Link href={redirectUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {redirectLabel}
          </Link>
        </Button>
        
        {onRetry && (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto" 
            onClick={onRetry}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ErrorDisplay;