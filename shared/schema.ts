import { z } from "zod";

// Types for application schema

// User type
export type User = {
  id: number;
  username: string;
  password: string;
  email: string;
  displayName?: string | null;
  initialBalance: number;
  currentBalance: number;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
};

// Note: Goal types are now handled in Firebase

// Trade type
export type Trade = {
  id: number;
  userId: number;
  pair: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  entryDate: Date;
  closeDate?: Date | null;
  exitPrice?: number | null;
  result?: string | null;
  pips?: number | null;
  profitLoss?: number | null;
  strategy: string;
  techPattern?: string | null;
  emotion?: string | null;
  followedPlan: boolean;
  enteredEarly: boolean;
  revenge: boolean;
  overLeveraged: boolean;
  movedStopLoss: boolean;
  marketCondition?: string | null;
  sessionType?: string | null;
  hasNews: boolean;
  notes?: string | null;
  entryImage?: string | null;
  exitImage?: string | null;
  status?: string; // Added to fix the TS2339 errors
  riskRewardRatio?: number; // Added to fix the TS2339 errors
  isRevenge?: boolean; // Added to fix the TS2339 errors (redundant with revenge but needed for backward compatibility)
  createdAt: Date;
  updatedAt: Date;
};

// User insert schema
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  displayName: z.string().optional(),
  initialBalance: z.number().default(10000),
});

// Trade insert schema
export const insertTradeSchema = z.object({
  userId: z.number(),
  pair: z.string(),
  direction: z.string(),
  entryPrice: z.number(),
  stopLoss: z.number(),
  takeProfit: z.number(),
  lotSize: z.number(),
  entryDate: z.date(),
  closeDate: z.date().optional(),
  exitPrice: z.number().optional(),
  result: z.string().optional(),
  pips: z.number().optional(),
  profitLoss: z.number().optional(),
  strategy: z.string(),
  techPattern: z.string().optional(),
  emotion: z.string().optional(),
  followedPlan: z.boolean().default(true),
  enteredEarly: z.boolean().default(false),
  revenge: z.boolean().default(false),
  overLeveraged: z.boolean().default(false),
  movedStopLoss: z.boolean().default(false),
  marketCondition: z.string().optional(),
  sessionType: z.string().optional(),
  hasNews: z.boolean().default(false),
  notes: z.string().optional(),
  entryImage: z.string().optional(),
  exitImage: z.string().optional(),
});

// Note: Goal schemas are now handled in Firebase

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
