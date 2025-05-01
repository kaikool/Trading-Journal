import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Kiểm tra và tải môi trường từ các file .env
function loadEnvironmentVariables() {
  try {
    // Thứ tự ưu tiên: .env.local > .env
    const envFiles = ['.env', '.env.local'];
    let loaded = false;
    
    for (const file of envFiles) {
      const envPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        log(`Loaded environment from ${file}`, "startup");
        loaded = true;
      }
    }
    
    if (!loaded) {
      log("No .env files found. Using existing environment variables.", "startup");
    }
    
    // Kiểm tra các biến môi trường quan trọng
    verifyEnvironment();
  } catch (error) {
    log(`Error loading environment: ${error instanceof Error ? error.message : String(error)}`, "startup");
    // Tiếp tục chạy với biến môi trường mặc định
  }
}

// Kiểm tra và log các cảnh báo về cấu hình thiếu
function verifyEnvironment() {
  const requiredApiKeys = {
    // Đã xóa GEMINI_API_KEY theo yêu cầu
  };
  
  const optionalApiKeys = {
    // Để trống, không còn phụ thuộc vào API keys bên ngoài
  };
  
  // Kiểm tra các API key bắt buộc
  let missingRequired = false;
  Object.entries(requiredApiKeys).forEach(([key, feature]) => {
    if (!process.env[key]) {
      log(`⚠️ MISSING REQUIRED API KEY: ${key} for ${feature}. Some features will not work.`, "startup");
      missingRequired = true;
    }
  });
  
  // Kiểm tra các API key tùy chọn
  const missingOptionalKeys: string[] = [];
  Object.entries(optionalApiKeys).forEach(([key, feature]) => {
    if (!process.env[key]) {
      missingOptionalKeys.push(key);
    }
  });
  
  // Không cần kiểm tra API keys bên ngoài nữa
  
  // Hướng dẫn thiết lập trong môi trường phát triển
  if (missingRequired && process.env.NODE_ENV !== 'production') {
    log("\n👉 Please run 'node scripts/setup-api-keys.js' to configure your API keys.", "startup");
    log("👉 Or see HUONG-DAN-CAI-DAT-API.md for manual setup instructions.\n", "startup");
  }
}

// Tải biến môi trường trước khi bắt đầu ứng dụng
loadEnvironmentVariables();

// Khởi tạo Express app
const app = express();
app.use(express.json({ limit: '50mb' })); // Tăng giới hạn kích thước request
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Middleware xử lý lỗi JSON format
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON format' });
  }
  next();
});

// Middleware ghi log request
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Chỉ log dữ liệu phản hồi khi không phải là production và không chứa thông tin nhạy cảm
      if (capturedJsonResponse && process.env.NODE_ENV !== 'production') {
        // Ẩn thông tin nhạy cảm nếu có
        const sanitizedResponse = { ...capturedJsonResponse };
        if (sanitizedResponse.user?.password) sanitizedResponse.user.password = '[REDACTED]';
        if (sanitizedResponse.token) sanitizedResponse.token = '[REDACTED]';
        
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 100) {
        logLine = logLine.slice(0, 99) + "…";
      }

      log(logLine, "api");
    }
  });

  next();
});

// Xử lý nhiều yêu cầu đồng thời với Promise
(async () => {
  try {
    // Đăng ký API routes
    const server = await registerRoutes(app);

    // Middleware xử lý lỗi toàn cục
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const errorId = Date.now().toString();
      
      // Log chi tiết lỗi với ID để dễ theo dõi
      log(`Error [${errorId}]: ${message}`, "error");
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Full error stack [${errorId}]:`, err);
      }

      // Trả về phản hồi lỗi cho client
      res.status(status).json({ 
        success: false,
        message,
        errorId,
        details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    });

    // Cấu hình Vite cho môi trường phát triển
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Khởi động server
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server started successfully on port ${port}`, "startup");
      log(`Environment: ${process.env.NODE_ENV || 'development'}`, "startup");
      log(`API available at http://localhost:${port}/api`, "startup");
    });
    
    // Xử lý các sự kiện process
    process.on('SIGTERM', () => {
      log('SIGTERM received. Shutting down gracefully.', "shutdown");
      server.close(() => {
        log('Server closed.', "shutdown");
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      log('SIGINT received. Shutting down gracefully.', "shutdown");
      server.close(() => {
        log('Server closed.', "shutdown");
        process.exit(0);
      });
    });
    
  } catch (error) {
    log(`Fatal error during startup: ${error instanceof Error ? error.message : String(error)}`, "startup");
    console.error("Detailed startup error:", error);
    process.exit(1);
  }
})();
