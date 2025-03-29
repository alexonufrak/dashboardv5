#!/bin/bash

# Script to update Auth0 imports for v4
echo "Updating Auth0 imports for v4..."

# Update useUser imports
find . -name "*.js" -type f -not -path "./node_modules/*" -exec grep -l "import.*useUser.*from '@auth0/nextjs-auth0/client'" {} \; | xargs sed -i '' "s|import { useUser } from '@auth0/nextjs-auth0/client'|import { useUser } from '@auth0/nextjs-auth0'|g"

# Update UserProvider imports
find . -name "*.js" -type f -not -path "./node_modules/*" -exec grep -l "import.*UserProvider.*from \"@auth0/nextjs-auth0/client\"" {} \; | xargs sed -i '' "s|import { UserProvider } from \"@auth0/nextjs-auth0/client\"|import { UserProvider } from \"@auth0/nextjs-auth0\"|g"

echo "Done updating imports."