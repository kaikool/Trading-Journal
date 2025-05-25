/**
 * Dịch vụ Cloudinary - Xử lý tải lên, lấy và xóa ảnh từ Cloudinary
 * 
 * Thay thế hoàn toàn Firebase Storage trong hệ thống
 */

import { v2 as cloudinary } from 'cloudinary';
import { log } from './vite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Cấu hình Cloudinary với thông tin từ biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxi9ensjq',
  api_key: process.env.CLOUDINARY_API_KEY || '784331526282828',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9rbzDsR-tj87ao_NfDeX3lBoWPE',
  secure: true
});

/**
 * Tải ảnh lên Cloudinary
 * 
 * @param filePath - Đường dẫn đến file cần tải lên
 * @param folder - Thư mục lưu trữ trong Cloudinary
 * @param publicId - ID công khai của ảnh (tùy chọn)
 * @param tags - Các thẻ đính kèm với ảnh (tùy chọn)
 * @returns Kết quả tải lên 
 */
export async function uploadImage(
  filePath: string,
  folder: string,
  publicId?: string,
  tags?: string[]
) {
  try {
    const uploadOptions: any = {
      folder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      context: metadata
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (tags && tags.length > 0) {
      uploadOptions.tags = tags;
    }

    log(`Uploading file to Cloudinary: ${filePath}`, 'cloudinary-service');
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    log(`Successfully uploaded file to Cloudinary: ${result.public_id}`, 'cloudinary-service');

    return {
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      bytes: result.bytes,
      createdAt: result.created_at,
      tags: result.tags,
      assetId: result.asset_id,
      etag: result.etag
    };
  } catch (error) {
    log(`Error uploading to Cloudinary: ${error instanceof Error ? error.message : String(error)}`, 'cloudinary-service');
    throw error;
  }
}

/**
 * Xóa ảnh từ Cloudinary
 * 
 * @param publicId - ID công khai của ảnh cần xóa
 * @returns Kết quả xóa
 */
export async function deleteImage(publicId: string) {
  try {
    log(`Deleting image from Cloudinary: ${publicId}`, 'cloudinary-service');
    const result = await cloudinary.uploader.destroy(publicId);
    log(`Image delete result: ${result.result}`, 'cloudinary-service');
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    log(`Error deleting from Cloudinary: ${error instanceof Error ? error.message : String(error)}`, 'cloudinary-service');
    throw error;
  }
}

/**
 * Tạo URL thumbnail từ URL Cloudinary gốc
 * 
 * @param originalUrl - URL gốc của ảnh Cloudinary
 * @param width - Chiều rộng mong muốn của thumbnail
 * @param height - Chiều cao mong muốn của thumbnail 
 * @returns URL của thumbnail
 */
export function generateThumbnailUrl(originalUrl: string, width: number = 200, height: number = 200) {
  try {
    if (!originalUrl.includes('cloudinary.com')) {
      return originalUrl;
    }

    // Phân tích URL cloudinary
    const urlParts = originalUrl.split('/upload/');
    if (urlParts.length !== 2) {
      return originalUrl;
    }

    // Tạo đường dẫn mới với tham số kích thước và không bo góc (r_0)
    const thumbnailUrl = `${urlParts[0]}/upload/c_fill,w_${width},h_${height},r_0/${urlParts[1]}`;
    return thumbnailUrl;
  } catch (error) {
    log(`Error generating thumbnail URL: ${error instanceof Error ? error.message : String(error)}`, 'cloudinary-service');
    return originalUrl;
  }
}



/**
 * Lấy public ID từ URL Cloudinary
 * 
 * @param url - URL Cloudinary cần phân tích
 * @returns Public ID của ảnh
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    // URL Cloudinary có dạng: https://res.cloudinary.com/cloud-name/image/upload/[transformations]/public-id
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) {
      return null;
    }

    // Phần sau upload/ có thể có transformations, nên cần tách từ sau dấu /
    let parts = urlParts[1].split('/');
    // Phần cuối cùng chứa public_id
    const publicIdWithExt = parts[parts.length - 1];
    
    // Loại bỏ phần extension để lấy public_id gốc
    // Note: không sử dụng publicIdWithExt.lastIndexOf('.') nữa, chỉ sử dụng fullPublicId

    // Nếu còn transformations, phần public ID sẽ nằm sau phần transform
    // Ví dụ: v1234/folder/public_id.jpg
    const fullPublicId = parts.slice(parts.length > 1 ? 1 : 0).join('/');
    
    return fullPublicId.includes('.') 
      ? fullPublicId.substring(0, fullPublicId.lastIndexOf('.'))
      : fullPublicId;
  } catch (error) {
    log(`Error extracting public ID from URL: ${error instanceof Error ? error.message : String(error)}`, 'cloudinary-service');
    return null;
  }
}

