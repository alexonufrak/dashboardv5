# Error Handling in xFoundry Dashboard

This document provides guidelines for consistent error handling across the xFoundry dashboard application.

## Error Components

### 1. DashboardErrorBoundary

A React Error Boundary component that catches errors in components, preventing the entire UI from crashing.

**Location:** `/components/dashboard/DashboardErrorBoundary.js`

**Usage:**
```jsx
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';

function Dashboard() {
  return (
    <DashboardErrorBoundary>
      {/* Your dashboard components */}
    </DashboardErrorBoundary>
  );
}
```

### 2. ErrorDisplay

A reusable error display component for showing detailed error information with recovery options.

**Location:** `/components/common/ErrorDisplay.js`

**Usage:**
```jsx
import ErrorDisplay from '@/components/common/ErrorDisplay';

function MyComponent() {
  const [error, setError] = useState(null);
  
  const handleRetry = () => {
    // Retry logic here
    setError(null);
    fetchData();
  };
  
  if (error) {
    return (
      <ErrorDisplay
        title="Data Fetch Error"
        message={error.message}
        error={error}
        onRetry={handleRetry}
      />
    );
  }
  
  // Regular component rendering
}
```

**Props:**
- `title` - The error title (default: "Something went wrong")
- `message` - The main error message to display
- `error` - The error object (optional)
- `errorCode` - An error code to display (optional)
- `errorDetails` - Additional error details (optional)
- `redirectUrl` - URL to redirect users to (defaults to /dashboard)
- `redirectLabel` - Label for the redirect button
- `onRetry` - Function to call when the retry button is clicked
- `onRefresh` - Function to call when the refresh button is clicked
- `compact` - Whether to display a compact version of the error
- `children` - Additional content to display

### 3. Compact Error Display

For inline errors, use the `compact` prop on ErrorDisplay:

```jsx
<ErrorDisplay
  title="Validation Error"
  message="Please check the form fields."
  compact={true}
  onRetry={handleValidateForm}
/>
```

## Error Handling Patterns

### API Request Errors

```jsx
const { data, error, isLoading, refetch } = useQuery(['key'], fetchData);

if (error) {
  return (
    <ErrorDisplay
      title="Failed to Load Data"
      message="We couldn't retrieve the necessary data."
      error={error}
      onRetry={() => refetch()}
      errorCode="API_FETCH_ERROR"
    />
  );
}
```

### Form Submission Errors

```jsx
const { mutate, error, isError, reset } = useMutation(submitForm);

// In your component:
{isError && (
  <ErrorDisplay
    title="Form Submission Failed"
    message="We couldn't submit your information. Please try again."
    error={error}
    onRetry={() => reset()}
    compact={true}
  />
)}
```

### Authentication Errors

```jsx
if (authError) {
  return (
    <ErrorDisplay
      title="Authentication Error"
      message="Your session has expired or you don't have permission to access this page."
      redirectUrl="/login"
      redirectLabel="Return to Login"
      errorCode="AUTH_ERROR"
    />
  );
}
```

## Error Codes

Use consistent error codes to help with tracking and debugging issues:

- `AUTH_ERROR` - Authentication/authorization errors
- `API_FETCH_ERROR` - Failed API requests 
- `FORM_ERROR` - Form validation or submission errors
- `PROGRAM_LOAD_ERROR` - Failed to load program data
- `TEAM_ERROR` - Team-related errors
- `SUBMISSION_ERROR` - Errors related to user submissions
- `NETWORK_ERROR` - Network connectivity issues

## Best Practices

1. **Be Specific:** Provide clear error messages that explain what went wrong
2. **Offer Solutions:** Give users actionable steps to resolve the issue
3. **Provide Context:** Include relevant context like timestamps and error codes
4. **Recovery Options:** Always include ways for users to recover or get back to a working state
5. **Consistency:** Use the ErrorDisplay component for all user-facing errors
6. **Fallbacks:** Always include fallback UI for loading and error states
7. **Logging:** Log detailed errors to the console or an error tracking service

## Error Handling with React Query

For data fetching with React Query, handle errors consistently:

```jsx
const { data, error, isLoading, isError } = useQuery(['key'], fetchFunction, {
  retry: 2,
  retryDelay: 1000,
  onError: (error) => {
    console.error('Query error:', error);
    // Optional: Log to error tracking service
  }
});

if (isLoading) return <LoadingComponent />;
if (isError) {
  return (
    <ErrorDisplay
      title="Data Loading Error"
      message="Failed to load the necessary data."
      error={error}
      onRetry={() => queryClient.invalidateQueries(['key'])}
    />
  );
}
```