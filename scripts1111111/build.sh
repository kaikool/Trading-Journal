#!/bin/bash
# Build script that runs the standard build and then copies public files to dist/public

# Set error handling
set -e

echo "Starting build process..."
echo "-----------------------"

# Step 1: Run the standard build command
echo "Step 1: Running npm build..."
npm run build

# Step 2: Run our copy script
echo "Step 2: Copying public files to dist/public..."
node scripts/copy-public-files.js

echo "-----------------------"
echo "Build completed successfully!"
echo "The application is now ready for deployment."