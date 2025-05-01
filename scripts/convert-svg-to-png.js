/**
 * Script to convert SVG icons to PNG for PWA support
 * 
 * This script uses Sharp library to convert SVG icons to PNG formats
 * required for PWA support across different devices
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Define SVG files to convert and their PNG output sizes
const conversions = [
  { 
    svgPath: path.join(publicDir, 'app-icon.svg'),
    outputSizes: [
      // Standard PWA icons
      { name: 'icon-72.png', size: 72 },
      { name: 'icon-96.png', size: 96 },
      { name: 'icon-128.png', size: 128 },
      { name: 'icon-144.png', size: 144 },
      { name: 'icon-152.png', size: 152 },
      { name: 'icon-192.png', size: 192 },
      { name: 'icon-384.png', size: 384 },
      { name: 'icon-512.png', size: 512 },
      
      // iOS specific icons
      { name: 'apple-icon-120.png', size: 120 }, // iPhone
      { name: 'apple-icon-152.png', size: 152 }, // iPad
      { name: 'apple-icon-167.png', size: 167 }, // iPad Pro
      { name: 'apple-icon-180.png', size: 180 }, // iPhone 6 Plus
      { name: 'apple-icon-192.png', size: 192 },
      { name: 'apple-icon-512.png', size: 512 },
      
      // iOS splash screens
      { name: 'apple-splash-640x1136.png', width: 640, height: 1136 }, // iPhone 5
      { name: 'apple-splash-750x1334.png', width: 750, height: 1334 }, // iPhone 6/7/8
      { name: 'apple-splash-1242x2208.png', width: 1242, height: 2208 }, // iPhone 6/7/8 Plus
      { name: 'apple-splash-1125x2436.png', width: 1125, height: 2436 }, // iPhone X/XS
      { name: 'apple-splash-828x1792.png', width: 828, height: 1792 }, // iPhone XR
      { name: 'apple-splash-1242x2688.png', width: 1242, height: 2688 }, // iPhone XS Max
    ],
  }
];

/**
 * Convert an SVG file to multiple PNG files at different sizes
 * 
 * @param {string} svgPath Path to the SVG file
 * @param {Array} outputSizes Array of output configurations
 * @returns {Promise<void>}
 */
async function convertSvgToPngs(svgPath, outputSizes) {
  if (!fs.existsSync(svgPath)) {
    console.error(`SVG file not found: ${svgPath}`);
    return;
  }

  try {
    const svg = fs.readFileSync(svgPath);
    
    for (const output of outputSizes) {
      const outputPath = path.join(publicDir, output.name);
      
      if (output.width && output.height) {
        // Xử lý splash screens có kích thước chiều rộng x chiều cao riêng biệt
        // Center the icon in the splash screen
        const paddingPercent = 0.3; // Icon sẽ chiếm 70% diện tích splash screen
        const minDimension = Math.min(output.width, output.height);
        const iconSize = Math.round(minDimension * (1 - paddingPercent));
        
        // Tạo một nền trắng (hoặc màu nền bạn muốn)
        await sharp({
          create: {
            width: output.width,
            height: output.height,
            channels: 4,
            background: { r: 248, g: 250, b: 252, alpha: 1 } // #F8FAFC - light background from your SVG
          }
        })
        .composite([{
          input: await sharp(svg)
            .resize(iconSize, iconSize)
            .toBuffer(),
          top: Math.round((output.height - iconSize) / 2),
          left: Math.round((output.width - iconSize) / 2)
        }])
        .png()
        .toFile(outputPath);
        
        console.log(`Created splash screen: ${output.name} (${output.width}x${output.height}px)`);
      } else {
        // Xử lý icon vuông bình thường
        await sharp(svg)
          .resize(output.size, output.size)
          .png()
          .toFile(outputPath);
        
        console.log(`Created icon: ${output.name} (${output.size}x${output.size}px)`);
      }
    }
  } catch (error) {
    console.error(`Error converting ${svgPath}:`, error);
  }
}

