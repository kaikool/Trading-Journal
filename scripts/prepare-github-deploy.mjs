/**
 * Script để chuẩn bị config.js từ config-template.js cho GitHub Deployment
 * Đã cập nhật để hoạt động với ES Modules
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function setupConfig() {
  try {
    console.log('Preparing config file for GitHub deployment...');
    
    // Define file paths
    const templatePath = join(__dirname, '..', 'public', 'config-template.js');
    const outputPath = join(__dirname, '..', 'public', 'config.js');
    const distOutputPath = join(__dirname, '..', 'dist', 'config.js');
    
    console.log(`Template path: ${templatePath}`);
    console.log(`Output path: ${outputPath}`);
    
    // Read the template file
    const templateContent = readFileSync(templatePath, 'utf8');
    
    // Get environment variables
    const {
      VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_APP_ID,
      VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_MEASUREMENT_ID
    } = process.env;
    
    // Verify required variables
    if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_APP_ID || !VITE_FIREBASE_PROJECT_ID) {
      throw new Error('Missing required environment variables for Firebase configuration');
    }
    
    // Replace placeholder values in the template
    let configContent = templateContent
      .replace(/YOUR_API_KEY/g, VITE_FIREBASE_API_KEY)
      .replace(/YOUR_APP_ID/g, VITE_FIREBASE_APP_ID)
      .replace(/YOUR_PROJECT_ID/g, VITE_FIREBASE_PROJECT_ID)
      .replace(/YOUR_SENDER_ID/g, VITE_FIREBASE_MESSAGING_SENDER_ID || '')
      .replace(/YOUR_MEASUREMENT_ID/g, VITE_FIREBASE_MEASUREMENT_ID || '')
      .replace(/YOUR_REGION/g, 'asia-southeast1'); // Default region
    
    // Write the updated content to the output file
    writeFileSync(outputPath, configContent, 'utf8');
    console.log('Config file successfully created at:', outputPath);
    
    // Try to write to dist directory if it exists
    try {
      writeFileSync(distOutputPath, configContent, 'utf8');
      console.log('Config file also created in dist directory at:', distOutputPath);
    } catch (distError) {
      console.log('Note: Could not write to dist directory (this is normal during build phase)');
    }
    
  } catch (error) {
    console.error('Error preparing config file:', error.message);
    process.exit(1);
  }
}

// Execute the function
setupConfig();