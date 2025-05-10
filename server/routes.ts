import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertTradeSchema,
  insertGoalSchema,
  insertGoalMilestoneSchema
} from "@shared/schema";
import { registerBatchEndpoints } from "./batch-api";
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

  // Goals routes
  app.post("/api/goals", async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(goalData);
      res.json({ success: true, goal });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid goal data" 
      });
    }
  });

  app.get("/api/goals", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const goals = await storage.getGoalsByUserId(userId);
      res.json({ success: true, goals });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch goals" 
      });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoalById(goalId);
      
      if (!goal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
      }
      
      res.json({ success: true, goal });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch goal" 
      });
    }
  });

  app.put("/api/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goalData = req.body;
      
      // Check if goal exists
      const existingGoal = await storage.getGoalById(goalId);
      if (!existingGoal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, goalData);
      res.json({ success: true, goal: updatedGoal });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to update goal" 
      });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // Check if goal exists
      const existingGoal = await storage.getGoalById(goalId);
      if (!existingGoal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
      }
      
      await storage.deleteGoal(goalId);
      res.json({ success: true, message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to delete goal" 
      });
    }
  });

  // Goal Milestones routes
  app.post("/api/goals/:goalId/milestones", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      
      // Check if goal exists
      const existingGoal = await storage.getGoalById(goalId);
      if (!existingGoal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
      }
      
      const milestoneData = insertGoalMilestoneSchema.parse({
        ...req.body,
        goalId
      });
      
      const milestone = await storage.createGoalMilestone(milestoneData);
      res.json({ success: true, milestone });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid milestone data" 
      });
    }
  });

  app.get("/api/goals/:goalId/milestones", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      
      // Check if goal exists
      const existingGoal = await storage.getGoalById(goalId);
      if (!existingGoal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
      }
      
      const milestones = await storage.getGoalMilestonesByGoalId(goalId);
      res.json({ success: true, milestones });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch milestones" 
      });
    }
  });

  app.put("/api/goals/milestones/:id", async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const milestoneData = req.body;
      
      // Update milestone
      const updatedMilestone = await storage.updateGoalMilestone(milestoneId, milestoneData);
      res.json({ success: true, milestone: updatedMilestone });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to update milestone" 
      });
    }
  });

  app.delete("/api/goals/milestones/:id", async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      await storage.deleteGoalMilestone(milestoneId);
      res.json({ success: true, message: "Milestone deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to delete milestone" 
      });
    }
  });

  // Goals Progress Analytics
  app.get("/api/analytics/goals-progress", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const progress = await storage.getGoalsProgress(userId);
      res.json({ success: true, progress });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch goals progress" 
      });
    }
  });
  
  // Calculate goal progress automatically
  app.post("/api/goals/:id/calculate-progress", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // Check if goal exists
      const existingGoal = await storage.getGoalById(goalId);
      if (!existingGoal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
      }
      
      const progressPercentage = await storage.calculateGoalProgress(goalId);
      const updatedGoal = await storage.getGoalById(goalId);
      
      res.json({ 
        success: true, 
        progress: progressPercentage,
        goal: updatedGoal
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to calculate goal progress" 
      });
    }
  });

  // Đăng ký batch API endpoints
  registerBatchEndpoints(app);
  
  const httpServer = createServer(app);
  return httpServer;
}
