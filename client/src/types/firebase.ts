// Cloudinary interfaces for image management
export interface CloudinaryUploadResponse {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  resourceType: string;
}

export interface ImageUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  error?: string;
}

export interface ImageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface ImageDeleteResult {
  success: boolean;
  message?: string;
  error?: string;
}