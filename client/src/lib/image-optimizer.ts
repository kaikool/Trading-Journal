/**
 * Image Optimizer Utility
 * 
 * Cung cấp các hàm để tối ưu hóa ảnh trước khi tải lên Firebase Storage
 * - Resize ảnh theo kích thước phù hợp
 * - Nén ảnh để giảm dung lượng
 * - Chuyển đổi định dạng nếu cần thiết
 */

/**
 * Tối ưu hóa ảnh trước khi upload
 * Sử dụng Canvas API để:
 * 1. Resize ảnh về kích thước phù hợp
 * 2. Nén ảnh để giảm dung lượng
 * 
 * @param file File ảnh cần tối ưu hóa
 * @param options Tùy chọn tối ưu hóa
 * @returns Promise<File> File ảnh đã được tối ưu hóa
 */
export async function optimizeImage(
  file: File,
  options: {
    maxWidth?: number,
    maxHeight?: number,
    quality?: number,
    maxSizeKB?: number,
    outputFormat?: 'jpeg' | 'png' | 'webp' | 'original'
  } = {}
): Promise<File> {
  // Mặc định các tùy chọn nếu không được cung cấp
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.85,
    maxSizeKB = 1024, // Giới hạn 1MB
    outputFormat = 'original'
  } = options;

  // Trả về file gốc nếu không phải ảnh
  if (!file.type.startsWith('image/')) {
    console.log('Không phải file ảnh, trả về bản gốc');
    return file;
  }

  // Trả về file gốc nếu đã đủ nhỏ và không cần resize
  if (file.size <= maxSizeKB * 1024) {
    const img = await createImageBitmap(file);
    if (img.width <= maxWidth && img.height <= maxHeight) {
      console.log('File đã đủ nhỏ, không cần tối ưu');
      img.close();
      return file;
    }
    img.close();
  }

  // Tạo URL cho ảnh
  const url = URL.createObjectURL(file);
  
  try {
    // Tải ảnh vào element để xử lý
    const img = await loadImage(url);
    
    // Tính toán kích thước mới giữ nguyên tỷ lệ
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      maxWidth,
      maxHeight
    );
    
    // Tạo canvas với kích thước mới
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Vẽ ảnh lên canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không thể tạo canvas context');
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Xác định định dạng đầu ra
    let mimeType = file.type;
    if (outputFormat !== 'original') {
      mimeType = `image/${outputFormat}`;
    }
    
    // Nén theo chất lượng cao nhất chỉ khi cần thiết
    let currentQuality = quality;
    let blob: Blob | null = null;
    
    // Lặp đến khi đạt được kích thước mong muốn hoặc chất lượng quá thấp
    while (currentQuality >= 0.5) {
      blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, mimeType, currentQuality);
      });
      
      if (!blob) break;
      
      // Kiểm tra kích thước blob sau khi nén
      if (blob.size <= maxSizeKB * 1024) break;
      
      // Giảm chất lượng và thử lại
      currentQuality -= 0.05;
    }
    
    // Nếu vẫn không đủ nhỏ, giảm kích thước và thử lại
    if (blob && blob.size > maxSizeKB * 1024) {
      // Tính lại kích thước mới
      const scaleFactor = Math.sqrt(maxSizeKB * 1024 / blob.size);
      const newWidth = Math.floor(width * scaleFactor);
      const newHeight = Math.floor(height * scaleFactor);
      
      // Reset và vẽ lại với kích thước mới
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Thử nén lại
      blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, mimeType, quality);
      });
    }
    
    // Tạo file từ blob
    if (blob) {
      // Tạo tên file dựa trên định dạng mới
      const parts = file.name.split('.');
      const extension = parts.pop() || '';
      let newExtension = extension;
      
      if (outputFormat !== 'original') {
        newExtension = outputFormat;
      }
      
      const baseName = parts.join('.');
      const fileName = `${baseName}.${newExtension}`;
      
      // Log để theo dõi tỷ lệ nén
      console.log(`Tối ưu hóa: ${file.size / 1024} KB -> ${blob.size / 1024} KB (${Math.round(blob.size / file.size * 100)}%)`);
      
      return new File([blob], fileName, { type: mimeType });
    }
  } catch (error) {
    console.error('Lỗi khi tối ưu hóa ảnh:', error);
  } finally {
    // Giải phóng URL
    URL.revokeObjectURL(url);
  }
  
  // Trả về file gốc nếu xử lý thất bại
  return file;
}

/**
 * Tính toán kích thước mới giữ nguyên tỷ lệ ảnh
 */
function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = srcWidth / srcHeight;
  
  let width = srcWidth;
  let height = srcHeight;
  
  // Giảm kích thước nếu cần
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.floor(width),
    height: Math.floor(height)
  };
}

/**
 * Tải ảnh từ URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}