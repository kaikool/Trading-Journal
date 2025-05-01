/**
 * Script to copy files from public directory to dist/public after build
 * 
 * This script ensures all static assets from the public folder are properly
 * copied to the dist/public directory for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const publicDir = path.resolve(__dirname, '../public');
const distPublicDir = path.resolve(__dirname, '../dist/public');

// Ensure the dist/public directory exists
if (!fs.existsSync(distPublicDir)) {
  fs.mkdirSync(distPublicDir, { recursive: true });
  console.log('Created directory:', distPublicDir);
}

/**
 * Copy a file from source to destination
 */
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`Copied: ${path.relative(publicDir, source)} → ${path.relative(distPublicDir, destination)}`);
  } catch (err) {
    console.error(`Error copying ${source} to ${destination}:`, err);
  }
}

/**
 * Copy a directory recursively
 */
function copyDirectory(source, destination) {
  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  // Read the contents of the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // Copy each file/directory
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy files
      copyFile(sourcePath, destPath);
    }
  }
}

// Start copying
console.log(`\nCopying files from public/ to dist/public/`);
console.log('-------------------------------------------');

copyDirectory(publicDir, distPublicDir);

console.log('\nPublic files have been copied to dist/public successfully!');
console.log('The application is now ready for deployment.');