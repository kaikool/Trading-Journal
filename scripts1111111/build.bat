@echo off
REM Build script that runs the standard build and then copies public files to dist/public

echo Starting build process...
echo -----------------------

REM Step 1: Run the standard build command
echo Step 1: Running npm build...
call npm run build

REM Step 2: Run our copy script
echo Step 2: Copying public files to dist/public...
node scripts/copy-public-files.js

echo -----------------------
echo Build completed successfully!
echo The application is now ready for deployment.