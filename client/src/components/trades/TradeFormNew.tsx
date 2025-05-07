import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, StorageError } from "firebase/storage";
import { Toast } from "@/components/ui/toast";
import { debug, logError, logWarning } from "@/lib/debug";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
// React Components & UI
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { useNumberInput } from "@/hooks/use-number-input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Import component tùy chỉnh và service
import { GetPriceButton } from './GetPriceButton';
import { isSymbolSupported } from '@/lib/market-price-service';


// Types & Utils
import { CurrencyPair, Direction, TradeResult } from "@/lib/forex-calculator";
import { Trade, TradingStrategy, StrategyConditionCheck } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { DASHBOARD_CONFIG } from "@/lib/config";
import { StrategyChecklist } from "./StrategyChecklistComponent";

// Firebase & Services
import { db, storage } from "@/lib/firebase";
import { addTrade, updateTrade, getUserData, getStrategies, onTradesSnapshot } from "@/lib/firebase";
import { uploadTradeImage } from "@/lib/api-service";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { calculateCurrentBalance } from "@/lib/balance-calculation-rules";

import { 
  calculateLotSize, 
  calculateRiskRewardRatio, 
  calculatePips, 
  calculateProfit, 
  formatPrice
} from "@/lib/forex-calculator";

// Icons - Chỉ import các icon thực sự cần thiết
import { 
  ArrowUp, 
  ArrowDown, 
  Percent, 
  Upload, 
  Calendar, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Info,
  Clock,
  Lightbulb,
  Ban,
  LineChart,
  Plus,
  Zap,
  Unlock,
  Download,
  Trash2
} from "lucide-react";
// Hàm để xử lý đường dẫn ảnh từ database để hiển thị đúng
function fixImagePath(path: string | null | undefined): string | null {
  if (!path) return null;
  
  // Nếu đã là URL đầy đủ (https://), giữ nguyên
  if (path.startsWith('http')) {
    return path;
  }
  
  // Đường dẫn có thể bắt đầu bằng /uploads
  // Vì tệp được lưu ở /uploads/{userId}/{tradeId}/{filename}
  // chúng ta chỉ cần thêm origin trước đường dẫn
  return `${window.location.origin}${path}`;
}

