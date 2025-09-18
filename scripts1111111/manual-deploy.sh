#!/bin/bash
# Manual deployment script that builds the app and copies public files to dist/public

# Set error handling
set -e

echo "Starting manual deployment process..."
echo "-----------------------"

# Step 1: Run the standard build command
echo "Step 1: Running npm build..."
npm run build

# Step 2: Copy public files to dist/public
echo "Step 2: Copying public files to dist/public..."
mkdir -p dist/public
cp -r public/* dist/public/
echo "Files copied successfully!"
ls -la dist/public

echo "-----------------------"
echo "Build completed successfully!"
echo "The application is now ready for deployment."
echo ""
echo "To deploy to Firebase, run:"
echo "firebase deploy --only hosting"