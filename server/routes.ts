import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertTradeSchema
} from "@shared/schema";

import { uploadImage } from "./cloudinary-service";
import { promises as fs } from 'fs';
import path from 'path';


export async function registerRoutes(app: Express): Promise<Server> {
  // Phục vụ các tập tin tĩnh từ thư mục public với content-type phù hợp
  app.use(express.static('public', {
    setHeaders: (res, path) => {
      // Đặt content-type đúng cho các file SVG
      if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    }
  }));
  
  // Phục vụ các tập tin uploads
  app.use('/uploads', express.static('uploads'));
  

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ success: true, user });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid user data" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      
      res.json({ success: true, user });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid login data" 
      });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch user" 
      });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to update user" 
      });
    }
  });

  // Trade routes
  app.post("/api/trades", async (req, res) => {
    try {
      const tradeData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(tradeData);
      res.json({ success: true, trade });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid trade data" 
      });
    }
  });

  app.get("/api/trades", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const trades = await storage.getTradesByUserId(userId);
      res.json({ success: true, trades });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch trades" 
      });
    }
  });

  app.get("/api/trades/:id", async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTradeById(tradeId);
      
      if (!trade) {
        return res.status(404).json({ success: false, message: "Trade not found" });
      }
      
      res.json({ success: true, trade });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch trade" 
      });
    }
  });

  app.put("/api/trades/:id", async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const tradeData = req.body;
      
      const updatedTrade = await storage.updateTrade(tradeId, tradeData);
      res.json({ success: true, trade: updatedTrade });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to update trade" 
      });
    }
  });

  app.delete("/api/trades/:id", async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      await storage.deleteTrade(tradeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to delete trade" 
      });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const stats = await storage.getTradeStats(userId);
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch trade stats" 
      });
    }
  });

  app.get("/api/analytics/performance", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const performance = await storage.getPerformanceData(userId);
      res.json({ success: true, performance });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch performance data" 
      });
    }
  });


  // Debug route để kiểm tra trạng thái logging TradingView
  app.get("/api/tradingview/debug", async (req, res) => {
    try {
      const debugInfo = getDebugInfo();
      res.json({
        success: true,
        debug: debugInfo,
        timestamp: new Date().toISOString(),
        help: {
          enableDebug: "Thêm DEBUG=true vào file .env để bật debug mode",
          enableFileLogging: "Thêm LOG_TRADINGVIEW=true vào file .env để lưu log ra file",
          logLocation: debugInfo.logDirectory + "/tradingview-capture-*.log"
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get debug info"
      });
    }
  });

  // TradingView Chart Capture API
  app.post("/api/tradingview/capture", async (req, res) => {
    try {
      const { pair, timeframe, userId, tradeId } = z.object({
        pair: z.string(),
        timeframe: z.enum(['H4', 'M15']),
        userId: z.string().optional(),
        tradeId: z.string().optional()
      }).parse(req.body);

      console.log(`🎯 Bắt đầu capture ${pair} ${timeframe}`);

      // Capture ảnh từ TradingView với logging chi tiết
      const captureResult = await captureTradingViewChart({ pair, timeframe });
      
      if (!captureResult.success || !captureResult.imageBuffer) {
        return res.status(500).json({
          success: false,
          message: captureResult.error || 'Failed to capture chart',
          logSummary: captureResult.logSummary // Bao gồm thông tin debug
        });
      }

      // Tạo temporary file để upload lên Cloudinary
      const tempDir = path.join(process.cwd(), 'temp');
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (e) {
        // Directory already exists
      }

      const fileName = `tradingview_${pair}_${timeframe}_${Date.now()}.png`;
      const tempFilePath = path.join(tempDir, fileName);
      
      // Ghi buffer vào file tạm
      await fs.writeFile(tempFilePath, captureResult.imageBuffer);

      try {
        // Upload lên Cloudinary
        const folder = userId && tradeId ? `trades/${userId}/${tradeId}` : 'tradingview_captures';
        const publicId = `${pair}_${timeframe}_${Date.now()}`;
        const tags = ['tradingview', 'auto-capture', pair, timeframe];

        const uploadResult = await uploadImage(tempFilePath, folder, publicId, tags);

        // Xóa file tạm
        await fs.unlink(tempFilePath).catch(() => {});

        console.log(`✅ Upload thành công: ${uploadResult.imageUrl}`);

        res.json({
          success: true,
          imageUrl: uploadResult.imageUrl,
          publicId: uploadResult.publicId,
          pair,
          timeframe,
          logSummary: captureResult.logSummary // Bao gồm thông tin debug
        });

      } catch (uploadError) {
        // Xóa file tạm nếu upload thất bại
        await fs.unlink(tempFilePath).catch(() => {});
        
        console.error('❌ Lỗi upload Cloudinary:', uploadError);
        
        res.status(500).json({
          success: false,
          message: 'Captured chart but failed to upload to Cloudinary'
        });
      }

    } catch (error) {
      console.error('❌ Lỗi capture TradingView:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture TradingView chart'
      });
    }
  });

  // Capture cả H4 và M15 cùng lúc
  app.post("/api/tradingview/capture-all", async (req, res) => {
    try {
      const { pair, userId, tradeId } = z.object({
        pair: z.string(),
        userId: z.string().optional(),
        tradeId: z.string().optional()
      }).parse(req.body);

      console.log(`🎯 Bắt đầu capture tất cả timeframes cho ${pair}`);

      const results = await captureAllTimeframes(pair);
      const uploadResults: any = {};
      
      // Process H4 result
      if (results.h4.success && results.h4.imageBuffer) {
        try {
          // Tạo temporary file
          const tempDir = path.join(process.cwd(), 'temp');
          await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
          
          const fileName = `tradingview_${pair}_H4_${Date.now()}.png`;
          const tempFilePath = path.join(tempDir, fileName);
          
          await fs.writeFile(tempFilePath, results.h4.imageBuffer);
          
          const folder = userId && tradeId ? `trades/${userId}/${tradeId}` : 'tradingview_captures';
          const publicId = `${pair}_H4_${Date.now()}`;
          const tags = ['tradingview', 'auto-capture', pair, 'H4'];
          
          const uploadResult = await uploadImage(tempFilePath, folder, publicId, tags);
          await fs.unlink(tempFilePath).catch(() => {});
          
          uploadResults.h4 = {
            success: true,
            imageUrl: uploadResult.imageUrl,
            publicId: uploadResult.publicId
          };
        } catch (error) {
          uploadResults.h4 = {
            success: false,
            error: 'Failed to upload H4 chart'
          };
        }
      } else {
        uploadResults.h4 = {
          success: false,
          error: results.h4.error || 'Failed to capture H4 chart'
        };
      }

      // Process M15 result
      if (results.m15.success && results.m15.imageBuffer) {
        try {
          const tempDir = path.join(process.cwd(), 'temp');
          await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
          
          const fileName = `tradingview_${pair}_M15_${Date.now()}.png`;
          const tempFilePath = path.join(tempDir, fileName);
          
          await fs.writeFile(tempFilePath, results.m15.imageBuffer);
          
          const folder = userId && tradeId ? `trades/${userId}/${tradeId}` : 'tradingview_captures';
          const publicId = `${pair}_M15_${Date.now()}`;
          const tags = ['tradingview', 'auto-capture', pair, 'M15'];
          
          const uploadResult = await uploadImage(tempFilePath, folder, publicId, tags);
          await fs.unlink(tempFilePath).catch(() => {});
          
          uploadResults.m15 = {
            success: true,
            imageUrl: uploadResult.imageUrl,
            publicId: uploadResult.publicId
          };
        } catch (error) {
          uploadResults.m15 = {
            success: false,
            error: 'Failed to upload M15 chart'
          };
        }
      } else {
        uploadResults.m15 = {
          success: false,
          error: results.m15.error || 'Failed to capture M15 chart'
        };
      }

      res.json({
        success: true,
        results: uploadResults,
        pair
      });

    } catch (error) {
      console.error('❌ Lỗi capture all timeframes:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture charts'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
