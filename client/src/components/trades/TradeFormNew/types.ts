import { z } from "zod";
import { Trade, TradingStrategy, StrategyConditionCheck } from "@/types";

// Define the form schema with Zod
export const tradeFormSchema = z.object({
  pair: z.string({
    required_error: "Currency pair is required"
  }).min(1, { message: "Please select a currency pair" }),
  direction: z.enum(["BUY", "SELL"], {
    required_error: "Direction is required"
  }),
  entryPrice: z.number({
    required_error: "Entry price is required",
    invalid_type_error: "Entry price must be a number"
  }).refine(value => value > 0, {
    message: "Entry price must be greater than 0",
  }),
  stopLoss: z.number({
    required_error: "Stop loss is required",
    invalid_type_error: "Stop loss must be a number"
  }).refine(value => value > 0, {
    message: "Stop loss must be greater than 0",
  }),
  takeProfit: z.number({
    required_error: "Take profit is required",
    invalid_type_error: "Take profit must be a number"
  }).refine(value => value > 0, {
    message: "Take profit must be greater than 0",
  }),
  lotSize: z.number({
    required_error: "Lot size is required",
    invalid_type_error: "Lot size must be a number"
  }).refine(value => value > 0, {
    message: "Lot size must be a positive number",
  }),
  entryDate: z.string({
    required_error: "Entry date is required"
  }).min(1, { message: "Entry date is required" }),
  strategy: z.string({
    required_error: "Trading strategy is required"
  }).min(1, { message: "Please select a trading strategy" }),
  techPattern: z.string().optional(),
  emotion: z.string({
    required_error: "Emotion is required" 
  }).min(1, { message: "Please select your emotion" }),
  followedPlan: z.boolean().default(true),
  enteredEarly: z.boolean().default(false),
  revenge: z.boolean().default(false),
  overLeveraged: z.boolean().default(false),
  movedStopLoss: z.boolean().default(false),
  marketCondition: z.string().optional(),
  sessionType: z.string().optional(),
  hasNews: z.boolean().default(false),
  notes: z.string().optional(),
  // Fields related to closing trades
  isOpen: z.boolean().optional(),
  exitPrice: z.number().nullable().optional(),
  result: z.enum(["TP", "SL", "BE", "MANUAL"]).optional(),
  closingNote: z.string().optional(),
});

export type TradeFormValues = z.infer<typeof tradeFormSchema>;

// Props for new trade mode
export interface NewTradeProps {
  mode?: "new";
  userId: string;
  onSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  initialValues?: never;
}

// Props for edit trade mode
export interface EditTradeProps {
  mode: "edit";
  userId: string;
  initialValues: Trade;
  onSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  onChange?: () => void;
}

// Unified props type
export type TradeFormProps = NewTradeProps | EditTradeProps;

// For draft management
export const DRAFT_KEY_PREFIX = 'trade_draft_';
export const DRAFT_SAVE_DELAY = 2000; // 2 seconds

// Image state type
export interface ImageState {
  file: File | null;
  preview: string | null;
  error: string | null;
  uploadProgress: number;
  downloadUrl: string | null;
  uploadSuccess: boolean;
  isUploading: boolean;
}

// FormContext type for provider
export interface TradeFormContextType {
  // Form state
  isEditMode: boolean;
  isFormSubmitting: boolean;
  isSuccess: boolean;
  isLoadingUserData: boolean;
  
  // Draft state
  hasDraft: boolean;
  showDraftNotice: boolean;
  isDraftLoading: boolean;
  isDraftSaving: boolean;
  
  // Balance and risk calculation
  accountBalance: number;
  riskPercentage: number;
  riskRewardRatio: number;
  defaultRiskRewardRatio: number;
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  
  // Price fetching state
  canFetchPrice: boolean;
  
  // Strategy state
  strategies: TradingStrategy[];
  isLoadingStrategies: boolean;
  selectedStrategy: TradingStrategy | null;
  strategyLoaded: boolean;
  strategyChecks: StrategyConditionCheck[];
  
  // Images state
  entryImages: {
    image1: ImageState;
    image2: ImageState;
  };
  exitImages: {
    image1: ImageState;
    image2: ImageState;
  };
  
  // Form methods
  loadDraft: () => void;
  clearDraft: () => void;
  handleImageChange: (type: 'entry' | 'exit', index: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (type: 'entry' | 'exit', index: 1 | 2) => () => void;
  onSubmit: (data: TradeFormValues) => Promise<void>;
}