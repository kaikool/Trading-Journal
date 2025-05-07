import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertTradeSchema } from "@shared/schema";
import { setupUploadRoutes } from "./upload-service";
import { registerBatchEndpoints } from "./batch-api";
import { registerTwelveDataRoutes } from "./twelvedata-api";
import { log } from "./vite";

import { admin, db } from "./firebase-admin";

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






  // Đăng ký batch API endpoints
  registerBatchEndpoints(app);

  // Thiết lập service upload ảnh
  setupUploadRoutes(app);
  
  // Đăng ký TwelveData API endpoints
  registerTwelveDataRoutes(app);
  
  const httpServer = createServer(app);
  return httpServer;
}