// Define the form schema with Zod
const tradeFormSchema = z.object({
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
  // Thêm các trường liên quan đến đóng giao dịch
  isOpen: z.boolean().optional(),
  exitPrice: z.number().nullable().optional(),
  result: z.enum(["TP", "SL", "BE", "MANUAL"]).optional(),
  closingNote: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

// Props for new trade mode
interface NewTradeProps {
  mode?: "new";
  userId: string;
  onSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  initialValues?: never;
}

// Props for edit trade mode
interface EditTradeProps {
  mode: "edit";
  userId: string;
  initialValues: Trade;
  onSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  onChange?: () => void;
}

// Unified props type
type TradeFormProps = NewTradeProps | EditTradeProps;

// Helper functions for draft management
const DRAFT_KEY_PREFIX = 'trade_draft_';

export default function TradeFormNew(props: TradeFormProps) {
  const { userId, onSubmitting, onSuccess, onError } = props;
  const isEditMode = props.mode === "edit";
  const initialValues = isEditMode ? props.initialValues : undefined;
  
  // Create component-specific debug helper function
  const devLog = (message: string, data?: any) => {
    debug(`[TradeForm] ${message}`, data);
  };
  
  // Constants for draft management
  const DRAFT_SAVE_DELAY = 2000; // 2 seconds
  
  // State for draft management
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [showDraftNotice, setShowDraftNotice] = useState<boolean>(false);
  const [isDraftLoading, setIsDraftLoading] = useState<boolean>(false);
  const [isDraftSaving, setIsDraftSaving] = useState<boolean>(false);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  // Load draft from localStorage
  const loadDraftFromLocalStorage = (userId: string): { formData: any, imageUrls: any, timestamp: string } | null => {
    if (!userId) return null;
    
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
      const draftJson = localStorage.getItem(draftKey);
      
      if (!draftJson) return null;
      
      const draft = JSON.parse(draftJson);
      return draft;
    } catch (error) {
      logError('Error loading draft from localStorage:', error);
      return null;
    }
  };
  
  // Clear draft from localStorage
  const clearDraftFromLocalStorage = (userId: string): boolean => {
    if (!userId) return false;
    
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
      localStorage.removeItem(draftKey);
      return true;
    } catch (error) {
      logError('Error clearing draft from localStorage:', error);
      return false;
    }
  };
  
  // Function to save draft to localStorage with debouncing
  const saveDraftToLocalStorage = (userId: string, formData: any, imageUrls: any) => {
    // If editing an existing trade, don't save drafts
    if (isEditMode) return;
    
    // Clear any existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
    
    setIsDraftSaving(true);
    
    // Set a new timeout for saving
    draftSaveTimeoutRef.current = setTimeout(() => {
      try {
        const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
        const draftData = {
          formData,
          imageUrls,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setHasDraft(true);
        debug('Draft saved successfully');
      } catch (error) {
        logError('Error saving draft to localStorage:', error);
      } finally {
        setIsDraftSaving(false);
      }
    }, DRAFT_SAVE_DELAY);
  };
  

  
  // Entry images (now limited to 2 as per requirements)
  const [entryImage1File, setEntryImage1File] = useState<File | null>(null);
  const [entryImage2File, setEntryImage2File] = useState<File | null>(null);
  const [entryImage1Preview, setEntryImage1Preview] = useState<string | null>(null);
  const [entryImage2Preview, setEntryImage2Preview] = useState<string | null>(null);
  const [entryImage1Error, setEntryImage1Error] = useState<string | null>(null);
  const [entryImage2Error, setEntryImage2Error] = useState<string | null>(null);
  const [entryImage1UploadProgress, setEntryImage1UploadProgress] = useState<number>(0);
  const [entryImage2UploadProgress, setEntryImage2UploadProgress] = useState<number>(0);
  const [entryImage1DownloadUrl, setEntryImage1DownloadUrl] = useState<string | null>(null);
  const [entryImage2DownloadUrl, setEntryImage2DownloadUrl] = useState<string | null>(null);
  const [entryImage1UploadSuccess, setEntryImage1UploadSuccess] = useState<boolean>(false);
  const [entryImage2UploadSuccess, setEntryImage2UploadSuccess] = useState<boolean>(false);
  
  // Exit images (for closed trades)
  const [exitImage1File, setExitImage1File] = useState<File | null>(null);
  const [exitImage2File, setExitImage2File] = useState<File | null>(null);
  const [exitImage1Preview, setExitImage1Preview] = useState<string | null>(null);
  const [exitImage2Preview, setExitImage2Preview] = useState<string | null>(null);
  const [exitImage1Error, setExitImage1Error] = useState<string | null>(null);
  const [exitImage2Error, setExitImage2Error] = useState<string | null>(null);
  const [exitImage1UploadProgress, setExitImage1UploadProgress] = useState<number>(0);
  const [exitImage2UploadProgress, setExitImage2UploadProgress] = useState<number>(0);
  const [exitImage1DownloadUrl, setExitImage1DownloadUrl] = useState<string | null>(null);
  const [exitImage2DownloadUrl, setExitImage2DownloadUrl] = useState<string | null>(null);
  const [exitImage1UploadSuccess, setExitImage1UploadSuccess] = useState<boolean>(false);
  const [exitImage2UploadSuccess, setExitImage2UploadSuccess] = useState<boolean>(false);
  
  // Form submission and calculation states
  const [isUploading1, setIsUploading1] = useState<boolean>(false);
  const [isUploading2, setIsUploading2] = useState<boolean>(false);
  const [isUploadingExit1, setIsUploadingExit1] = useState<boolean>(false);
  const [isUploadingExit2, setIsUploadingExit2] = useState<boolean>(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isCalculatingLotSize, setIsCalculatingLotSize] = useState(false);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0);
  const [accountBalance, setAccountBalance] = useState<number>(DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(true);
  
  // State để kiểm soát khả năng lấy giá real-time dựa trên cặp tiền được chọn
  const [canFetchPrice, setCanFetchPrice] = useState<boolean>(false);
  
  // Automatically load draft when component mounts - no notification
  useEffect(() => {
    if (!isEditMode && userId) {
      const draft = loadDraftFromLocalStorage(userId);
      if (draft) {
        setHasDraft(true);
        // Automatically apply draft
        loadDraft();
      }
    }
  }, [isEditMode, userId]);
  
  // Set up automatic draft deletion after 5 minutes of inactivity
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear old timer
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Only set timer if there's a draft
    if (!isEditMode && userId && hasDraft) {
      inactivityTimeoutRef.current = setTimeout(() => {
        debug('Automatically clearing draft due to inactivity (5 minutes)');
        clearDraftFromLocalStorage(userId);
        setHasDraft(false);
      }, 5 * 60 * 1000); // 5 minutes = 300,000ms
    }
  }, [isEditMode, userId, hasDraft]);
  
  // Set up user activity monitoring
  useEffect(() => {
    // Start counting time when there's a draft
    if (hasDraft) {
      resetInactivityTimer();
      
      // Set up event listeners to monitor activity
      const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetInactivityTimer();
      };
      
      // Đăng ký các event listener
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Clean up khi unmount
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
        
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [hasDraft, resetInactivityTimer]);
  
  // Hàm để tải và áp dụng bản nháp vào form
  const loadDraft = () => {
    if (!userId) return;
    
    setIsDraftLoading(true);
    try {
      const draft = loadDraftFromLocalStorage(userId);
      if (draft && draft.formData) {
        // Áp dụng các giá trị từ bản nháp vào form
        Object.keys(draft.formData).forEach(key => {
          if (key in draft.formData) {
            setValue(key as any, draft.formData[key]);
          }
        });
        
        // Áp dụng URLs hình ảnh nếu có
        if (draft.imageUrls) {
          if (draft.imageUrls.entryImage1) {
            setEntryImage1Preview(draft.imageUrls.entryImage1);
            setEntryImage1DownloadUrl(draft.imageUrls.entryImage1);
            setEntryImage1UploadSuccess(true);
          }
          
          if (draft.imageUrls.entryImage2) {
            setEntryImage2Preview(draft.imageUrls.entryImage2);
            setEntryImage2DownloadUrl(draft.imageUrls.entryImage2);
            setEntryImage2UploadSuccess(true);
          }
          
          if (draft.imageUrls.exitImage1) {
            setExitImage1Preview(draft.imageUrls.exitImage1);
            setExitImage1DownloadUrl(draft.imageUrls.exitImage1);
            setExitImage1UploadSuccess(true);
          }
          
          if (draft.imageUrls.exitImage2) {
            setExitImage2Preview(draft.imageUrls.exitImage2);
            setExitImage2DownloadUrl(draft.imageUrls.exitImage2);
            setExitImage2UploadSuccess(true);
          }
        }
        

        
        // Không hiển thị thông báo khi tự động tải bản nháp
      }
    } catch (error) {
      logError('Error loading draft:', error);
      toast({
        title: "Error Loading Draft",
        description: "Could not load draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDraftLoading(false);
      setShowDraftNotice(false);
    }
  };
  
  // Hàm xóa bản nháp
  const discardDraft = () => {
    if (userId) {
      clearDraftFromLocalStorage(userId);
      setHasDraft(false);
      setShowDraftNotice(false);
      
      toast({
        title: "Draft Deleted",
        description: "Your draft has been successfully deleted.",
        variant: "default"
      });
    }
  };
  
  // Trading strategies
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  // Theo dõi trạng thái đã tải chiến lược để tránh vòng lặp vô hạn
  const [strategyLoaded, setStrategyLoaded] = useState<boolean>(false);
  // Strategy checks for verification
  const [strategyChecks, setStrategyChecks] = useState<StrategyConditionCheck[]>([]);
  
  // Simplified derived state for determining if images are being uploaded
  // Đơn giản hóa logic xác định trạng thái upload
  
  // Nếu đã chọn file và đang ở trạng thái uploading hoặc có progress nhưng chưa thành công
  const image1IsUploading = !!entryImage1File && 
    (isUploading1 || 
    (entryImage1UploadProgress > 0 && entryImage1UploadProgress < 100) || 
    !entryImage1UploadSuccess);
    
  const image2IsUploading = !!entryImage2File && 
    (isUploading2 || 
    (entryImage2UploadProgress > 0 && entryImage2UploadProgress < 100) || 
    !entryImage2UploadSuccess);
    
  // Kiểm tra trạng thái upload cho exit images
  const exitImage1IsUploading = !!exitImage1File && 
    (isUploadingExit1 || 
    (exitImage1UploadProgress > 0 && exitImage1UploadProgress < 100) || 
    !exitImage1UploadSuccess);
    
  const exitImage2IsUploading = !!exitImage2File && 
    (isUploadingExit2 || 
    (exitImage2UploadProgress > 0 && exitImage2UploadProgress < 100) || 
    !exitImage2UploadSuccess);
  
  // Chỉ cần một trong các trạng thái đang upload là không cho submit
  // Đảm bảo kết quả luôn là boolean để tránh lỗi TypeScript
  const isUploading: boolean = !!(image1IsUploading || image2IsUploading || exitImage1IsUploading || exitImage2IsUploading);
  
  // Theo dõi thay đổi trạng thái upload nhưng không ghi log để tăng hiệu suất
  useEffect(() => {
    // Đã loại bỏ ghi log để cải thiện hiệu suất
  }, [
    // Entry image state
    isUploading1, isUploading2, 
    entryImage1UploadProgress, entryImage2UploadProgress, 
    entryImage1UploadSuccess, entryImage2UploadSuccess, 
    entryImage1DownloadUrl, entryImage2DownloadUrl,
    
    // Exit image state
    isUploadingExit1, isUploadingExit2,
    exitImage1UploadProgress, exitImage2UploadProgress,
    exitImage1UploadSuccess, exitImage2UploadSuccess,
    exitImage1DownloadUrl, exitImage2DownloadUrl,
    
    // Derived state
    image1IsUploading, image2IsUploading,
    exitImage1IsUploading, exitImage2IsUploading,
    isUploading
  ]);

  // Fetch user data and trades to calculate current balance using same logic as other components
  useEffect(() => {
    if (userId) {
      setIsLoadingUserData(true);
      
      // Promise to get user data for initialBalance
      const userDataPromise = getUserData(userId);
      
      // Promise to get trades for calculating currentBalance
      const tradesPromise = new Promise<any[]>((resolve) => {
        onTradesSnapshot(
          userId,
          (fetchedTrades) => {
            resolve(fetchedTrades);
          },
          (error) => {
            logError("Error fetching trades:", error);
            resolve([]); // Resolve with empty array on error
          }
        );
      });
      
      // Wait for both promises to resolve
      Promise.all([userDataPromise, tradesPromise])
        .then(([userData, trades]) => {
          // Get initial balance from userData
          const initialBalance = userData?.initialBalance ? 
            parseFloat(userData.initialBalance) : DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;
          
          // Calculate current balance from initial balance and trades
          // using the same methodology as in other components
          const currentBalance = calculateCurrentBalance(initialBalance, trades);
          
          setAccountBalance(currentBalance);
          // Đã loại bỏ console log ở đây để cải thiện hiệu suất
          
          // Set default risk percentage from user settings
          if (userData && userData.settings && userData.settings.defaultRiskPerTrade) {
            const defaultRisk = parseFloat(userData.settings.defaultRiskPerTrade);
            if (!isNaN(defaultRisk)) {
              setRiskPercentage(defaultRisk);
              // Đã loại bỏ console log ở đây để cải thiện hiệu suất
            }
          }
        })
        .catch(error => {
          logError("Error fetching user data:", error);
          // In case of error, keep default value
          setAccountBalance(DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE);
        })
        .finally(() => {
          setIsLoadingUserData(false);
        });
    }
  }, [userId]);

  // Fetch trading strategies
  useEffect(() => {
    if (userId) {
      setIsLoadingStrategies(true);
      
      getStrategies(userId)
        .then(strategiesData => {
          if (strategiesData && strategiesData.length > 0) {
            // Xử lý dữ liệu từ Firebase đảm bảo đủ các trường cần thiết
            const processedStrategies = strategiesData.map(strategy => {
              // Tạo một bản sao của đối tượng strategy với userId được thêm vào
              // Create a complete TradingStrategy object with properly typed properties
              const processedStrategy: TradingStrategy = {
                id: strategy.id,
                userId: userId, // Use the userId passed to component
                name: strategy.name ?? "Untitled Strategy",
                description: strategy.description ?? "",
                rules: Array.isArray(strategy.rules) ? strategy.rules : [],
                entryConditions: Array.isArray(strategy.entryConditions) ? strategy.entryConditions : [],
                exitConditions: Array.isArray(strategy.exitConditions) ? strategy.exitConditions : [],
                timeframes: Array.isArray(strategy.timeframes) ? strategy.timeframes : [],
                riskRewardRatio: typeof strategy.riskRewardRatio === 'number' ? strategy.riskRewardRatio : 0,
                notes: strategy.notes ?? "",
                isDefault: !!strategy.isDefault,
                createdAt: strategy.createdAt || Timestamp.now(),
                updatedAt: strategy.updatedAt || Timestamp.now()
              };
              return processedStrategy;
            });
            
            setStrategies(processedStrategies);
            // Giảm lượng console.log để cải thiện hiệu suất
            
            // Sau khi tải xong chiến lược, kiểm tra xem có giá trị mặc định chưa
            if (!strategyLoaded && processedStrategies.length > 0) {
              // Tìm chiến lược mặc định - nếu không tìm thấy, sử dụng chiến lược đầu tiên
              let strategyToUse = processedStrategies.find(s => s.isDefault);
              
              if (!strategyToUse) {
                // Không tìm thấy chiến lược mặc định, sử dụng chiến lược đầu tiên
                strategyToUse = processedStrategies[0];
              } else {
                debug("Selected default strategy:", strategyToUse.name);
              }
              
              // Cập nhật cả form value và state - Sử dụng setTimeout để đảm bảo thực hiện sau khi component đã render
              setTimeout(() => {
                setValue("strategy", strategyToUse.name);
                setStrategyNameValue(strategyToUse.name);
                // Hiển thị chiến lược được chọn
                setSelectedStrategy(strategyToUse);
                // Đánh dấu đã tải xong
                setStrategyLoaded(true);
              }, 100);  // Tăng thời gian timeout để đảm bảo UI kịp cập nhật
            }
          } else {
            // Không còn cần ghi log, hiệu suất tốt hơn
            setStrategies([]);
          }
        })
        .catch(error => {
          logError("Error fetching trading strategies:", error);
          setStrategies([]);
        })
        .finally(() => {
          setIsLoadingStrategies(false);
        });
    }
  }, [userId]);


  
  // Set up initial values for form based on mode
  useEffect(() => {
    // Initialize images from existing trade in edit mode
    if (isEditMode && initialValues) {
      // Entry images
      if (initialValues.entryImage) {
        setEntryImage1Preview(initialValues.entryImage);
        setEntryImage1DownloadUrl(initialValues.entryImage);
      }
      if (initialValues.entryImageM15) {
        setEntryImage2Preview(initialValues.entryImageM15);
        setEntryImage2DownloadUrl(initialValues.entryImageM15);
      }
      
      // Exit images (only if the trade has been closed)
      if (!initialValues.isOpen) {
        if (initialValues.exitImage) {
          setExitImage1Preview(initialValues.exitImage);
          setExitImage1DownloadUrl(initialValues.exitImage);
        }
        if (initialValues.exitImageM15) {
          setExitImage2Preview(initialValues.exitImageM15);
          setExitImage2DownloadUrl(initialValues.exitImageM15);
        }
      }
    }
  }, [isEditMode, initialValues]);

  // Get default values based on mode
  const getDefaultValues = (): Partial<TradeFormValues> => {
    if (isEditMode && initialValues) {
      // For edit mode, use values from the existing trade
      return {
        pair: initialValues.pair,
        direction: initialValues.direction,
        entryPrice: initialValues.entryPrice,
        stopLoss: initialValues.stopLoss,
        takeProfit: initialValues.takeProfit,
        lotSize: initialValues.lotSize,
        entryDate: initialValues.entryDate && typeof initialValues.entryDate === 'object' && 'toMillis' in initialValues.entryDate
          ? new Date((initialValues.entryDate as any).toMillis()).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        strategy: initialValues.strategy || "",
        techPattern: initialValues.techPattern || "",
        emotion: initialValues.emotion || "Confident",
        followedPlan: initialValues.discipline?.followedPlan ?? true,
        enteredEarly: initialValues.discipline?.enteredEarly ?? false,
        revenge: initialValues.discipline?.revenge ?? false,
        overLeveraged: initialValues.discipline?.overLeveraged ?? false,
        movedStopLoss: initialValues.discipline?.movedStopLoss ?? false,
        marketCondition: initialValues.marketCondition || "Trending",
        sessionType: initialValues.sessionType || "London",
        hasNews: initialValues.hasNews ?? false,
        notes: initialValues.notes || "",
        // Thêm các trường liên quan đến đóng giao dịch nếu giao dịch đã được đóng
        isOpen: initialValues.isOpen !== undefined ? initialValues.isOpen : true,
        exitPrice: initialValues.exitPrice || null,
        result: initialValues.result as any || undefined,
        closingNote: initialValues.closingNote || "",
      };
    } else {
      // Sử dụng giá trị mặc định cho trade mới
      // Không tìm chiến lược ở đây để tránh lỗi vòng lặp vô hạn
      // Chiến lược mặc định được xử lý sau khi tải xong danh sách
      
      return {
        pair: "XAUUSD",
        direction: "BUY",
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        lotSize: 0.01,
        entryDate: new Date().toISOString().split("T")[0],
        strategy: "",
        techPattern: "",
        emotion: "Confident",
        followedPlan: true,
        enteredEarly: false,
        revenge: false,
        overLeveraged: false,
        movedStopLoss: false,
        marketCondition: "Trending",
        sessionType: "London",
        hasNews: false,
        notes: "",
      };
    }
  };

  // Initialize the form
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: getDefaultValues(),
  });

  const { watch, setValue, getValues } = form;
  
  // Thiết lập sự kiện beforeunload để lưu nháp khi rời trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isEditMode && userId && !isFormSubmitting) {
        const formData = form.getValues();
        const imageUrls = {
          entryImage1: entryImage1DownloadUrl,
          entryImage2: entryImage2DownloadUrl,
          exitImage1: exitImage1DownloadUrl,
          exitImage2: exitImage2DownloadUrl,
        };
        
        saveDraftToLocalStorage(userId, formData, imageUrls);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Xóa timeout đang chờ khi unmount component
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [isEditMode, userId, isFormSubmitting, form,
      entryImage1DownloadUrl, entryImage2DownloadUrl, 
      exitImage1DownloadUrl, exitImage2DownloadUrl]);
  
  // Watch for changes in specific form fields
  const [pair, direction, entryPrice, stopLoss, takeProfit, exitPrice, lotSize] = watch([
    "pair", "direction", "entryPrice", "stopLoss", "takeProfit", "exitPrice", "lotSize"
  ]);
  
  // Kiểm tra và cập nhật khả năng lấy giá real-time khi cặp tiền thay đổi
  useEffect(() => {
    // Kiểm tra xem cặp tiền hiện tại có được hỗ trợ bởi TwelveData API không
    if (pair) {
      const supported = isSymbolSupported(pair);
      setCanFetchPrice(supported);
      
      if (!supported) {
        debug(`[TradeForm] Currency pair ${pair} is not supported by TwelveData API`);
      }
    } else {
      setCanFetchPrice(false);
    }
  }, [pair]);
  
  // Watch for toggle fields to ensure they're reactive
  const [followedPlan, enteredEarly, revenge, overLeveraged, movedStopLoss, hasNews] = watch([
    "followedPlan", 
    "enteredEarly", 
    "revenge", 
    "overLeveraged", 
    "movedStopLoss", 
    "hasNews"
  ]);
  
  // Theo dõi thay đổi form để tự động lưu bản nháp
  useEffect(() => {
    // Chỉ lưu bản nháp khi đang tạo mới, không phải chỉnh sửa
    if (!isEditMode && userId && !isFormSubmitting) {
      const formData = form.getValues();
      const imageUrls = {
        entryImage1: entryImage1DownloadUrl,
        entryImage2: entryImage2DownloadUrl,
        exitImage1: exitImage1DownloadUrl,
        exitImage2: exitImage2DownloadUrl,
      };
      
      saveDraftToLocalStorage(userId, formData, imageUrls);
    }
  }, [
    // Theo dõi các trường quan trọng của form
    pair, direction, entryPrice, stopLoss, takeProfit, exitPrice, lotSize,
    followedPlan, enteredEarly, revenge, overLeveraged, movedStopLoss, hasNews,
    // Theo dõi URLs hình ảnh
    entryImage1DownloadUrl, entryImage2DownloadUrl,
    exitImage1DownloadUrl, exitImage2DownloadUrl,
    // Các trạng thái khác
    isEditMode, userId, isFormSubmitting
  ]);
  
  // Watch for strategy changes - use separate state to prevent recursion
  const [strategyNameValue, setStrategyNameValue] = useState<string>("");
  

  
  // Watch strategy field but only for UI display
  const selectedStrategyName = watch("strategy");
  
  // Update local state when strategy name changes from form
  useEffect(() => {
    if (selectedStrategyName !== strategyNameValue) {
      setStrategyNameValue(selectedStrategyName || "");
    }
  }, [selectedStrategyName]);
  
  // Effect to update selectedStrategy when strategy name changes
  useEffect(() => {
    // Chỉ thực hiện khi có strategyNameValue và strategies đã được tải
    if (strategyNameValue && strategies.length > 0 && !isLoadingStrategies) {
      // Tìm chiến lược trong danh sách strategies
      const matchingStrategy = strategies.find(s => s.name === strategyNameValue);
      if (matchingStrategy) {
        // Nếu tìm thấy, cập nhật selectedStrategy
        setSelectedStrategy(matchingStrategy);
        
        // Initialize strategy checks when a strategy is selected
        // Create initial checks from all conditions
        const allConditions = [
          ...(Array.isArray(matchingStrategy.rules) ? matchingStrategy.rules : []),
          ...(Array.isArray(matchingStrategy.entryConditions) ? matchingStrategy.entryConditions : []),
          ...(Array.isArray(matchingStrategy.exitConditions) ? matchingStrategy.exitConditions : [])
        ];
        
        // Convert to proper StrategyConditionCheck objects
        const conditionChecks = allConditions.map(condition => {
          // Get condition id (generate one if it doesn't exist)
          const conditionId = typeof condition === 'string' 
            ? String(Math.random()) 
            : condition.id || String(Math.random());
          
          // Create a proper StrategyConditionCheck object
          return {
            conditionId,
            checked: false,
            passed: false,
            notes: ""
          };
        });
        
        setStrategyChecks(conditionChecks);
      } else {
        // Nếu không tìm thấy, đặt là null
        setSelectedStrategy(null);
        setStrategyChecks([]);
      }
    }
  }, [strategyNameValue, strategies, isLoadingStrategies]);
  
  // Update input placeholders based on selected currency pair
  useEffect(() => {
    const currentPair = pair as CurrencyPair;
    
    // Set placeholder format based on currency pair
    if (currentPair === "XAUUSD") {
      document.getElementById("entryPrice")?.setAttribute("placeholder", "2300.00");
      document.getElementById("stopLoss")?.setAttribute("placeholder", "2290.00");
      document.getElementById("takeProfit")?.setAttribute("placeholder", "2320.00");
    } else if (currentPair === "USDJPY") {
      document.getElementById("entryPrice")?.setAttribute("placeholder", "151.50");
      document.getElementById("stopLoss")?.setAttribute("placeholder", "150.50");
      document.getElementById("takeProfit")?.setAttribute("placeholder", "152.50");
    } else {
      // For EURUSD and other pairs
      document.getElementById("entryPrice")?.setAttribute("placeholder", "1.0820");
      document.getElementById("stopLoss")?.setAttribute("placeholder", "1.0800");
      document.getElementById("takeProfit")?.setAttribute("placeholder", "1.0850");
    }
  }, [pair]);

  useEffect(() => {
    // Calculate risk/reward ratio  
    const directionValue = direction as Direction;

    if (entryPrice && stopLoss && takeProfit) {
      const ratio = calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit, directionValue);
      setRiskRewardRatio(ratio);
    }
  }, [entryPrice, stopLoss, takeProfit, direction]);

  // Helper function to generate a unique ID
  const generateTempId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15);
  };
  
  // Calculate preview pips for closed trades
  const calculatePreviewPips = (): string => {
    const entryPriceNum = entryPrice || 0;
    const exitPriceNum = exitPrice || 0;
    const directionTyped = direction as Direction;
    const pairTyped = pair as CurrencyPair;
    
    if (entryPriceNum === 0 || exitPriceNum === 0) return "0.0";
    
    const pips = calculatePips(pairTyped, directionTyped, entryPriceNum, exitPriceNum);
    return pips > 0 ? `+${pips.toFixed(1)}` : pips.toFixed(1);
  };
  
  // Calculate preview profit for closed trades
  const calculatePreviewProfit = (): number => {
    const entryPriceNum = entryPrice || 0;
    const exitPriceNum = exitPrice || 0;
    const lotSizeNum = lotSize || 0;
    const directionTyped = direction as Direction;
    const pairTyped = pair as CurrencyPair;
    
    if (entryPriceNum === 0 || exitPriceNum === 0 || lotSizeNum === 0) return 0;
    
    const profit = calculateProfit({
      pair: pairTyped,
      direction: directionTyped,
      entryPrice: entryPriceNum,
      exitPrice: exitPriceNum,
      lotSize: lotSizeNum,
      accountCurrency: "USD"
    });
    
    return profit;
  };

  // Validate file size before uploading
  const validateFileSize = (file: File): boolean => {
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return false;
    }
    
    return true;
  };

  // Handle entry image 1
  const handleEntryImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!validateFileSize(file)) {
        setEntryImage1Error(`File size exceeds 5MB. Please choose a smaller file.`);
        return;
      }
      
      setEntryImage1Error(null);
      
      const reader = new FileReader();
      reader.onload = () => {
        setEntryImage1Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setEntryImage1File(file);
      
      // Auto upload
      uploadEntryImage1(file);
    }
  };
  
  // Handle entry image 2
  const handleEntryImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!validateFileSize(file)) {
        setEntryImage2Error(`File size exceeds 5MB. Please choose a smaller file.`);
        return;
      }
      
      setEntryImage2Error(null);
      
      const reader = new FileReader();
      reader.onload = () => {
        setEntryImage2Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setEntryImage2File(file);
      
      // Auto upload
      uploadEntryImage2(file);
    }
  };
  
  // Handle exit image 1 (H4 exit chart)
  const handleExitImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!validateFileSize(file)) {
        setExitImage1Error(`File size exceeds 5MB. Please choose a smaller file.`);
        return;
      }
      
      setExitImage1Error(null);
      
      const reader = new FileReader();
      reader.onload = () => {
        setExitImage1Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setExitImage1File(file);
      
      // Auto upload
      uploadExitImage1(file);
    }
  };
  
  // Handle exit image 2 (M15 exit chart)
  const handleExitImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!validateFileSize(file)) {
        setExitImage2Error(`File size exceeds 5MB. Please choose a smaller file.`);
        return;
      }
      
      setExitImage2Error(null);
      
      const reader = new FileReader();
      reader.onload = () => {
        setExitImage2Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setExitImage2File(file);
      
      // Auto upload
      uploadExitImage2(file);
    }
  };
  
  // Biến lưu trữ ID tạm thời cho các ảnh cùng trade
  const [tempTradeId] = useState<string>(generateTempId());
  
  // Upload entry image 1 - Sử dụng API service
  const uploadEntryImage1 = async (file: File) => {
    try {
      // Reset tất cả các trạng thái trước khi bắt đầu upload mới
      setEntryImage1UploadProgress(0);
      setEntryImage1Error(null);
      setEntryImage1UploadSuccess(false);
      setIsUploading1(true);
      
      devLog("Starting upload for entry image 1...");
      devLog("Using temp ID for uploading:", tempTradeId);
      
      // Sử dụng API service để tải lên (wrapper trên Firebase)
      devLog("Using API service for image upload: h4chart");
      
      const result = await uploadTradeImage(
        userId,
        tempTradeId,
        file,
        'h4chart',  // Sử dụng h4chart cho API service
        (progress) => {
          devLog(`Entry image 1 upload progress: ${progress}%`);
          setEntryImage1UploadProgress(progress);
        }
      );
      
      // Kiểm tra kết quả từ API service
      if (!result || !result.success || !result.imageUrl) {
        throw new Error("No download URL received after upload");
      }
      
      const imageUrl = result.imageUrl;
      devLog("Image 1 upload complete with URL:", imageUrl.substring(0, 30) + "...");
      
      // Cập nhật tất cả các trạng thái theo thứ tự logic
      setEntryImage1DownloadUrl(imageUrl);
      setEntryImage1UploadProgress(100);
      setEntryImage1UploadSuccess(true);
      // Đặt isUploading1 về false sau cùng
      setIsUploading1(false);
      
      devLog("All image 1 states updated - Upload success and progress at 100%");
      return result.imageUrl;
    } catch (error) {
      // Xử lý lỗi và đặt lại tất cả trạng thái
      logError("Error with image 1 upload:", error);
      setEntryImage1Error("Could not upload image: " + (error instanceof Error ? error.message : String(error)));
      setEntryImage1UploadProgress(0);
      setEntryImage1UploadSuccess(false);
      setIsUploading1(false);
      return null;
    }
  };
  
  // Upload entry image 2 - Sử dụng API service
  const uploadEntryImage2 = async (file: File) => {
    try {
      // Reset tất cả các trạng thái trước khi bắt đầu upload mới
      setEntryImage2UploadProgress(0);
      setEntryImage2Error(null);
      setEntryImage2UploadSuccess(false);
      setIsUploading2(true);
      
      devLog("Starting upload for entry image 2...");
      devLog("Using temp ID for uploading:", tempTradeId);
      
      // Sử dụng API service để tải lên (wrapper trên Firebase)
      devLog("Using API service for image upload: m15chart");
      
      const result = await uploadTradeImage(
        userId,
        tempTradeId,
        file,
        'm15chart',  // Sử dụng m15chart cho API service
        (progress) => {
          devLog(`Entry image 2 upload progress: ${progress}%`);
          setEntryImage2UploadProgress(progress);
        }
      );
      
      // Kiểm tra kết quả từ API service
      if (!result || !result.success || !result.imageUrl) {
        throw new Error("No download URL received after upload");
      }
      
      const imageUrl = result.imageUrl;
      devLog("Image 2 upload complete with URL:", imageUrl.substring(0, 30) + "...");
      
      // Cập nhật tất cả các trạng thái
      setEntryImage2DownloadUrl(imageUrl);
      setEntryImage2UploadProgress(100);
      setEntryImage2UploadSuccess(true);
      setIsUploading2(false);
      
      devLog("All image 2 states updated - Upload success and progress at 100%");
      return result.imageUrl;
    } catch (error) {
      // Xử lý lỗi và đặt lại tất cả trạng thái
      logError("Error with image 2 upload:", error);
      setEntryImage2Error("Could not upload image: " + (error instanceof Error ? error.message : String(error)));
      setEntryImage2UploadProgress(0);
      setEntryImage2UploadSuccess(false);
      setIsUploading2(false);
      return null;
    }
  };

  // Function to delete entry image 1
  const deleteEntryImage1 = () => {
    setEntryImage1Preview(null);
    setEntryImage1File(null);
    setEntryImage1DownloadUrl(null);
    setEntryImage1UploadProgress(0);
    setIsUploading1(false);
    setEntryImage1UploadSuccess(false);
    const input = document.getElementById('entryImage1') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Function to delete entry image 2
  const deleteEntryImage2 = () => {
    setEntryImage2Preview(null);
    setEntryImage2File(null);
    setEntryImage2DownloadUrl(null);
    setEntryImage2UploadProgress(0);
    setIsUploading2(false);
    setEntryImage2UploadSuccess(false);
    const input = document.getElementById('entryImage2') as HTMLInputElement;
    if (input) input.value = '';
  };
  
  // Upload exit image 1 (H4 exit chart) - Sử dụng API service
  const uploadExitImage1 = async (file: File) => {
    try {
      // Reset tất cả các trạng thái trước khi bắt đầu upload mới
      setExitImage1UploadProgress(0);
      setExitImage1Error(null);
      setExitImage1UploadSuccess(false);
      setIsUploadingExit1(true);
      
      devLog("Starting upload for exit image 1...");
      devLog("Using temp ID for uploading:", tempTradeId);
      
      // Sử dụng API service để tải lên (wrapper trên Cloudinary)
      devLog("Using API service for image upload: h4exit");
      
      const result = await uploadTradeImage(
        userId,
        tempTradeId,
        file,
        'h4exit',  // Sử dụng h4exit cho API service
        (progress) => {
          devLog(`Exit image 1 upload progress: ${progress}%`);
          setExitImage1UploadProgress(progress);
        }
      );
      
      // Kiểm tra kết quả từ API service
      if (!result || !result.success || !result.imageUrl) {
        throw new Error("No download URL received after upload");
      }
      
      const imageUrl = result.imageUrl;
      devLog("Exit image 1 upload complete with URL:", imageUrl.substring(0, 30) + "...");
      
      // Cập nhật tất cả các trạng thái theo thứ tự logic
      setExitImage1DownloadUrl(imageUrl);
      setExitImage1UploadProgress(100);
      setExitImage1UploadSuccess(true);
      // Đặt isUploadingExit1 về false sau cùng
      setIsUploadingExit1(false);
      
      devLog("All exit image 1 states updated - Upload success and progress at 100%");
      return result.imageUrl;
    } catch (error) {
      // Xử lý lỗi và đặt lại tất cả trạng thái
      logError("Error with exit image 1 upload:", error);
      setExitImage1Error("Could not upload image: " + (error instanceof Error ? error.message : String(error)));
      setExitImage1UploadProgress(0);
      setExitImage1UploadSuccess(false);
      setIsUploadingExit1(false);
      return null;
    }
  };
  
  // Upload exit image 2 (M15 exit chart) - Sử dụng API service
  const uploadExitImage2 = async (file: File) => {
    try {
      // Reset tất cả các trạng thái trước khi bắt đầu upload mới
      setExitImage2UploadProgress(0);
      setExitImage2Error(null);
      setExitImage2UploadSuccess(false);
      setIsUploadingExit2(true);
      
      devLog("Starting upload for exit image 2...");
      devLog("Using temp ID for uploading:", tempTradeId);
      
      // Sử dụng API service để tải lên (wrapper trên Cloudinary)
      devLog("Using API service for image upload: m15exit");
      
      const result = await uploadTradeImage(
        userId,
        tempTradeId,
        file,
        'm15exit',  // Sử dụng m15exit cho API service
        (progress) => {
          devLog(`Exit image 2 upload progress: ${progress}%`);
          setExitImage2UploadProgress(progress);
        }
      );
      
      // Kiểm tra kết quả từ API service
      if (!result || !result.success || !result.imageUrl) {
        throw new Error("No download URL received after upload");
      }
      
      const imageUrl = result.imageUrl;
      devLog("Exit image 2 upload complete with URL:", imageUrl.substring(0, 30) + "...");
      
      // Cập nhật tất cả các trạng thái
      setExitImage2DownloadUrl(imageUrl);
      setExitImage2UploadProgress(100);
      setExitImage2UploadSuccess(true);
      setIsUploadingExit2(false);
      
      devLog("All exit image 2 states updated - Upload success and progress at 100%");
      return result.imageUrl;
    } catch (error) {
      // Xử lý lỗi và đặt lại tất cả trạng thái
      logError("Error with exit image 2 upload:", error);
      setExitImage2Error("Could not upload image: " + (error instanceof Error ? error.message : String(error)));
      setExitImage2UploadProgress(0);
      setExitImage2UploadSuccess(false);
      setIsUploadingExit2(false);
      return null;
    }
  };
  
  // Function to delete exit image 1
  const deleteExitImage1 = () => {
    setExitImage1Preview(null);
    setExitImage1File(null);
    setExitImage1DownloadUrl(null);
    setExitImage1UploadProgress(0);
    setIsUploadingExit1(false);
    setExitImage1UploadSuccess(false);
    const input = document.getElementById('exitImage1') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Function to delete exit image 2
  const deleteExitImage2 = () => {
    setExitImage2Preview(null);
    setExitImage2File(null);
    setExitImage2DownloadUrl(null);
    setExitImage2UploadProgress(0);
    setIsUploadingExit2(false);
    setExitImage2UploadSuccess(false);
    const input = document.getElementById('exitImage2') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Calculate lot size based on risk percentage
  const calculateLotSizeByRisk = async () => {
    setIsCalculatingLotSize(true);
    
    try {
      const pair = getValues("pair") as CurrencyPair;
      const direction = getValues("direction") as Direction;
      const entryPrice = getValues("entryPrice");
      const stopLoss = getValues("stopLoss");
      
      // Validate inputs
      if (!entryPrice || !stopLoss || entryPrice <= 0 || stopLoss <= 0) {
        throw new Error("Please enter valid entry price and stop loss");
      }
      
      // Show user the balance being used for calculation in console
      devLog(`Calculating lot size using account balance: ${accountBalance}`);
      
      // Calculate lot size
      const lotSize = calculateLotSize({
        pair,
        direction,
        entryPrice,
        stopLoss,
        accountBalance,
        riskPercentage,
        accountCurrency: "USD"
      });
      
      // Round to 2 decimal places and set the value
      setValue("lotSize", Number(lotSize.toFixed(2)));
    } catch (error) {
      logError("Error calculating lot size:", error);
      
      toast({
        variant: "destructive",
        title: "Error calculating lot size",
        description: error instanceof Error ? error.message : "Invalid entry price or stop loss",
        duration: 3000,
      });
    } finally {
      setIsCalculatingLotSize(false);
    }
  };

  const onSubmit = async (data: TradeFormValues) => {
    try {
      devLog("Form submission started");
      setIsFormSubmitting(true);
      onSubmitting(true);
      
      // Xóa bản nháp khi submit form
      if (userId) {
        clearDraftFromLocalStorage(userId);
        setHasDraft(false);
      }
      
      // Cách tiếp cận mới: Kiểm tra tất cả điều kiện upload
      devLog("Checking upload status before submit:", {
        isUploading,
        image1IsUploading,
        image2IsUploading,
        entryImage1File: !!entryImage1File,
        entryImage2File: !!entryImage2File,
        entryImage1UploadProgress,
        entryImage2UploadProgress,
        entryImage1UploadSuccess,
        entryImage2UploadSuccess
      });
      
      // Kiểm tra cẩn thận điều kiện upload
      if (isUploading) {
        devLog("Images still uploading, cannot submit form");
        toast({
          title: "Đang tải ảnh lên",
          description: "Vui lòng đợi quá trình tải ảnh hoàn tất trước khi lưu giao dịch",
          variant: "destructive",
        });
        setIsFormSubmitting(false);
        onSubmitting(false);
        return;
      }
      
      // Kiểm tra xem có ảnh nào đang được tải mà chưa hoàn thành không
      if ((entryImage1File && !entryImage1UploadSuccess && entryImage1UploadProgress < 100) || 
          (entryImage2File && !entryImage2UploadSuccess && entryImage2UploadProgress < 100) ||
          (exitImage1File && !exitImage1UploadSuccess && exitImage1UploadProgress < 100) ||
          (exitImage2File && !exitImage2UploadSuccess && exitImage2UploadProgress < 100)) {
        devLog("Image upload hasn't completed properly, cannot submit form");
        toast({
          title: "Lỗi tải ảnh lên",
          description: "Quá trình tải ảnh chưa hoàn tất, vui lòng thử lại sau",
          variant: "destructive",
        });
        setIsFormSubmitting(false);
        onSubmitting(false);
        return;
      }
      
      devLog("Form validation passed, preparing trade data");
      
      // Debugging image URLs
      devLog("Current image URLs:", {
        entryImage1: entryImage1DownloadUrl,
        entryImage2: entryImage2DownloadUrl,
        exitImage1: exitImage1DownloadUrl,
        exitImage2: exitImage2DownloadUrl
      });
      
      // Chuẩn bị dữ liệu trade cơ bản dựa trên form
      const tradeData: Partial<Trade> = {
        pair: data.pair as CurrencyPair,
        direction: data.direction as Direction,
        entryPrice: data.entryPrice,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        lotSize: data.lotSize,
        strategy: data.strategy,
        techPattern: data.techPattern || "",
        emotion: data.emotion,
        discipline: {
          followedPlan: data.followedPlan,
          enteredEarly: data.enteredEarly,
          revenge: data.revenge,
          overLeveraged: data.overLeveraged,
          movedStopLoss: data.movedStopLoss,
        },
        marketCondition: data.marketCondition || "Trending",
        sessionType: data.sessionType || "London",
        hasNews: data.hasNews,
        // Include strategy verification info in notes
        notes: data.notes ? 
          `${data.notes}\n\nStrategy compliance: ${strategyChecks.filter(check => check.checked && check.passed).length}/${strategyChecks.length}` : 
          `Strategy compliance: ${strategyChecks.filter(check => check.checked && check.passed).length}/${strategyChecks.length}`,
      };

      // Thêm image URLs nếu có
      if (entryImage1DownloadUrl) {
        devLog("Adding entryImage URL to trade data:", entryImage1DownloadUrl);
        tradeData.entryImage = entryImage1DownloadUrl;
      }
      
      if (entryImage2DownloadUrl) {
        devLog("Adding entryImageM15 URL to trade data:", entryImage2DownloadUrl);
        tradeData.entryImageM15 = entryImage2DownloadUrl;
      }
      
      // Xử lý khác nhau tùy theo mode (new/edit)
      try {
        if (isEditMode && initialValues) {
          // Chế độ chỉnh sửa: cập nhật giao dịch hiện có
          tradeData.updatedAt = serverTimestamp() as any;
          
          // Convert entryDate từ string sang date
          if (data.entryDate) {
            const dateObj = new Date(data.entryDate);
            // serverTimestamp() không dùng được ở đây vì cần giá trị chính xác
            // Sử dụng đối tượng Date thay vì Timestamp
            tradeData.entryDate = {
              seconds: Math.floor(dateObj.getTime() / 1000),
              nanoseconds: 0
            } as any;
          }
          
          // Xử lý thông tin đóng giao dịch khi edit closed trade hoặc đóng giao dịch mới
          if (data.exitPrice && data.result) {
            devLog("Processing closed trade data");
            // Đảm bảo isOpen được cập nhật
            tradeData.isOpen = false;
            tradeData.result = data.result;
            
            // Parse exit price và cập nhật close date
            // Nếu đang chỉnh sửa giao dịch đã đóng và có closeDate, giữ lại
            // Ngược lại, tạo closeDate mới
            if (initialValues?.closeDate) {
              tradeData.closeDate = initialValues.closeDate;
            } else {
              tradeData.closeDate = serverTimestamp() as any;
            }
            
            // Lấy dữ liệu số từ form
            const entryPrice = data.entryPrice;
            const exitPrice = data.exitPrice;
            const lotSize = data.lotSize;
            const direction = data.direction as Direction;
            const pair = data.pair as CurrencyPair;
            
            // Chỉ tính toán nếu có đủ dữ liệu
            if (entryPrice && exitPrice && lotSize) {
              // Cập nhật giá exitPrice vào tradeData
              tradeData.exitPrice = exitPrice;
              
              // Tự động xác định lại kết quả giao dịch dựa trên giá exit mới
              const stopLoss = data.stopLoss;
              const takeProfit = data.takeProfit;
              
              // Tự động cập nhật lại result dựa trên giá exit mới
              devLog("Auto-updating trade result based on new exit price");
              
              // Kiểm tra đúng giá TP/SL
              if (Math.abs(exitPrice - takeProfit) < 0.001) {
                devLog("Exit price matches take profit - updating result to TP");
                tradeData.result = "TP";
              } else if (Math.abs(exitPrice - stopLoss) < 0.001) {
                devLog("Exit price matches stop loss - updating result to SL");
                tradeData.result = "SL";
              } else {
                // Kiểm tra lời/lỗ để xác định
                const isProfitable = (direction === "BUY" && exitPrice > entryPrice) || 
                                    (direction === "SELL" && exitPrice < entryPrice);
                                    
                if (isProfitable) {
                  devLog("Trade is profitable with new exit price - updating result to MANUAL");
                  tradeData.result = "MANUAL"; // Hoặc có thể đổi thành "TP" tùy vào yêu cầu
                } else {
                  devLog("Trade is not profitable with new exit price - updating result to MANUAL");
                  tradeData.result = "MANUAL"; // Hoặc có thể đổi thành "SL" tùy vào yêu cầu
                }
              }
              
              // Thêm ảnh exit vào trade data nếu có
              // Lưu ý: Nếu không có ảnh mới được tải lên, giữ nguyên ảnh cũ (nếu có)
              if (exitImage1DownloadUrl) {
                devLog("Adding exitImage URL to trade data:", exitImage1DownloadUrl);
                tradeData.exitImage = exitImage1DownloadUrl;
              } else if (initialValues?.exitImage) {
                devLog("Keeping existing exitImage:", initialValues.exitImage);
                tradeData.exitImage = initialValues.exitImage;
              }
              
              if (exitImage2DownloadUrl) {
                devLog("Adding exitImageM15 URL to trade data:", exitImage2DownloadUrl);
                tradeData.exitImageM15 = exitImage2DownloadUrl;
              } else if (initialValues?.exitImageM15) {
                devLog("Keeping existing exitImageM15:", initialValues.exitImageM15);
                tradeData.exitImageM15 = initialValues.exitImageM15;
              }
              
              // Cập nhật closing note
              tradeData.closingNote = data.closingNote || "";
              
              // Tính pips dựa trên giá entry và exit mới
              const pips = calculatePips(pair, direction, entryPrice, exitPrice);
              
              // Tính profit/loss dựa trên giá exit mới
              const profit = calculateProfit({
                pair,
                direction,
                entryPrice,
                exitPrice,
                lotSize,
                accountCurrency: "USD"
              });
              
              devLog("Calculating pips and profit/loss according to forex-calculator.ts");
              devLog(`Calculation parameters: direction=${direction}, entry=${entryPrice}, exit=${exitPrice}, lot=${lotSize}, pair=${pair}`);
              
              // Tuân thủ chính xác định nghĩa trong forex-calculator.ts
              // Lưu trực tiếp giá trị đã tính toán
              tradeData.pips = Math.round(pips);
              tradeData.profitLoss = Math.round(profit);
              
              devLog(`Trade calculated: pips=${tradeData.pips}, P/L=${tradeData.profitLoss}`);
              
              devLog("Original calculated metrics:", { pips, profit, exitPrice });
              devLog("Final trade metrics:", { 
                pips: tradeData.pips, 
                profitLoss: tradeData.profitLoss, 
                exitPrice 
              });
            }
          } else if (initialValues && !initialValues.isOpen && initialValues.exitPrice) {
            // Nếu là chỉnh sửa giao dịch đã đóng nhưng chỉ thay đổi thông tin khác 
            // (không phải giá exit), vẫn giữ lại thông tin exit hiện có
            tradeData.isOpen = false;
            tradeData.exitPrice = initialValues.exitPrice;
            tradeData.closeDate = initialValues.closeDate;
            tradeData.pips = initialValues.pips;
            tradeData.profitLoss = initialValues.profitLoss;
            tradeData.result = initialValues.result || data.result;
            tradeData.closingNote = data.closingNote || initialValues.closingNote || "";
            
            // Giữ lại ảnh exit nếu có
            if (initialValues.exitImage) {
              tradeData.exitImage = initialValues.exitImage;
            } else if (exitImage1DownloadUrl) {
              tradeData.exitImage = exitImage1DownloadUrl;
            }
            
            if (initialValues.exitImageM15) {
              tradeData.exitImageM15 = initialValues.exitImageM15;
            } else if (exitImage2DownloadUrl) {
              tradeData.exitImageM15 = exitImage2DownloadUrl;
            }
          }
          
          devLog("Updating trade with ID:", initialValues.id);
          await updateTrade(userId, initialValues.id, tradeData);
          devLog("Trade updated successfully");
        } else {
          // Chế độ thêm mới: tạo giao dịch mới
          tradeData.userId = userId;
          tradeData.entryDate = serverTimestamp() as any; // Sử dụng Firebase serverTimestamp
          tradeData.isOpen = true; // Mặc định giao dịch mới là đang mở
          tradeData.createdAt = serverTimestamp() as any; // Thêm thời gian tạo
          
          // Sử dụng id đồng nhất giữa ảnh và trade khi được cung cấp
          devLog("Creating new trade with tempTradeId:", tempTradeId);
          
          try {
            devLog("Adding new trade to database with following data:", 
              JSON.stringify({
                ...tradeData,
                entryImage: entryImage1DownloadUrl ? "[truncated]" : null,
                entryImageM15: entryImage2DownloadUrl ? "[truncated]" : null,
              }, null, 2)
            );
            
            const result = await addTrade(userId, tradeData);
            devLog("Trade saved successfully with ID:", result.id);
            

          } catch (addError) {
            logError("Error adding trade:", addError);
            throw new Error(`Failed to create trade: ${addError instanceof Error ? addError.message : String(addError)}`);
          }
        }
      } catch (operationError) {
        logError("Error during trade operation:", operationError);
        throw operationError;
      }
      
      // Hiển thị animation thành công
      setIsSuccess(true);
      
      // Xóa bản nháp nếu đang ở chế độ tạo mới
      if (!isEditMode && userId) {
        clearDraftFromLocalStorage(userId);
        setHasDraft(false);
        setShowDraftNotice(false);
        devLog('Draft cleared after successful submission');
      }
      
      // Sử dụng toast thông báo
      toast({
        title: isEditMode ? "Trade Updated Successfully" : "Trade Added Successfully",
        description: isEditMode 
          ? "Your trade has been updated." 
          : "Your new trade has been recorded.",
        variant: "default",
      });
      
      // Đợi animation chạy xong rồi chuyển hướng
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      logError("Error submitting trade:", error);
      onError(error);
      
      // Hiển thị toast lỗi
      toast({
        title: "Error Saving Trade",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsFormSubmitting(false);
      onSubmitting(false);
    }
  };

  // Render the modern, redesigned form
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="form-container space-y-6 sm:space-y-8 w-full max-w-[100%] mx-auto overflow-hidden pb-4">
      {/* Show draft notification if available */}
      {showDraftNotice && !isEditMode && (
        <Alert variant="default" className="mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Draft Available</AlertTitle>
          <AlertDescription className="text-sm text-blue-600 dark:text-blue-300">
            You have an unsaved draft for this trade. Would you like to restore or delete it?
          </AlertDescription>
          <div className="mt-2 flex flex-row gap-2">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="border-blue-300 bg-white/80 dark:bg-blue-900/30 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50"
              onClick={loadDraft}
              disabled={isDraftLoading}
            >
              {isDraftLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Load Draft
                </>
              )}
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className="text-blue-600 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
              onClick={discardDraft}
              disabled={isDraftLoading}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Draft
            </Button>
          </div>
        </Alert>
      )}
    
      {/* Main content section - two columns on desktop, one on mobile */}
      <div className="space-y-6 sm:space-y-8 overflow-x-hidden max-w-full px-1">
              {/* Core Trade Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 md:mb-5 flex items-center">
                  <LineChart className="h-5 w-5 text-primary/80 mr-2" />
                  Trade Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 overflow-hidden">
                  {/* Left column */}
                  <div className="space-y-5 sm:space-y-6 overflow-hidden">
                    {/* Currency Pair & Direction */}
                    <div className="space-y-5 overflow-hidden">
                      {/* Currency Pair Selection - Simple Badge Style */}
                      <div>
                        <Label htmlFor="pair" className="font-medium text-sm sm:text-base mb-2 inline-block">Currency Pair</Label>
                        <div className="flex gap-2">
                          <Badge 
                            onClick={() => setValue("pair", "XAUUSD")}
                            className={`px-4 py-2 cursor-pointer transition-colors flex-1 text-center justify-center font-mono text-sm ${
                              form.getValues("pair") === "XAUUSD"
                                ? "bg-amber-500/90 hover:bg-amber-500 text-white font-medium"
                                : "bg-muted/60 hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            XAUUSD
                          </Badge>
                          <Badge 
                            onClick={() => setValue("pair", "EURUSD")}
                            className={`px-4 py-2 cursor-pointer transition-colors flex-1 text-center justify-center font-mono text-sm ${
                              form.getValues("pair") === "EURUSD"
                                ? "bg-primary/90 hover:bg-primary text-white font-medium"
                                : "bg-muted/60 hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            EURUSD
                          </Badge>
                          <Badge 
                            onClick={() => setValue("pair", "USDJPY")}
                            className={`px-4 py-2 cursor-pointer transition-colors flex-1 text-center justify-center font-mono text-sm ${
                              form.getValues("pair") === "USDJPY"
                                ? "bg-indigo-500/90 hover:bg-indigo-500 text-white font-medium"
                                : "bg-muted/60 hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            USDJPY
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Direction */}
                      <div>
                        <Label className="font-medium text-sm sm:text-base mb-2 inline-block">Direction</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            className={`rounded-md flex items-center justify-center h-10 transition-colors ${
                              form.getValues("direction") === "BUY"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted"
                            }`}
                            onClick={() => setValue("direction", "BUY")}
                          >
                            <ArrowUp className="mr-1.5 h-4 w-4" />
                            <span className="text-sm font-medium">Buy</span>
                          </Button>
                          <Button
                            type="button"
                            className={`rounded-md flex items-center justify-center h-10 transition-colors ${
                              form.getValues("direction") === "SELL"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted"
                            }`}
                            onClick={() => setValue("direction", "SELL")}
                          >
                            <ArrowDown className="mr-1.5 h-4 w-4" />
                            <span className="text-sm font-medium">Sell</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Entry Price & Entry Date in a row on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Entry Price */}
                      <div>
                        <div>
                          <Label htmlFor="entryPrice" className="font-medium text-sm mb-1.5 inline-block">Entry Price</Label>
                        </div>
                        <div className="relative">
                          <NumberInput
                            id="entryPrice"
                            placeholder="0.0000"
                            className="font-mono h-10 text-sm pr-9"
                            value={form.getValues("entryPrice")}
                            onChange={(value) => form.setValue("entryPrice", value || 0)}
                            decimalPlaces={4}
                            inputMode="decimal"
                          />
                          {canFetchPrice && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <GetPriceButton 
                                symbol={pair} 
                                onPriceFetched={(price) => {
                                  form.setValue("entryPrice", price);
                                  // Tính lại Risk-to-Reward ratio sau khi cập nhật giá
                                  if (stopLoss && takeProfit) {
                                    const ratio = calculateRiskRewardRatio(
                                      price, 
                                      stopLoss, 
                                      takeProfit, 
                                      direction as Direction
                                    );
                                    setRiskRewardRatio(ratio);
                                  }
                                }}
                                tooltipText="Get current market price for this asset"
                                size="xs"
                                variant="ghost"
                                className="text-muted-foreground hover:text-primary"
                              />
                            </div>
                          )}
                        </div>
                        {form.formState.errors.entryPrice && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.entryPrice.message as string}
                          </p>
                        )}
                      </div>

                      {/* Entry Date */}
                      <div>
                        <Label htmlFor="entryDate" className="font-medium text-sm mb-1.5 inline-block">Entry Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="entryDate"
                              variant="outline"
                              className="w-full h-10 px-3 justify-start text-left font-normal"
                            >
                              {form.getValues("entryDate") ? (
                                format(new Date(form.getValues("entryDate")), "dd/MM/yyyy")
                              ) : (
                                <span className="text-muted-foreground">DD/MM/YYYY</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={form.getValues("entryDate") ? new Date(form.getValues("entryDate")) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setValue("entryDate", format(date, "yyyy-MM-dd"));
                                  // Close the popover after selection
                                  document.body.click();
                                }
                              }}
                              disabled={(date) => 
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Stop Loss & Take Profit in a row on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Stop Loss */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label htmlFor="stopLoss" className="font-medium text-sm">Stop Loss</Label>
                          <div className="opacity-0 flex items-center space-x-1 text-sm">
                            <span>&nbsp;</span>
                          </div>
                        </div>
                        <NumberInput
                          id="stopLoss"
                          placeholder="0.0000"
                          className="font-mono h-10 text-sm"
                          value={form.getValues("stopLoss")}
                          onChange={(value) => form.setValue("stopLoss", value || 0)}
                          decimalPlaces={4}
                          inputMode="decimal"
                        />
                        {form.formState.errors.stopLoss && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.stopLoss.message as string}
                          </p>
                        )}
                      </div>

                      {/* Take Profit */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label htmlFor="takeProfit" className="font-medium text-sm">Take Profit</Label>
                          <div className="opacity-0 flex items-center space-x-1 text-sm">
                            <span>&nbsp;</span>
                          </div>
                        </div>
                        <NumberInput
                          id="takeProfit"
                          placeholder="0.0000"
                          className="font-mono h-10 text-sm"
                          value={form.getValues("takeProfit")}
                          onChange={(value) => form.setValue("takeProfit", value || 0)}
                          decimalPlaces={4}
                          inputMode="decimal"
                        />
                        {form.formState.errors.takeProfit && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.takeProfit.message as string}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right column - optimized for mobile */}
                  <div className="space-y-5 mt-0">
                    {/* Lot Size & Risk % in a row on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Lot Size */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label htmlFor="lotSize" className="font-medium text-sm">Lot Size</Label>
                          <div className="opacity-0 flex items-center space-x-1 text-sm">
                            <span>&nbsp;</span>
                          </div>
                        </div>
                        <NumberInput
                          id="lotSize"
                          placeholder="0.01"
                          className="font-mono h-10 text-sm"
                          value={form.getValues("lotSize")}
                          onChange={(value) => form.setValue("lotSize", value || 0.01)}
                          decimalPlaces={2}
                          min={0.01}
                          step={0.01}
                          inputMode="decimal"
                        />
                        {form.formState.errors.lotSize && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.lotSize.message as string}
                          </p>
                        )}
                      </div>
                      
                      {/* Risk Calculator */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label htmlFor="riskPercentage" className="font-medium text-sm">Risk %</Label>
                          <div className="flex items-center space-x-1 text-sm font-medium">
                            <div 
                              className={cn(
                                "flex items-center",
                                isLoadingUserData 
                                  ? "text-muted-foreground" 
                                  : riskPercentage <= 1
                                    ? "text-green-600" 
                                    : riskPercentage <= 2
                                      ? "text-amber-600"
                                      : "text-red-600"
                              )}
                            >
                              <span>{riskPercentage}%</span>
                              {!isLoadingUserData && (
                                <span className="ml-1">
                                  = ${Math.round(accountBalance * (riskPercentage / 100))}
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={calculateLotSizeByRisk}
                              disabled={isCalculatingLotSize || isLoadingUserData}
                              className={cn(
                                "h-5 w-5 p-0 ml-1",
                                isLoadingUserData ? "" : 
                                  riskPercentage <= 1 
                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                                    : riskPercentage <= 2 
                                      ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                                      : "text-red-600 hover:text-red-700 hover:bg-red-50"
                              )}
                              title={isLoadingUserData ? "Loading account balance..." : `Calculate lot size using ${riskPercentage}% risk`}
                            >
                              {isCalculatingLotSize ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isLoadingUserData ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                <Zap className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="w-full h-10 px-3 border rounded-md bg-background flex items-center relative touch-none overflow-hidden">
                          <input
                            id="riskSlider"
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={riskPercentage}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value);
                              setRiskPercentage(newValue);
                              // Log the current risk amount in USD for debugging
                              devLog(`Risk amount: $${Math.round(accountBalance * (newValue / 100))}`);
                            }}
                            className="w-full h-10 opacity-0 absolute cursor-pointer z-10 touch-none"
                            onWheel={(e) => e.preventDefault()}
                          />
                          <div className="w-full flex items-center px-1">
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all bg-primary" 
                                style={{ 
                                  width: `${(riskPercentage / 3) * 100}%`
                                }}
                              />
                            </div>
                            <div 
                              className="absolute h-4 w-4 rounded-full shadow-md border border-white/70 transition-all bg-primary" 
                              style={{ 
                                left: `calc(${(riskPercentage / 3) * 100 * 0.85}% + 12px)`,
                                top: '50%',
                                transform: 'translateY(-50%)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Risk:Reward Display */}
                    {riskRewardRatio > 0 && (
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-1">
                          Risk:Reward 1:{riskRewardRatio.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trading Strategy & Pattern */}
              <div>
                <h3 className="text-lg font-semibold mb-4 md:mb-5 flex items-center">
                  <LineChart className="h-5 w-5 text-primary/80 mr-2" />
                  Strategy & Conditions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 overflow-hidden">
                  {/* Left column */}
                  <div className="space-y-5 overflow-hidden">
                    {/* Strategy & Market Condition in a row on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Trading Strategy */}
                      <div>
                        <Label htmlFor="strategy" className="font-medium text-sm mb-1.5 inline-block">Trading Strategy</Label>
                        <Select
                          onValueChange={(value) => {
                            devLog("Strategy changed to:", value);
                            // Chỉ cập nhật nếu giá trị thay đổi
                            if (value !== strategyNameValue) {
                              // Cập nhật giá trị vào form
                              setValue("strategy", value);
                              // Đồng thời cập nhật state tránh vòng lặp
                              setStrategyNameValue(value);
                              
                              // Find and update the selected strategy object
                              const newSelectedStrategy = strategies.find(s => s.name === value);
                              if (newSelectedStrategy) {
                                devLog("Found matching strategy:", newSelectedStrategy.name);
                                setSelectedStrategy(newSelectedStrategy);
                                
                                // Initialize strategy checks based on the conditions in the selected strategy
                                const initialChecks: StrategyConditionCheck[] = [];
                                if (Array.isArray(newSelectedStrategy.entryConditions)) {
                                  newSelectedStrategy.entryConditions.forEach((condition, index) => {
                                    initialChecks.push({
                                      conditionId: condition.id || `entry-${index}`,
                                      checked: false,
                                      passed: false
                                    });
                                  });
                                }
                                
                                setStrategyChecks(initialChecks);
                              } else {
                                devLog("No matching strategy found for:", value);
                                // Clear the selected strategy if no match is found
                                setSelectedStrategy(null);
                                setStrategyChecks([]);
                              }
                            }
                          }}
                          value={strategyNameValue}
                          defaultValue={strategyNameValue}
                        >
                          <SelectTrigger className="h-10 text-sm text-left">
                            <SelectValue placeholder={isLoadingStrategies ? "Loading strategies..." : "Select strategy"} className="text-left" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingStrategies ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>Loading strategies...</span>
                              </div>
                            ) : strategies.length > 0 ? (
                              // Chỉ hiển thị chiến lược từ Firebase
                              strategies.map((strategy) => (
                                <SelectItem key={strategy.id} value={strategy.name}>
                                  {strategy.name}
                                  {strategy.isDefault && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                                  )}
                                </SelectItem>
                              ))
                            ) : (
                              // Thông báo nếu không có chiến lược
                              <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                                No strategies found.<br/>
                                Add strategies in Settings.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Market Condition */}
                      <div>
                        <Label htmlFor="marketCondition" className="font-medium text-sm mb-1.5 inline-block">Market Condition</Label>
                        <Select
                          onValueChange={(value) => setValue("marketCondition", value)}
                          defaultValue={form.getValues("marketCondition")}
                        >
                          <SelectTrigger className="h-10 text-sm text-left">
                            <SelectValue placeholder="Select condition" className="text-left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Trending">Trending</SelectItem>
                            <SelectItem value="Ranging">Ranging</SelectItem>
                            <SelectItem value="Volatile">Volatile</SelectItem>
                            <SelectItem value="Low Volatility">Low Volatility</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Technical Pattern & Emotion in a row on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Technical Pattern */}
                      <div>
                        <Label htmlFor="techPattern" className="font-medium text-sm mb-1.5 inline-block">Technical Pattern</Label>
                        <Input
                          id="techPattern"
                          placeholder="E.g., Double Top"
                          className="h-10 text-sm"
                          {...form.register("techPattern")}
                        />
                      </div>

                      {/* Emotion */}
                      <div>
                        <Label htmlFor="emotion" className="font-medium text-sm mb-1.5 inline-block">Emotional State</Label>
                        <Select
                          onValueChange={(value) => setValue("emotion", value)}
                          defaultValue={form.getValues("emotion")}
                        >
                          <SelectTrigger className="h-10 text-sm text-left">
                            <SelectValue placeholder="Select emotion" className="text-left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Confident">Confident</SelectItem>
                            <SelectItem value="Uncertain">Uncertain</SelectItem>
                            <SelectItem value="Fearful">Fearful</SelectItem>
                            <SelectItem value="Greedy">Greedy</SelectItem>
                            <SelectItem value="Calm">Calm</SelectItem>
                            <SelectItem value="Impatient">Impatient</SelectItem>
                            <SelectItem value="Neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Session Type and News */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Session Type */}
                      <div>
                        <Label htmlFor="sessionType" className="font-medium text-sm mb-1.5 inline-block">Trading Session</Label>
                        <Select
                          onValueChange={(value) => setValue("sessionType", value)}
                          defaultValue={form.getValues("sessionType")}
                        >
                          <SelectTrigger className="h-10 text-sm text-left">
                            <SelectValue placeholder="Select session" className="text-left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asian">Asian</SelectItem>
                            <SelectItem value="London">London</SelectItem>
                            <SelectItem value="New York">New York</SelectItem>
                            <SelectItem value="Overlap">Session Overlap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* News Toggle - Extremely Simplified */}
                      <div>
                        <Label htmlFor="hasNews" className="font-medium text-sm mb-1.5 inline-block">News</Label>
                        <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-background">
                          <span className="text-sm font-medium">News</span>
                          <Switch
                            id="hasNews"
                            checked={hasNews}
                            onCheckedChange={(checked) => setValue("hasNews", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Discipline Factors - Optimized Grid Layout with 2-3 Columns */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-primary/80 mr-2" />
                  Trade Discipline
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                  {/* Discipline Toggle Cards - Optimized Grid Layout */}
                  <div 
                    className={cn(
                      "cursor-pointer rounded-md border transition-colors flex items-center h-10 px-3",
                      followedPlan
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    )}
                    onClick={() => setValue("followedPlan", !followedPlan)}
                  >
                    {followedPlan 
                      ? <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" /> 
                      : <X className="h-4 w-4 mr-2 flex-shrink-0" />}
                    <span className="text-sm truncate font-medium">Followed Plan</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "cursor-pointer rounded-md border transition-colors flex items-center h-10 px-3",
                      !enteredEarly
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    )}
                    onClick={() => setValue("enteredEarly", !enteredEarly)}
                  >
                    {!enteredEarly
                      ? <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" /> 
                      : <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />}
                    <span className="text-sm truncate font-medium">Waited for Signal</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "cursor-pointer rounded-md border transition-colors flex items-center h-10 px-3",
                      !revenge
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    )}
                    onClick={() => setValue("revenge", !revenge)}
                  >
                    {!revenge
                      ? <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" /> 
                      : <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />}
                    <span className="text-sm truncate font-medium">No Revenge Trade</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "cursor-pointer rounded-md border transition-colors flex items-center h-10 px-3",
                      !overLeveraged
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    )}
                    onClick={() => setValue("overLeveraged", !overLeveraged)}
                  >
                    {!overLeveraged
                      ? <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" /> 
                      : <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />}
                    <span className="text-sm truncate font-medium">Proper Leverage</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "cursor-pointer rounded-md border transition-colors flex items-center h-10 px-3",
                      !movedStopLoss
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    )}
                    onClick={() => setValue("movedStopLoss", !movedStopLoss)}
                  >
                    {!movedStopLoss
                      ? <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" /> 
                      : <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />}
                    <span className="text-sm truncate font-medium">Respected SL</span>
                  </div>
                </div>
              </div>
              
              {/* Strategy Compliance Section */}
              {selectedStrategy && (
                <div className="mt-4">
                  {/* Strategy Verification Checklist */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle2 className="h-5 w-5 text-primary/80 mr-2" />
                      <h3 className="text-base font-semibold">Strategy Compliance Check</h3>
                    </div>
                    
                    <div className="bg-card/50 shadow-sm rounded-md p-3">
                      <StrategyChecklist 
                        strategy={selectedStrategy}
                        value={strategyChecks}
                        onChange={setStrategyChecks}
                        showCompliance={true}
                      />
                    </div>
                  </div>
                  

                </div>
              )}

              <Separator />

              {/* Chart Images with preview and progress */}
              <div>
                <h3 className="text-lg font-semibold mb-4 md:mb-5 flex items-center flex-wrap">
                  <ImageIcon className="h-5 w-5 text-primary/80 mr-2" />
                  Chart Images
                  <span className="ml-2 text-xs text-muted-foreground">(Max 2 images, 5MB each)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 overflow-hidden">
                  {/* Image 1 */}
                  <div className="space-y-3 overflow-hidden">
                    <Label className="font-medium text-sm sm:text-base mb-1 inline-block">H4 Chart Image</Label>
                    
                    {entryImage1Preview ? (
                      <div className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 shadow-sm">
                        <div className="image-placeholder">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <img 
                          src={entryImage1Preview} 
                          alt="Trade chart" 
                          className="w-full h-[180px] sm:h-[200px] object-cover absolute inset-0 trade-form-image"
                          loading="lazy"
                          onLoad={(e) => {
                            // Remove placeholder when image loads
                            const imgElement = e.target as HTMLImageElement;
                            imgElement.classList.add("loaded");
                            imgElement.previousElementSibling?.classList.remove("animate-pulse");
                            imgElement.previousElementSibling?.classList.add("opacity-0");
                          }}
                        />
                        <div className="absolute top-3 right-3 flex gap-2.5">
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="secondary"
                            className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white shadow-md"
                            onClick={() => {
                              // Mở modal xem hình ảnh đầy đủ
                              const element = document.createElement('div');
                              element.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80';
                              
                              // Thêm chức năng đóng khi nhấp ra ngoài hoặc nhấn ESC
                              element.onclick = (e) => {
                                if (e.target === element) document.body.removeChild(element);
                              };
                              
                              // Tạo container cho hình ảnh và nút đóng
                              const container = document.createElement('div');
                              container.className = 'relative max-w-screen-lg max-h-screen';
                              
                              // Tạo nút đóng
                              const closeButton = document.createElement('button');
                              closeButton.className = 'absolute top-4 right-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70';
                              closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                              closeButton.onclick = () => document.body.removeChild(element);
                              
                              // Tạo hình ảnh
                              const img = document.createElement('img');
                              img.src = entryImage1Preview || '';
                              img.className = 'max-h-[90vh] max-w-full object-contain rounded-lg';
                              img.alt = 'Entry chart';
                              
                              // Ghép các phần tử lại
                              container.appendChild(closeButton);
                              container.appendChild(img);
                              element.appendChild(container);
                              
                              // Thêm vào body
                              document.body.appendChild(element);
                              
                              // Thêm phím tắt ESC để đóng
                              const handleEsc = (e: KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                  document.body.removeChild(element);
                                  document.removeEventListener('keydown', handleEsc);
                                }
                              };
                              document.addEventListener('keydown', handleEsc);
                            }}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </Button>
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="destructive"
                            className="h-10 w-10 rounded-full bg-black/50 hover:bg-red-500/90 shadow-md"
                            onClick={deleteEntryImage1}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {/* Progress bar while uploading */}
                        {entryImage1UploadProgress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2">
                            <Progress value={entryImage1UploadProgress} className="h-2" />
                            <div className="text-center text-white text-xs mt-1 font-medium">
                              {entryImage1UploadProgress < 100 ? 
                                `${Math.round(entryImage1UploadProgress)}% uploading...` : 
                                "Upload complete!"
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* Success indicator removed as requested */}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg h-[180px] sm:h-[200px] relative hover:border-primary/50 transition-colors">
                        <Label 
                          htmlFor="entryImage1" 
                          className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4"
                        >
                          <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
                          <span className="text-primary font-medium text-sm sm:text-base text-center">
                            Select H4 timeframe image
                          </span>
                          <p className="text-xs text-muted-foreground mt-1.5 text-center">
                            PNG, JPG up to 5MB
                          </p>
                        </Label>
                        <input 
                          id="entryImage1" 
                          type="file" 
                          accept="image/*" 
                          className="sr-only" 
                          onChange={handleEntryImage1Change}
                        />
                      </div>
                    )}
                    
                    {entryImage1Error && (
                      <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/5 px-3 py-2 rounded-md">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{entryImage1Error}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Image 2 */}
                  <div className="space-y-3 overflow-hidden">
                    <Label className="font-medium text-sm sm:text-base mb-1 inline-block">M15 Chart Image</Label>
                    
                    {entryImage2Preview ? (
                      <div className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 shadow-sm">
                        <div className="image-placeholder">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <img 
                          src={entryImage2Preview} 
                          alt="Trade chart" 
                          className="w-full h-[180px] sm:h-[200px] object-cover absolute inset-0 trade-form-image"
                          loading="lazy"
                          onLoad={(e) => {
                            // Remove placeholder when image loads
                            const imgElement = e.target as HTMLImageElement;
                            imgElement.classList.add("loaded");
                            imgElement.previousElementSibling?.classList.remove("animate-pulse");
                            imgElement.previousElementSibling?.classList.add("opacity-0");
                          }}
                        />
                        <div className="absolute top-3 right-3 flex gap-2.5">
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="secondary"
                            className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white shadow-md"
                            onClick={() => {
                              // Mở modal xem hình ảnh đầy đủ
                              const element = document.createElement('div');
                              element.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80';
                              
                              // Thêm chức năng đóng khi nhấp ra ngoài hoặc nhấn ESC
                              element.onclick = (e) => {
                                if (e.target === element) document.body.removeChild(element);
                              };
                              
                              // Tạo container cho hình ảnh và nút đóng
                              const container = document.createElement('div');
                              container.className = 'relative max-w-screen-lg max-h-screen';
                              
                              // Tạo nút đóng
                              const closeButton = document.createElement('button');
                              closeButton.className = 'absolute top-4 right-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70';
                              closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                              closeButton.onclick = () => document.body.removeChild(element);
                              
                              // Tạo hình ảnh
                              const img = document.createElement('img');
                              img.src = entryImage2Preview || '';
                              img.className = 'max-h-[90vh] max-w-full object-contain rounded-lg';
                              img.alt = 'Entry M15 chart';
                              
                              // Ghép các phần tử lại
                              container.appendChild(closeButton);
                              container.appendChild(img);
                              element.appendChild(container);
                              
                              // Thêm vào body
                              document.body.appendChild(element);
                              
                              // Thêm phím tắt ESC để đóng
                              const handleEsc = (e: KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                  document.body.removeChild(element);
                                  document.removeEventListener('keydown', handleEsc);
                                }
                              };
                              document.addEventListener('keydown', handleEsc);
                            }}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </Button>
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="destructive"
                            className="h-10 w-10 rounded-full bg-black/50 hover:bg-red-500/90 shadow-md"
                            onClick={deleteEntryImage2}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {/* Progress bar while uploading */}
                        {entryImage2UploadProgress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2">
                            <Progress value={entryImage2UploadProgress} className="h-2" />
                            <div className="text-center text-white text-xs mt-1 font-medium">
                              {entryImage2UploadProgress < 100 ? 
                                `${Math.round(entryImage2UploadProgress)}% uploading...` : 
                                "Upload complete!"
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* Success indicator removed as requested */}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg h-[180px] sm:h-[200px] relative hover:border-primary/50 transition-colors">
                        <Label 
                          htmlFor="entryImage2" 
                          className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4"
                        >
                          <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
                          <span className="text-primary font-medium text-sm sm:text-base text-center">
                            Select M15 timeframe image
                          </span>
                          <p className="text-xs text-muted-foreground mt-1.5 text-center">
                            PNG, JPG up to 5MB
                          </p>
                        </Label>
                        <input 
                          id="entryImage2" 
                          type="file" 
                          accept="image/*" 
                          className="sr-only" 
                          onChange={handleEntryImage2Change}
                        />
                      </div>
                    )}
                    
                    {entryImage2Error && (
                      <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/5 px-3 py-2 rounded-md">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{entryImage2Error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Trade Exit Information - Chỉ hiển thị khi chỉnh sửa giao dịch đã đóng */}
              {isEditMode && initialValues && initialValues.isOpen === false && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 md:mb-5 flex items-center">
                      <Unlock className="h-5 w-5 text-primary/80 mr-2" />
                      Trade Exit Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pb-2">
                      {/* Exit Price */}
                      <div className="space-y-2">
                        <Label htmlFor="exitPrice" className="font-medium">Exit Price</Label>
                        <NumberInput
                          id="exitPrice"
                          placeholder="0.0000"
                          className="font-mono"
                          value={form.getValues("exitPrice") || 0}
                          onChange={(value) => form.setValue("exitPrice", value || 0)}
                          decimalPlaces={4}
                          inputMode="decimal"
                          autoComplete="off"
                        />
                        {form.formState.errors.exitPrice && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.exitPrice.message as string}</p>
                        )}
                      </div>
                      
                      {/* Trade Result */}
                      <div className="space-y-2">
                        <Label htmlFor="result" className="font-medium">Trade Result</Label>
                        <Select
                          value={form.getValues("result") || undefined}
                          onValueChange={(value) => form.setValue("result", value as any)}
                        >
                          <SelectTrigger id="result" className="text-left">
                            <SelectValue placeholder="Select result..." className="text-left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TP">Take Profit</SelectItem>
                            <SelectItem value="SL">Stop Loss</SelectItem>
                            <SelectItem value="BE">Break Even</SelectItem>
                            <SelectItem value="MANUAL">Manual Close</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Closing Note */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="closingNote" className="font-medium">Closing Note</Label>
                        <span className="text-xs text-muted-foreground">Optional</span>
                      </div>
                      <Input
                        id="closingNote"
                        placeholder="Enter any notes about closing this trade..."
                        autoComplete="off"
                        {...form.register("closingNote")}
                      />
                    </div>
                    
                    {/* Chart Images for Trade Exit */}
                    <div className="mt-6 space-y-2">
                      <h4 className="font-medium mb-4 flex items-center">
                        <ImageIcon className="h-4 w-4 text-primary/80 mr-2" />
                        Exit Chart Images
                        <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Exit Image 1 (H4) */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">H4 Exit Chart</Label>
                          
                          {exitImage1Preview ? (
                            <div className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 shadow-sm">
                              <div className="image-placeholder">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                              <img 
                                src={exitImage1Preview} 
                                alt="Exit chart H4" 
                                className="w-full h-[180px] sm:h-[200px] object-cover absolute inset-0 trade-form-image"
                                loading="lazy"
                                onLoad={(e) => {
                                  // Remove placeholder when image loads
                                  const imgElement = e.target as HTMLImageElement;
                                  imgElement.classList.add("loaded");
                                  imgElement.previousElementSibling?.classList.remove("animate-pulse");
                                  imgElement.previousElementSibling?.classList.add("opacity-0");
                                }}

                              />
                              <div className="absolute top-3 right-3 flex gap-2.5">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full bg-black/60 hover:bg-red-600 border-0" 
                                  onClick={deleteExitImage1}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Progress bar while uploading */}
                              {exitImage1UploadProgress > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2">
                                  <Progress value={exitImage1UploadProgress} className="h-2" />
                                  <div className="text-center text-white text-xs mt-1 font-medium">
                                    {exitImage1UploadProgress < 100 ? 
                                      `${Math.round(exitImage1UploadProgress)}% uploading...` : 
                                      "Upload complete!"
                                    }
                                  </div>
                                </div>
                              )}
                              
                              {/* Success indicator removed as requested */}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg h-[160px] relative hover:border-primary/50 transition-colors">
                              <Label 
                                htmlFor="exitImage1" 
                                className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4"
                              >
                                <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <span className="text-primary font-medium text-sm text-center">
                                  Select H4 exit image
                                </span>
                                <p className="text-xs text-muted-foreground mt-1 text-center">
                                  PNG, JPG up to 5MB
                                </p>
                              </Label>
                              <input 
                                id="exitImage1" 
                                type="file" 
                                accept="image/*" 
                                className="sr-only" 
                                onChange={handleExitImage1Change}
                              />
                            </div>
                          )}
                          
                          {exitImage1Error && (
                            <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/5 px-3 py-2 rounded-md">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span>{exitImage1Error}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Exit Image 2 (M15) */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">M15 Exit Chart</Label>
                          
                          {exitImage2Preview ? (
                            <div className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 shadow-sm">
                              <div className="image-placeholder">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                              <img 
                                src={exitImage2Preview} 
                                alt="Exit chart M15" 
                                className="w-full h-[180px] sm:h-[200px] object-cover absolute inset-0 trade-form-image"
                                loading="lazy"
                                onLoad={(e) => {
                                  // Remove placeholder when image loads
                                  const imgElement = e.target as HTMLImageElement;
                                  imgElement.classList.add("loaded");
                                  imgElement.previousElementSibling?.classList.remove("animate-pulse");
                                  imgElement.previousElementSibling?.classList.add("opacity-0");
                                }}

                              />
                              <div className="absolute top-3 right-3 flex gap-2.5">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full bg-black/60 hover:bg-red-600 border-0" 
                                  onClick={deleteExitImage2}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Progress bar while uploading */}
                              {exitImage2UploadProgress > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2">
                                  <Progress value={exitImage2UploadProgress} className="h-2" />
                                  <div className="text-center text-white text-xs mt-1 font-medium">
                                    {exitImage2UploadProgress < 100 ? 
                                      `${Math.round(exitImage2UploadProgress)}% uploading...` : 
                                      "Upload complete!"
                                    }
                                  </div>
                                </div>
                              )}
                              
                              {/* Success indicator removed as requested */}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg h-[160px] relative hover:border-primary/50 transition-colors">
                              <Label 
                                htmlFor="exitImage2" 
                                className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4"
                              >
                                <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <span className="text-primary font-medium text-sm text-center">
                                  Select M15 exit image
                                </span>
                                <p className="text-xs text-muted-foreground mt-1 text-center">
                                  PNG, JPG up to 5MB
                                </p>
                              </Label>
                              <input 
                                id="exitImage2" 
                                type="file" 
                                accept="image/*" 
                                className="sr-only" 
                                onChange={handleExitImage2Change}
                              />
                            </div>
                          )}
                          
                          {exitImage2Error && (
                            <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/5 px-3 py-2 rounded-md">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span>{exitImage2Error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview Calculation - Display pip and profit */}
                    {form.getValues("exitPrice") && (
                      <div className="mt-4 p-3 border rounded-md bg-muted/10">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Pips:</span>
                            <span className="font-medium">
                              {calculatePreviewPips()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Profit/Loss:</span>
                            <span className={`font-medium ${
                              calculatePreviewProfit() > 0 ? "text-green-600" : 
                              calculatePreviewProfit() < 0 ? "text-red-600" : ""
                            }`}>
                              {formatCurrency(calculatePreviewProfit())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}


              
              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="notes" className="font-medium">Additional Notes</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Input
                  id="notes"
                  placeholder="Enter any additional thoughts or observations about this trade..."
                  className="max-w-full h-[38px]"
                  {...form.register("notes")}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 items-center pt-4 mt-6 mb-8 px-4 border-t border-border/50 overflow-hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Xóa bản nháp khi cancel
                    if (userId) {
                      clearDraftFromLocalStorage(userId);
                      setHasDraft(false);
                    }
                    window.history.back();
                  }}
                  disabled={isFormSubmitting}
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>
                {isSuccess ? (
                  <div className="relative fade-in">
                    <Button 
                      type="button" 
                      className="min-w-[120px] bg-green-500 hover:bg-green-600 text-white transition-all"
                      disabled
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isEditMode ? "Updated!" : "Saved!"}
                    </Button>
                    <div className="absolute inset-0 bg-green-400 rounded-md animate-pulse opacity-30"></div>
                  </div>
                ) : (
                  <div className="fade-in">
                    <Button 
                      type="submit" 
                      disabled={isFormSubmitting || isUploading}
                      className="min-w-[150px] bg-primary hover:bg-primary/90"
                    >
                      {isFormSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>{isEditMode ? "Update Trade" : "Add Trade"}</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
    </form>
  );
}