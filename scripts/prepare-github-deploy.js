/**
 * Script chuẩn bị cho triển khai GitHub Actions
 * 
 * Script này giúp:
 * 1. Tạo file config.js từ config-template.js
 * 2. Thay thế các biến môi trường với giá trị từ GitHub Secrets
 * 3. Đảm bảo tất cả các file cần thiết đều có trong build
 * 
 * Sử dụng: Chạy script này trong quy trình CI/CD trước khi build.
 */

const fs = require('fs');
const path = require('path');

// Đường dẫn tới các file
const CONFIG_TEMPLATE_PATH = path.join(__dirname, '../public/config-template.js');
const CONFIG_OUTPUT_PATH = path.join(__dirname, '../public/config.js');
const CONFIG_DIST_PATH = path.join(__dirname, '../dist/config.js');

// Đọc template
try {
  console.log('📄 Đọc file config template...');
  const templateContent = fs.readFileSync(CONFIG_TEMPLATE_PATH, 'utf8');

  // Thay thế các giá trị từ biến môi trường
  console.log('🔄 Thay thế các biến môi trường...');
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID';
  
  let configContent = templateContent
    .replace(/YOUR_PROJECT_ID/g, projectId)
    .replace(/YOUR_API_KEY/g, process.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY')
    .replace(/YOUR_APP_ID/g, process.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID')
    .replace(/YOUR_MEASUREMENT_ID/g, process.env.VITE_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID')
    .replace(/YOUR_SENDER_ID/g, process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID')
    .replace(/YOUR_REGION/g, 'asia-southeast1'); // Thay bằng vùng thực tế của bạn

  // Ghi file config.js
  console.log('💾 Ghi file config.js...');
  fs.writeFileSync(CONFIG_OUTPUT_PATH, configContent);
  console.log('✅ Đã tạo file config.js thành công!');
  
  // Kiểm tra các file quan trọng khác
  console.log('🔍 Kiểm tra các file quan trọng khác...');
  const criticalFiles = [
    path.join(__dirname, '../firebase.json'),
    path.join(__dirname, '../storage.rules')
  ];
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✓ File ${path.basename(file)} tồn tại.`);
    } else {
      console.error(`  ✗ CẢNH BÁO: File ${path.basename(file)} không tồn tại!`);
    }
  }
  
  console.log('\n🚀 Đã chuẩn bị xong cho triển khai!');
  
} catch (error) {
  console.error('❌ Lỗi khi chuẩn bị cho triển khai:', error);
  process.exit(1);
}