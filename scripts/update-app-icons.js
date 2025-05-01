/**
 * Script để cập nhật app icon cho PWA
 * 
 * Script này sẽ:
 * 1. Sao chép SVG icon từ source vào các vị trí cần thiết
 * 2. Đảm bảo cả monochrome và color icon đều được cung cấp
 * 3. Sửa lại các đường dẫn trong manifest.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn gốc
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const iconsDir = path.join(publicDir, 'icons');

// Kiểm tra và tạo thư mục nếu cần
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Đã tạo thư mục: ${dir}`);
  }
}

// Kiểm tra tất cả thư mục cần thiết
function setupDirectories() {
  ensureDirExists(publicDir);
  ensureDirExists(iconsDir);
  console.log('Đã kiểm tra và đảm bảo các thư mục tồn tại');
}

// Chuẩn bị các icon cơ bản
function setupBaseIcons() {
  // Source files
  const appIconSvg = path.join(publicDir, 'app-icon.svg');
  const monochromeIconSvg = path.join(iconsDir, 'app-icon-monochrome.svg');
  const monochromeDarkIconSvg = path.join(iconsDir, 'app-icon-monochrome-dark.svg');
  const monochromeIconLightSvg = path.join(iconsDir, 'app-icon-monochrome-light.svg');
  
  // Target locations
  const faviconSvg = path.join(publicDir, 'favicon.svg');
  
  // Copy app-icon.svg sang favicon.svg
  if (fs.existsSync(appIconSvg)) {
    fs.copyFileSync(appIconSvg, faviconSvg);
    console.log(`Đã sao chép ${appIconSvg} -> ${faviconSvg}`);
  } else {
    console.error(`File ${appIconSvg} không tồn tại`);
  }
  
  // Kiểm tra các monochrome icon
  if (!fs.existsSync(monochromeIconSvg)) {
    console.error(`File ${monochromeIconSvg} không tồn tại`);
  } else {
    console.log(`File ${monochromeIconSvg} đã tồn tại`);
  }
  
  if (!fs.existsSync(monochromeDarkIconSvg)) {
    console.error(`File ${monochromeDarkIconSvg} không tồn tại`);
  } else {
    console.log(`File ${monochromeDarkIconSvg} đã tồn tại`);
  }
  
  if (!fs.existsSync(monochromeIconLightSvg)) {
    console.error(`File ${monochromeIconLightSvg} không tồn tại`);
  } else {
    console.log(`File ${monochromeIconLightSvg} đã tồn tại`);
  }
}

// Cập nhật manifest.json để đảm bảo các đường dẫn icon chính xác
function updateManifest() {
  const manifestPath = path.join(publicDir, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error(`File manifest.json không tồn tại tại ${manifestPath}`);
    return;
  }
  
  try {
    // Đọc manifest hiện tại
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Đảm bảo mảng icons tồn tại
    if (!manifest.icons) {
      manifest.icons = [];
    }
    
    // Tìm và xóa các icon SVG cũ
    manifest.icons = manifest.icons.filter(icon => 
      !(icon.type === 'image/svg+xml' && icon.src !== '/app-icon.svg')
    );
    
    // Đảm bảo app-icon.svg được sử dụng cho cả hai mục đích
    const hasAnyPurpose = manifest.icons.some(icon => 
      icon.type === 'image/svg+xml' && 
      icon.src === '/app-icon.svg' && 
      (icon.purpose?.includes('any') || !icon.purpose)
    );
    
    const hasMaskablePurpose = manifest.icons.some(icon => 
      icon.type === 'image/svg+xml' && 
      icon.src === '/app-icon.svg' && 
      icon.purpose?.includes('maskable')
    );
    
    // Thêm icon SVG cho mục đích "any" nếu chưa có
    if (!hasAnyPurpose) {
      manifest.icons.unshift({
        src: '/app-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any monochrome'
      });
    }
    
    // Thêm icon SVG cho mục đích "maskable" nếu chưa có
    if (!hasMaskablePurpose) {
      manifest.icons.unshift({
        src: '/app-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      });
    }
    
    // Kiểm tra đường dẫn cho tất cả các icon và đánh dấu các icon thiếu
    const missingIcons = [];
    
    for (const icon of manifest.icons) {
      // Bỏ qua các icon có đường dẫn bắt đầu bằng http:// hoặc https://
      if (icon.src.startsWith('http://') || icon.src.startsWith('https://')) {
        console.log(`Bỏ qua icon từ URL bên ngoài: ${icon.src}`);
        continue;
      }
      
      // Kiểm tra file có tồn tại không
      const iconPath = path.join(publicDir, icon.src.startsWith('/') ? icon.src.slice(1) : icon.src);
      if (!fs.existsSync(iconPath)) {
        console.warn(`Warning: Icon file ${icon.src} không tồn tại tại ${iconPath}`);
        missingIcons.push(icon.src);
      } else {
        console.log(`OK: Icon file ${icon.src} tồn tại`);
      }
    }
    
    // Lưu lại manifest đã cập nhật
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('Đã cập nhật manifest.json');
    
    if (missingIcons.length > 0) {
      console.warn('Cảnh báo: Có một số icon đang thiếu. Bạn cần tạo các icon này:');
      missingIcons.forEach(icon => console.warn(`- ${icon}`));
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật manifest.json:', error);
  }
}

// Hàm main
async function main() {
  console.log('=== Bắt đầu cập nhật app icons ===');
  
  // Bước 1: Kiểm tra thư mục
  setupDirectories();
  
  // Bước 2: Chuẩn bị icon cơ bản
  setupBaseIcons();
  
  // Bước 3: Cập nhật manifest
  updateManifest();
  
  console.log('=== Hoàn tất cập nhật app icons ===');
}

// Chạy script
main().catch(console.error);