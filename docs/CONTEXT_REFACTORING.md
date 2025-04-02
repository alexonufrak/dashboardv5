# Domain-Driven Context Refactoring

## Overview

This document explains the new domain-driven context architecture implemented for the xFoundry dashboard. This architecture separates our previously monolithic DashboardContext into focused domain-specific contexts, following domain-driven design principles.

## Architecture

The new context architecture is composed of the following components:

### Domain-Specific Contexts

1. **UserContext**
   - Handles user profile and authentication data
   - Provides user lookup functionality
   - Manages profile updates and onboarding status

2. **ProgramContext**
   - Manages program/initiative/cohort data
   - Handles active program selection
   - Provides access to milestones and program details

3. **TeamContext**
   - Manages team data and team selection
   - Handles active team for each program
   - Provides team operations (invite, update)

4. **EducationContext**
   - Manages education record data
   - Provides education record operations
   - Tracks education profile completion status

### Composition Pattern

The contexts are composed using a nested provider pattern:

```jsx
<UserProvider>
  <ProgramContext>
    <TeamContext>
      <EducationContext>
        {children}
      </EducationContext>
    </TeamContext>
  </ProgramContext>
</UserProvider>
```

This structure respects the dependency relationships between domains:
- Teams depend on Programs and Users
- Programs depend on Users
- Education depends on Users

### Backward Compatibility

To ensure existing components continue to work without immediate changes, we've implemented:

1. **Legacy Bridge Component**
   - Combines all domain context values into a single context value
   - Maintains the same API surface as the original DashboardContext

2. **Dual Export Strategy**
   - Original `useDashboard()` hook is maintained for backward compatibility
   - New domain-specific hooks are exported for gradual migration:
     - `useUserContext()`
     - `useProgramContext()`
     - `useTeamContext()`
     - `useEducationContext()`

## Migration Strategy

### Immediate Benefits

- Reduced context size and improved code organization
- Clear separation of concerns
- Focused testability for each domain
- Improved readability and maintainability

### Recommended Migration Approach

1. **For New Components**
   - Use domain-specific context hooks directly
   - Example: `const { education, updateEducation } = useEducationContext()`

2. **For Existing Components**
   - Continue using `useDashboard()` until scheduled for refactoring
   - When refactoring, replace with specific domain context hooks

3. **Progressive Enhancement**
   - Start by using the new context hooks for new features
   - Gradually refactor existing components when touching them

## Example Usage

### Using Domain-Specific Contexts (Recommended)

```jsx
import { useEducationContext } from '@/contexts/EducationContext';
import { useUserContext } from '@/contexts/UserContext';

function ProfileComponent() {
  const { profile } = useUserContext();
  const { education, updateEducation } = useEducationContext();
  
  // Component logic...
}
```

### Using Legacy Context (Backward Compatible)

```jsx
import { useDashboard } from '@/contexts/DashboardContext';

function LegacyComponent() {
  const { profile, education, updateEducation } = useDashboard();
  
  // Component logic...
}
```

## Benefits of Domain-Driven Context

1. **Reduced Coupling**
   - Each context operates independently
   - Changes to one domain don't affect others

2. **Improved Performance**
   - Only re-renders components that depend on changed data
   - More granular control over what triggers updates

3. **Better Code Organization**
   - Clear boundaries between domains
   - Easier to locate relevant code

4. **Enhanced Developer Experience**
   - More focused APIs
   - Better IDE autocompletion and type safety
   - Less context bloat

## Next Steps

1. Create UI-specific context for interface state management
2. Gradually refactor existing components to use domain-specific contexts
3. Add comprehensive tests for each domain context
4. Improve TypeScript typing for context values