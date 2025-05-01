/**
 * Script tối ưu hóa tài nguyên cho production
 * 
 * Script này sẽ:
 * 1. Tối ưu hóa tất cả hình ảnh trong thư mục public
 * 2. Tạo các phiên bản kích thước khác nhau cho hình ảnh
 * 3. Chuyển đổi hình ảnh sang định dạng WebP khi có thể
 * 4. Cập nhật manifest.json để tham chiếu đến các tài nguyên mới
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

// Thư mục chứa tài nguyên
const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist/public');
const IMAGE_DIRS = ['icons', 'assets'];

// Kích thước hình ảnh cần tạo
const IMAGE_SIZES = [
  { width: 72, height: 72, suffix: '72' },
  { width: 96, height: 96, suffix: '96' },
  { width: 128, height: 128, suffix: '128' },
  { width: 144, height: 144, suffix: '144' },
  { width: 152, height: 152, suffix: '152' },
  { width: 192, height: 192, suffix: '192' },
  { width: 384, height: 384, suffix: '384' },
  { width: 512, height: 512, suffix: '512' },
];

// Danh sách định dạng hình ảnh cần xử lý
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];

// Đảm bảo thư mục đích tồn tại
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Tạo thư mục đích
async function setupOutputDirectories() {
  ensureDirectoryExists(DIST_DIR);
  
  for (const imageDir of IMAGE_DIRS) {
    ensureDirectoryExists(path.join(DIST_DIR, imageDir));
  }
  
  // Thư mục cho WebP
  ensureDirectoryExists(path.join(DIST_DIR, 'webp'));
}

// Tối ưu hóa một hình ảnh
async function optimizeImage(imagePath, outputPath) {
  const ext = path.extname(imagePath).toLowerCase();
  
  try {
    // Bỏ qua các hình ảnh SVG vì chúng đã là vector
    if (ext === '.svg') {
      // Chỉ sao chép SVG
      fs.copyFileSync(imagePath, outputPath);
      console.log(`Đã sao chép: ${path.basename(imagePath)}`);
      return;
    }
    
    // Sử dụng sharp để tối ưu hóa hình ảnh
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Tối ưu hóa dựa trên loại hình ảnh
    let processedImage;
    
    if (ext === '.png') {
      processedImage = image.png({ quality: 80, compressionLevel: 9 });
    } else if (ext === '.jpg' || ext === '.jpeg') {
      processedImage = image.jpeg({ quality: 80 });
    } else if (ext === '.gif') {
      processedImage = image.gif();
    } else {
      // Định dạng không được hỗ trợ
      fs.copyFileSync(imagePath, outputPath);
      console.log(`Đã sao chép: ${path.basename(imagePath)}`);
      return;
    }
    
    // Lưu hình ảnh đã tối ưu
    await processedImage.toFile(outputPath);
    
    // Tạo phiên bản WebP
    const webpOutputPath = path.join(
      path.dirname(outputPath.replace(DIST_DIR, path.join(DIST_DIR, 'webp'))),
      `${path.basename(outputPath, ext)}.webp`
    );
    
    // Đảm bảo thư mục đích tồn tại
    ensureDirectoryExists(path.dirname(webpOutputPath));
    
    // Tạo phiên bản WebP
    await image.webp({ quality: 80 }).toFile(webpOutputPath);
    
    console.log(`Đã tối ưu: ${path.basename(imagePath)}`);
  } catch (error) {
    console.error(`Lỗi khi tối ưu hóa ${path.basename(imagePath)}:`, error.message);
    // Nếu có lỗi, sao chép file gốc
    fs.copyFileSync(imagePath, outputPath);
  }
}

// Tạo các phiên bản kích thước khác nhau của biểu tượng
async function generateIconSizes(iconPath) {
  const ext = path.extname(iconPath);
  const iconName = path.basename(iconPath, ext);
  
  // Bỏ qua nếu không phải hình ảnh
  if (!IMAGE_EXTENSIONS.includes(ext.toLowerCase())) {
    return;
  }
  
  // Bỏ qua các hình ảnh đã có kích thước
  if (iconName.match(/\d+x\d+$/) || iconName.includes('-')) {
    return;
  }
  
  // Tạo các phiên bản kích thước khác nhau
  for (const size of IMAGE_SIZES) {
    const outputPath = path.join(
      DIST_DIR, 
      'icons', 
      `${iconName}-${size.suffix}${ext}`
    );
    
    try {
      await sharp(iconPath)
        .resize(size.width, size.height)
        .toFile(outputPath);
      
      // Tạo phiên bản WebP
      const webpOutputPath = path.join(
        DIST_DIR,
        'webp',
        'icons',
        `${iconName}-${size.suffix}.webp`
      );
      
      // Đảm bảo thư mục đích tồn tại
      ensureDirectoryExists(path.dirname(webpOutputPath));
      
      await sharp(iconPath)
        .resize(size.width, size.height)
        .webp({ quality: 80 })
        .toFile(webpOutputPath);
      
      console.log(`Đã tạo: ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`Lỗi khi tạo kích thước ${size.suffix} cho ${iconName}:`, error.message);
    }
  }
}

// Cập nhật manifest.json
function updateManifest() {
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  const distManifestPath = path.join(DIST_DIR, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('Không tìm thấy manifest.json');
    return;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Cập nhật icons để bao gồm cả các kích thước mới
    const existingIcons = manifest.icons || [];
    const generatedIcons = IMAGE_SIZES.map(size => ({
      src: `/icons/app-icon-${size.suffix}.png`,
      sizes: `${size.width}x${size.height}`,
      type: "image/png",
      purpose: "any"
    }));
    
    // Thêm biểu tượng maskable
    generatedIcons.push({
      src: "/icons/app-icon-maskable-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    });
    
    generatedIcons.push({
      src: "/icons/app-icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    });
    
    // Kết hợp và loại bỏ trùng lặp
    const iconMap = new Map();
    [...existingIcons, ...generatedIcons].forEach(icon => {
      iconMap.set(icon.sizes + icon.purpose, icon);
    });
    
    manifest.icons = Array.from(iconMap.values());
    
    // Lưu manifest đã cập nhật
    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));
    console.log('Đã cập nhật manifest.json');
  } catch (error) {
    console.error('Lỗi khi cập nhật manifest.json:', error.message);
    // Sao chép manifest gốc nếu có lỗi
    if (fs.existsSync(manifestPath)) {
      fs.copyFileSync(manifestPath, distManifestPath);
    }
  }
}

// Thực hiện tối ưu hóa tất cả tài nguyên
async function optimizeAllAssets() {
  console.log('=== Tối ưu hóa tài nguyên cho production ===');
  
  // Tạo thư mục đích
  await setupOutputDirectories();
  
  // Xử lý từng thư mục hình ảnh
  for (const imageDir of IMAGE_DIRS) {
    const sourceDirPath = path.join(PUBLIC_DIR, imageDir);
    const destDirPath = path.join(DIST_DIR, imageDir);
    
    if (!fs.existsSync(sourceDirPath)) {
      console.log(`Thư mục ${imageDir} không tồn tại, bỏ qua.`);
      continue;
    }
    
    const files = fs.readdirSync(sourceDirPath);
    
    for (const file of files) {
      const sourcePath = path.join(sourceDirPath, file);
      const destPath = path.join(destDirPath, file);
      
      // Kiểm tra xem có phải là file hay không
      if (fs.statSync(sourcePath).isFile()) {
        const ext = path.extname(file).toLowerCase();
        
        // Xử lý các file hình ảnh
        if (IMAGE_EXTENSIONS.includes(ext)) {
          // Tối ưu hóa hình ảnh
          await optimizeImage(sourcePath, destPath);
          
          // Tạo các kích thước khác nhau nếu là biểu tượng
          if (imageDir === 'icons') {
            await generateIconSizes(sourcePath);
          }
        } else {
          // Sao chép các file không phải hình ảnh
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }
  }
  
  // Sao chép và tối ưu các hình ảnh ở thư mục gốc
  const rootFiles = fs.readdirSync(PUBLIC_DIR);
  
  for (const file of rootFiles) {
    const sourcePath = path.join(PUBLIC_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    
    // Kiểm tra xem có phải là file hay không
    if (fs.statSync(sourcePath).isFile()) {
      const ext = path.extname(file).toLowerCase();
      
      // Xử lý các file hình ảnh
      if (IMAGE_EXTENSIONS.includes(ext)) {
        await optimizeImage(sourcePath, destPath);
      } else {
        // Sao chép các file không phải hình ảnh
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
  
  // Cập nhật manifest.json
  updateManifest();
  
  console.log('=== Tối ưu hóa tài nguyên hoàn tất! ===');
}

// Chạy tối ưu hóa
optimizeAllAssets().catch(error => {
  console.error('Lỗi trong quá trình tối ưu hóa tài nguyên:', error);
  process.exit(1);
});