# Server Actions Implementation Guide

This document outlines the implementation pattern for using Server Actions with Next.js 14 App Router. Server Actions are a powerful feature that allow server-side mutations directly from client components, reducing the need for custom API endpoints.

## Implementation Pattern

### 1. Server Action File Structure

Server Actions are defined in separate files with the `'use server'` directive at the top:

```javascript
'use server'

// Server Action implementation
export async function myAction(formData) {
  // ...implementation
}
```

These actions are placed in the `app/actions/` directory, organized by domain:

- `app/actions/profile/update-profile.js`
- `app/actions/teams/create-team.js`
- `app/actions/applications/submit-application.js`

### 2. Authentication and Validation

All Server Actions should follow this pattern:

1. Get the authenticated user
2. Validate input data
3. Perform the operation
4. Revalidate related cache data
5. Return a structured response

Example:

```javascript
export async function updateProfile(formData) {
  try {
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return { 
        success: false, 
        error: 'Authentication required' 
      };
    }
    
    // Extract and validate form data
    const firstName = formData.get('firstName');
    if (!firstName) {
      return {
        success: false,
        error: 'First name is required',
        fieldErrors: {
          firstName: 'First name is required'
        }
      };
    }
    
    // Perform the operation
    await updateUserProfile(contactId, { firstName });
    
    // Revalidate cache
    revalidateTag('user-profile');
    revalidatePath('/dashboard/profile');
    
    // Return success response
    return { 
      success: true,
      data: { firstName }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred'
    };
  }
}
```

### 3. Client Component Integration

Client components can use Server Actions in two ways:

#### Form Action

```jsx
export default function MyForm() {
  return (
    <form action={myServerAction}>
      <input name="firstName" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### useFormState + useFormStatus for Enhanced Form Handling

```jsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { myServerAction } from '@/app/actions/my-action'

// Create initial state
const initialState = { message: null, errors: {} }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  )
}

export default function MyForm() {
  // Bind the action to the form state
  const [state, formAction] = useFormState(myServerAction, initialState)
  
  return (
    <form action={formAction}>
      {state.message && <p>{state.message}</p>}
      <input name="firstName" />
      {state.errors.firstName && <p>{state.errors.firstName}</p>}
      <SubmitButton />
    </form>
  )
}
```

#### Manual Invocation with useTransition

For more complex scenarios or when not using forms directly:

```jsx
'use client'

import { useState, useTransition } from 'react'
import { myServerAction } from '@/app/actions/my-action'

export default function MyComponent() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState(null)
  
  function handleClick() {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('firstName', 'John')
      
      const result = await myServerAction(formData)
      setResult(result)
    })
  }
  
  return (
    <div>
      <button 
        onClick={handleClick} 
        disabled={isPending}
      >
        {isPending ? 'Processing...' : 'Submit'}
      </button>
      
      {result && (
        <div>
          {result.success ? (
            <p>Success!</p>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

### 4. Optimistic Updates

For a better user experience, implement optimistic updates:

```jsx
'use client'

import { useOptimistic } from 'react'
import { updateProfile } from '@/app/actions/profile/update-profile'

export default function ProfileForm({ profile }) {
  // Set up optimistic state
  const [optimisticProfile, updateOptimisticProfile] = useOptimistic(
    profile,
    (state, newData) => ({
      ...state,
      ...newData,
    })
  )
  
  async function handleSubmit(formData) {
    // Show optimistic update immediately
    updateOptimisticProfile({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName')
    })
    
    // Perform actual update
    await updateProfile(formData)
  }
  
  return (
    <form action={handleSubmit}>
      <p>Name: {optimisticProfile.firstName} {optimisticProfile.lastName}</p>
      <input name="firstName" defaultValue={profile.firstName} />
      <input name="lastName" defaultValue={profile.lastName} />
      <button type="submit">Update</button>
    </form>
  )
}
```

### 5. Cache Invalidation

Always properly invalidate caches after mutations:

```javascript
// Method 1: Revalidate by path
revalidatePath('/dashboard/profile')

// Method 2: Revalidate by tag (more precise)
revalidateTag('user-profile')
```

## Example Implementation

Our profile update implementation demonstrates the complete pattern:

1. **Server Action** (`app/actions/profile/update-profile.js`)
   - Handles authentication, validation, and profile updates
   - Returns structured response with success/error information

2. **Client Form Component** (`app/dashboard/profile/components/ProfileEditForm.js`)
   - Uses Server Action for form submission
   - Implements optimistic updates
   - Handles validation errors and loading states

3. **Integration with Server Components** (`app/dashboard/profile/components/ProfileServerPage.js`)
   - Demonstrates how Server Components and Client Components work together
   - Shows how to create interaction points (buttons, forms) in an otherwise server-rendered page

## Best Practices

1. **Error Handling**
   - Always return structured error responses
   - Include field-level validation errors when appropriate
   - Handle errors gracefully in client components

2. **Performance**
   - Use optimistic updates for a responsive UI
   - Implement proper cache invalidation
   - Consider streaming responses for large data sets

3. **Security**
   - Always authenticate users in Server Actions
   - Validate input data thoroughly
   - Use proper authorization checks

4. **Maintenance**
   - Group related Server Actions in domain-specific directories
   - Use consistent response formats across all Server Actions
   - Document complex actions with JSDoc comments

## Migration from React Query Mutations

When migrating from React Query mutations to Server Actions:

1. Create a Server Action that performs the same functionality
2. Update client components to use the Server Action
3. Implement optimistic updates and error handling
4. Remove React Query mutation hooks once migration is complete

Example migration diff:

```diff
// Before: React Query mutation
- const updateProfile = useMutation({
-   mutationFn: (data) => api.put('/api/profile', data),
-   onSuccess: () => {
-     queryClient.invalidateQueries({ queryKey: ['profile'] })
-   }
- })
-
- function handleSubmit(e) {
-   e.preventDefault()
-   const data = { firstName: e.target.firstName.value }
-   updateProfile.mutate(data)
- }

// After: Server Action
+ import { updateProfile } from '@/app/actions/profile/update-profile'
+
+ function handleSubmit(formData) {
+   // formData is automatically provided by the form
+   return updateProfile(formData)
+ }

return (
-  <form onSubmit={handleSubmit}>
+  <form action={handleSubmit}>
    <input name="firstName" />
-    <button disabled={updateProfile.isPending}>
-      {updateProfile.isPending ? 'Saving...' : 'Save'}
+    <Button pending={isPending}>
+      {isPending ? 'Saving...' : 'Save'}
    </button>
  </form>
)
```

## References

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [React Server Components](https://nextjs.org/docs/getting-started/react-essentials#server-components)
- [Server-Side Form Validation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions#server-side-validation)
- [useOptimistic Hook](https://react.dev/reference/react/useOptimistic)
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)