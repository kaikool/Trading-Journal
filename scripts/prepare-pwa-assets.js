/**
 * Script để chuẩn bị tài nguyên PWA cho Firebase Hosting
 * 
 * Script này sẽ:
 * 1. Copy tất cả icon và splash screen từ public/ vào dist/public/
 * 2. Tạo và tối ưu các icon từ SVG cho iOS nếu cần bằng sharp
 * 3. Cập nhật chuẩn xác manifest.json trong thư mục dist/public/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';
import sharp from 'sharp';

// Lấy __dirname trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Preparing PWA assets for deployment...');

// Đảm bảo thư mục dist/public tồn tại
const distPublicDir = path.join(__dirname, '../dist/public');
if (!fs.existsSync(distPublicDir)) {
  console.log('Creating dist/public directory...');
  fs.mkdirSync(distPublicDir, { recursive: true });
}

// Có thể file SVG gốc và icon đã được copy bởi Vite
// Nhưng chúng ta cần đảm bảo tất cả file liên quan đến PWA đều có mặt

// Copy app-icon.svg vào dist/public nếu chưa tồn tại
const sourceAppIcon = path.join(__dirname, '../public/app-icon.svg');
const destAppIcon = path.join(distPublicDir, 'app-icon.svg');
if (fs.existsSync(sourceAppIcon) && !fs.existsSync(destAppIcon)) {
  console.log('Copying app-icon.svg to dist/public/...');
  fs.copyFileSync(sourceAppIcon, destAppIcon);
}

// Copy favicon.svg và favicon.ico
['favicon.svg', 'favicon.ico'].forEach(file => {
  const sourcePath = path.join(__dirname, '../public/', file);
  const destPath = path.join(distPublicDir, file);
  if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
    console.log(`Copying ${file} to dist/public/...`);
    fs.copyFileSync(sourcePath, destPath);
  }
});

// Copy app logo icons
console.log('Copying app logo icons...');
const iconDir = path.join(distPublicDir, 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

['app-icon-monochrome.svg', 'app-icon-monochrome-light.svg', 'app-icon-monochrome-dark.svg'].forEach(file => {
  const sourcePath = path.join(__dirname, '../public/icons/', file);
  const destPath = path.join(iconDir, file);
  if (fs.existsSync(sourcePath)) {
    console.log(`Copying ${file} to dist/public/icons/...`);
    fs.copyFileSync(sourcePath, destPath);
  } else {
    console.warn(`Warning: ${sourcePath} does not exist`);
  }
});

// Copy tất cả icon PNG
const pngPattern = /^(icon-|apple-icon-|apple-splash-).*\.(png)$/i;
fs.readdirSync(path.join(__dirname, '../public/')).forEach(file => {
  if (pngPattern.test(file)) {
    const sourcePath = path.join(__dirname, '../public/', file);
    const destPath = path.join(distPublicDir, file);
    console.log(`Copying ${file} to dist/public/...`);
    fs.copyFileSync(sourcePath, destPath);
  }
});

// Tạo các icon PNG từ SVG nếu cần
if (sharp && fs.existsSync(sourceAppIcon)) {
  console.log('Generating PNG icons from SVG source using Sharp...');
  
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const appleIconSizes = [120, 152, 167, 180, 192, 512];
  
  // Tạo thư mục nếu cần
  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }
  
  // Đọc file SVG để xử lý
  const svgBuffer = fs.readFileSync(sourceAppIcon);
  
  // Tạo các icon thông thường
  for (const size of iconSizes) {
    const outputPath = path.join(distPublicDir, `icon-${size}.png`);
    console.log(`Generating icon-${size}.png...`);
    
    try {
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath, (err) => {
          if (err) console.error(`Error creating icon-${size}.png:`, err);
        });
    } catch (error) {
      console.error(`Error processing icon-${size}.png:`, error);
    }
  }
  
  // Tạo các icon dành riêng cho Apple
  for (const size of appleIconSizes) {
    const outputPath = path.join(distPublicDir, `apple-icon-${size}.png`);
    console.log(`Generating apple-icon-${size}.png...`);
    
    try {
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath, (err) => {
          if (err) console.error(`Error creating apple-icon-${size}.png:`, err);
        });
    } catch (error) {
      console.error(`Error processing apple-icon-${size}.png:`, error);
    }
  }
  
  // Tạo các splash screen đơn giản với logo ở giữa
  // Cho các thiết bị iOS phổ biến
  const splashScreenSizes = [
    { width: 640, height: 1136, name: 'apple-splash-640x1136.png' },  // iPhone 5/SE
    { width: 750, height: 1334, name: 'apple-splash-750x1334.png' },  // iPhone 6/7/8
    { width: 1242, height: 2208, name: 'apple-splash-1242x2208.png' }, // iPhone 6+/7+/8+
    { width: 1125, height: 2436, name: 'apple-splash-1125x2436.png' }, // iPhone X/XS
    { width: 828, height: 1792, name: 'apple-splash-828x1792.png' },  // iPhone XR
    { width: 1242, height: 2688, name: 'apple-splash-1242x2688.png' }  // iPhone XS Max
  ];
  
  for (const splash of splashScreenSizes) {
    const outputPath = path.join(distPublicDir, splash.name);
    console.log(`Generating ${splash.name}...`);
    
    try {
      // Tạo nền trắng và đặt SVG ở giữa với kích thước 30% của chiều rộng
      const logoSize = Math.floor(splash.width * 0.3);
      
      sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{
        input: svgBuffer,
        top: Math.floor((splash.height - logoSize) / 2),
        left: Math.floor((splash.width - logoSize) / 2),
        width: logoSize,
        height: logoSize
      }])
      .png()
      .toFile(outputPath, (err) => {
        if (err) console.error(`Error creating ${splash.name}:`, err);
      });
    } catch (error) {
      console.error(`Error processing ${splash.name}:`, error);
    }
  }
}

// Kiểm tra và cập nhật manifest.json để đảm bảo đường dẫn icon đúng
let manifestSource = path.join(__dirname, '../public/manifest.json');
const manifestPath = path.join(distPublicDir, 'manifest.json');

// Nếu manifest chưa tồn tại trong thư mục build, copy từ public
if (!fs.existsSync(manifestPath) && fs.existsSync(manifestSource)) {
  console.log('Copying manifest.json from public to dist/public...');
  fs.copyFileSync(manifestSource, manifestPath);
} 
// Nếu không có manifest nào cả, tạo mới
else if (!fs.existsSync(manifestPath)) {
  console.log('Creating new manifest.json...');
  const defaultManifest = {
    name: "Forex Trade Journal",
    short_name: "FX Journal",
    description: "Professional Forex Trading Journal with analytics and performance insights",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    lang: "vi",
    icons: []
  };
  fs.writeFileSync(manifestPath, JSON.stringify(defaultManifest, null, 2));
}

// Cập nhật manifest
if (fs.existsSync(manifestPath)) {
  console.log('Updating manifest.json...');
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Đảm bảo rằng icons array tồn tại và cập nhật
  manifest.icons = [
    { "src": "/app-icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/icon-72.png", "sizes": "72x72", "type": "image/png", "purpose": "any" },
    { "src": "/icon-96.png", "sizes": "96x96", "type": "image/png", "purpose": "any" },
    { "src": "/icon-128.png", "sizes": "128x128", "type": "image/png", "purpose": "any" },
    { "src": "/icon-144.png", "sizes": "144x144", "type": "image/png", "purpose": "any" },
    { "src": "/icon-152.png", "sizes": "152x152", "type": "image/png", "purpose": "any" },
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-384.png", "sizes": "384x384", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" },
    { "src": "/apple-icon-120.png", "sizes": "120x120", "type": "image/png", "purpose": "any" },
    { "src": "/apple-icon-152.png", "sizes": "152x152", "type": "image/png", "purpose": "any" },
    { "src": "/apple-icon-167.png", "sizes": "167x167", "type": "image/png", "purpose": "any" },
    { "src": "/apple-icon-180.png", "sizes": "180x180", "type": "image/png", "purpose": "any" },
    { "src": "/apple-icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/apple-icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ];
  
  // Đảm bảo các thuộc tính PWA khác có mặt
  if (!manifest.display) manifest.display = "standalone";
  if (!manifest.orientation) manifest.orientation = "portrait";
  if (!manifest.scope) manifest.scope = "/";
  if (!manifest.theme_color) manifest.theme_color = "#f8fafc";
  if (!manifest.background_color) manifest.background_color = "#f8fafc";
  if (!manifest.start_url) manifest.start_url = "/";
  if (!manifest.lang) manifest.lang = "vi";
  
  // Lưu lại manifest đã cập nhật
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('manifest.json has been updated.');
}

// Check if service-worker.js exists in dist/public
const swSource = path.join(__dirname, '../public/service-worker.js');
const swDest = path.join(distPublicDir, 'service-worker.js');
if (fs.existsSync(swSource) && !fs.existsSync(swDest)) {
  console.log('Copying service-worker.js to dist/public/...');
  fs.copyFileSync(swSource, swDest);
}

// Check if offline.html exists in dist/public
const offlineSource = path.join(__dirname, '../public/offline.html');
const offlineDest = path.join(distPublicDir, 'offline.html');
if (fs.existsSync(offlineSource) && !fs.existsSync(offlineDest)) {
  console.log('Copying offline.html to dist/public/...');
  fs.copyFileSync(offlineSource, offlineDest);
}

console.log('PWA assets preparation completed.');