/**
 * Main function to convert all SVGs to PNGs
 */
async function main() {
  try {
    console.log('Starting SVG to PNG conversion...');
    
    for (const conversion of conversions) {
      await convertSvgToPngs(conversion.svgPath, conversion.outputSizes);
    }
    
    console.log('SVG to PNG conversion completed successfully!');
    
    // Now update manifest.json to include PNG icons
    updateManifestWithPngIcons();
    
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

/**
 * Update manifest.json to include PNG icons
 */
function updateManifestWithPngIcons() {
  const manifestPath = path.join(publicDir, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('manifest.json not found!');
    return;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Lọc các icon SVG từ danh sách hiện tại (nếu có)
    const existingSvgIcons = (manifest.icons || []).filter(icon => 
      icon.type === 'image/svg+xml'
    );
    
    // Các icon PWA tiêu chuẩn
    const pngIcons = [
      {
        "src": "/icon-72.png",
        "sizes": "72x72",
        "type": "image/png"
      },
      {
        "src": "/icon-96.png",
        "sizes": "96x96",
        "type": "image/png"
      },
      {
        "src": "/icon-128.png",
        "sizes": "128x128",
        "type": "image/png"
      },
      {
        "src": "/icon-144.png",
        "sizes": "144x144",
        "type": "image/png"
      },
      {
        "src": "/icon-152.png",
        "sizes": "152x152",
        "type": "image/png"
      },
      {
        "src": "/icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icon-384.png",
        "sizes": "384x384",
        "type": "image/png"
      },
      {
        "src": "/icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ];
    
    // Thêm các icon iOS chuyên dụng
    const appleIcons = [
      {
        "src": "/apple-icon-120.png",
        "sizes": "120x120",
        "type": "image/png",
        "purpose": "apple-touch-icon"
      },
      {
        "src": "/apple-icon-152.png",
        "sizes": "152x152",
        "type": "image/png",
        "purpose": "apple-touch-icon"
      },
      {
        "src": "/apple-icon-167.png",
        "sizes": "167x167",
        "type": "image/png",
        "purpose": "apple-touch-icon"
      },
      {
        "src": "/apple-icon-180.png",
        "sizes": "180x180",
        "type": "image/png",
        "purpose": "apple-touch-icon"
      },
      {
        "src": "/apple-icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "apple-touch-icon"
      },
      {
        "src": "/apple-icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "apple-touch-icon"
      }
    ];
    
    // Kết hợp tất cả các icons
    manifest.icons = [...existingSvgIcons, ...pngIcons, ...appleIcons];
    
    // Cập nhật manifest với iOS splash screens nếu chưa có
    if (!manifest.apple_splash_screens) {
      manifest.apple_splash_screens = [
        {
          "src": "/apple-splash-640x1136.png",
          "sizes": "640x1136",
          "device": "iPhone 5"
        },
        {
          "src": "/apple-splash-750x1334.png",
          "sizes": "750x1334",
          "device": "iPhone 6/7/8"
        },
        {
          "src": "/apple-splash-1242x2208.png",
          "sizes": "1242x2208",
          "device": "iPhone 6/7/8 Plus"
        },
        {
          "src": "/apple-splash-1125x2436.png",
          "sizes": "1125x2436",
          "device": "iPhone X/XS"
        },
        {
          "src": "/apple-splash-828x1792.png",
          "sizes": "828x1792",
          "device": "iPhone XR"
        },
        {
          "src": "/apple-splash-1242x2688.png",
          "sizes": "1242x2688",
          "device": "iPhone XS Max"
        }
      ];
    }
    
    // Viết lại manifest đã cập nhật
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('manifest.json cập nhật thành công với icons và splash screens');
  } catch (error) {
    console.error('Lỗi khi cập nhật manifest.json:', error);
  }
}

// Run the main function
main();