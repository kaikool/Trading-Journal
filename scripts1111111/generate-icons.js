import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory if it doesn't exist
const iconDir = path.join(__dirname, '../public/icons/sizes');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Sizes required for Apple-style icons
// Including all the sizes requested: 16, 32, 48, 96, 192, 512, 1024
const sizes = [16, 32, 48, 96, 192, 512, 1024];

// Function to check if librsvg is installed
function checkRsvgInstalled() {
  return new Promise((resolve, reject) => {
    exec('which rsvg-convert', (error, stdout, stderr) => {
      if (error) {
        console.log('rsvg-convert is not installed. Falling back to alternative method.');
        resolve(false);
      } else {
        console.log('rsvg-convert is installed. Using it for SVG to PNG conversion.');
        resolve(true);
      }
    });
  });
}

// Function to generate PNG from SVG using rsvg-convert
function generatePngWithRsvg(inputFile, outputFile, size) {
  return new Promise((resolve, reject) => {
    const command = `rsvg-convert -w ${size} -h ${size} "${inputFile}" -o "${outputFile}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting SVG to PNG: ${error.message}`);
        reject(error);
      } else {
        console.log(`Generated ${outputFile}`);
        resolve();
      }
    });
  });
}

// Alternative method to generate PNG if rsvg-convert is not available
// This is a placeholder - in a real environment, we would use a Node.js SVG to PNG library
function generatePngAlternative(inputFile, outputFile, size) {
  return new Promise((resolve, reject) => {
    console.log(`Would generate ${outputFile} at size ${size}x${size}`);
    // In a real implementation, we would use a library like sharp, svg2png, etc.
    // For now, we'll just copy the SVG as a fallback
    fs.copyFile(inputFile, outputFile.replace('.png', '.svg'), (err) => {
      if (err) {
        console.error(`Error copying SVG: ${err.message}`);
        reject(err);
      } else {
        console.log(`Copied SVG to ${outputFile.replace('.png', '.svg')} as fallback`);
        resolve();
      }
    });
  });
}

async function generateIcons() {
  // Use existing monochrome app-icon files
  const inputFile = path.join(__dirname, '../public/icons/app-icon-monochrome.svg');
  const inputFileDark = path.join(__dirname, '../public/icons/app-icon-monochrome-dark.svg');
  const inputFileLight = path.join(__dirname, '../public/icons/app-icon-monochrome-light.svg');
  
  // Check if rsvg-convert is installed
  const rsvgInstalled = await checkRsvgInstalled();
  
  // Generate icons of different sizes
  for (const size of sizes) {
    const outputFile = path.join(iconDir, `icon-${size}.png`);
    
    if (rsvgInstalled) {
      await generatePngWithRsvg(inputFile, outputFile, size);
    } else {
      await generatePngAlternative(inputFile, outputFile, size);
    }
  }
  
  // Generate favicon.ico (typically requires 16x16, 32x32 and 48x48 sizes)
  // For this example, we'll just use the 32x32 icon as favicon
  if (rsvgInstalled) {
    await generatePngWithRsvg(inputFile, path.join(__dirname, '../public/favicon.ico'), 32);
  } else {
    console.log('Cannot generate favicon.ico without rsvg-convert');
    // We would need a proper ICO generator, for now we'll copy the SVG as a placeholder
    fs.copyFile(inputFile, path.join(__dirname, '../public/favicon.svg'), (err) => {
      if (err) {
        console.error(`Error copying SVG as favicon: ${err.message}`);
      } else {
        console.log('Copied SVG as favicon placeholder');
      }
    });
  }
  
  // Copy the SVG files
  // Main icon for favicon
  fs.copyFile(inputFile, path.join(__dirname, '../public/favicon.svg'), (err) => {
    if (err) {
      console.error(`Error copying SVG as favicon: ${err.message}`);
    } else {
      console.log('Copied SVG as favicon');
    }
  });
  
  // Copy the theme-specific icons
  fs.copyFile(inputFile, path.join(__dirname, '../public/icons/app-icon.svg'), (err) => {
    if (err) {
      console.error(`Error copying main SVG: ${err.message}`);
    } else {
      console.log('Copied main SVG icon');
    }
  });
  
  fs.copyFile(inputFileDark, path.join(__dirname, '../public/icons/app-icon-dark.svg'), (err) => {
    if (err) {
      console.error(`Error copying dark SVG: ${err.message}`);
    } else {
      console.log('Copied dark SVG icon');
    }
  });
  
  fs.copyFile(inputFileLight, path.join(__dirname, '../public/icons/app-icon-light.svg'), (err) => {
    if (err) {
      console.error(`Error copying light SVG: ${err.message}`);
    } else {
      console.log('Copied light SVG icon');
    }
  });
  
  // Generate the main icons: 192px and 512px for PWA
  const mainSizes = [192, 512];
  for (const size of mainSizes) {
    const outputFile = path.join(__dirname, `../public/icon-${size}.png`);
    
    if (rsvgInstalled) {
      await generatePngWithRsvg(inputFile, outputFile, size);
    } else {
      await generatePngAlternative(inputFile, outputFile, size);
    }
  }
  
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);