import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CurrencyPair, Direction, TradeResult } from "@/lib/forex-calculator";
import { Trade } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DialogContent, 
  DialogTitle, 
  DialogHeader, 
  DialogFooter,
  DialogDescription,
  DialogWithContext
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Icons } from "@/components/icons/icons";
import { updateTrade } from "@/lib/firebase";
import { calculateProfit, calculatePips, formatPrice } from "@/lib/forex-calculator";
import { uploadTradeImage } from "@/lib/api-service";
import { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { TradeStatus } from "@/lib/trade-status-config";
import TradeStatusBadge from "./TradeStatusBadge";
// Lưu ý: Component này không cần import trực tiếp tradeUpdateService
// vì updateTrade từ firebase.ts đã tích hợp thông báo tới TradeUpdateService
// khi đóng giao dịch (isClosingTrade = true trong updateTrade)

// Schema validation for trade closing form
const closeTradeSchema = z.object({
  result: z.enum(["TP", "SL", "BE", "MANUAL"]),
  exitPrice: z.string().refine(value => !isNaN(parseFloat(value)), {
    message: "Exit price must be a valid number"
  }),
  closingNote: z.string().optional(),
  exitImage: z.any().optional(),
  exitImageM15: z.any().optional(),
});

type CloseTradeFormValues = z.infer<typeof closeTradeSchema>;

interface CloseTradeFormProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CloseTradeForm({ trade, isOpen, onClose, onSuccess }: CloseTradeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  
  // Calculation results when price changes
  const [previewResult, setPreviewResult] = useState<{
    pips: number;
    profitLoss: number;
  } | null>(null);

  // Initialize form with default values
  const form = useForm<CloseTradeFormValues>({
    resolver: zodResolver(closeTradeSchema),
    defaultValues: {
      result: "MANUAL" as TradeResult,
      exitPrice: "",
      closingNote: "",
    },
  });

  const { setValue, watch, register } = form;
  const watchedResult = watch("result");
  const watchedExitPrice = watch("exitPrice");
  const [exitImage, setExitImage] = useState<File | null>(null);
  const [exitImageM15, setExitImageM15] = useState<File | null>(null);
  const [exitImagePreview, setExitImagePreview] = useState<string | null>(null);
  const [exitImageM15Preview, setExitImageM15Preview] = useState<string | null>(null);

  // Update exit price based on result selection
  const updateExitPrice = (result: TradeResult) => {
    switch (result) {
      case "TP":
        setValue("exitPrice", trade.takeProfit?.toString() || "");
        break;
      case "SL":
        setValue("exitPrice", trade.stopLoss?.toString() || "");
        break;
      case "BE":
        setValue("exitPrice", trade.entryPrice?.toString() || "");
        break;
      case "MANUAL":
        // Reset price only if coming from preset options
        if (["TP", "SL", "BE"].includes(watchedResult)) {
          setValue("exitPrice", "");
        }
        break;
    }
  };

  // Calculate preview results when exit price changes
  useEffect(() => {
    if (watchedExitPrice && !isNaN(parseFloat(watchedExitPrice))) {
      const exitPrice = parseFloat(watchedExitPrice);
      const { pips, profitLoss } = calculateTradeResult(exitPrice);
      setPreviewResult({ pips, profitLoss });
    } else {
      setPreviewResult(null);
    }
  }, [watchedExitPrice, watchedResult]);

  // Handle result type change
  const handleResultChange = (result: TradeResult) => {
    setValue("result", result);
    updateExitPrice(result);
  };

  // Calculate pips and profit
  const calculateTradeResult = (exitPrice: number) => {
    // Calculate pips
    const pips = calculatePips(
      trade.pair as CurrencyPair,
      trade.direction as Direction,
      trade.entryPrice as number,
      exitPrice
    );

    // Calculate profit/loss based on price difference
    const profitLoss = calculateProfit({
      pair: trade.pair as CurrencyPair,
      direction: trade.direction as Direction,
      entryPrice: trade.entryPrice as number,
      exitPrice: exitPrice,
      lotSize: trade.lotSize as number,
      accountCurrency: "USD" // Default currency
    });
    
    // Kết quả tính toán đã được chuẩn hóa, trả về trực tiếp
    return { 
      pips: pips, 
      profitLoss: profitLoss 
    };
  };

  // Form submit handler
  const onSubmit = async (data: CloseTradeFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Parse exit price
      const exitPrice = parseFloat(data.exitPrice.replace(",", "."));
      
      // Validate
      if (isNaN(exitPrice)) {
        toast({
          variant: "destructive",
          title: "Invalid price",
          description: "Please enter a valid exit price"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Calculate results
      const { pips, profitLoss } = calculateTradeResult(exitPrice);
      
      // Upload images (if any) với tối ưu hóa
      let exitImageUrl = "";
      let exitImageM15Url = "";
      
      // Hàm upload tối ưu - giảm code trùng lặp và logging không cần thiết
      const uploadImagesBatch = async () => {
        try {
          setIsUploading(true);
          
          // Tạo mảng promises để tải lên song song
          const uploadPromises = [];
          const uploadResults = {
            exitImage: null as string | null,
            exitImageM15: null as string | null
          };
          
          // Chỉ thêm promise nếu có ảnh để tránh xử lý không cần thiết
          if (exitImage) {
            uploadPromises.push(
              uploadTradeImage(
                trade.userId,
                trade.id,
                exitImage,
                "exit",
                (progress) => {
                  // Silent progress - có thể thêm state để cập nhật UI nếu cần
                }
              ).then(result => {
                if (result.success) {
                  uploadResults.exitImage = result.imageUrl;
                }
                return result;
              }).catch(() => {
                toast({
                  variant: "destructive",
                  title: "Image Upload Error",
                  description: "Could not upload exit chart. You can continue closing the trade."
                });
                return null;
              })
            );
          }
          
          if (exitImageM15) {
            uploadPromises.push(
              uploadTradeImage(
                trade.userId,
                trade.id,
                exitImageM15,
                "exitM15",
                (progress) => {
                  // Silent progress - có thể thêm state để cập nhật UI nếu cần
                }
              ).then(result => {
                if (result.success) {
                  uploadResults.exitImageM15 = result.imageUrl;
                }
                return result;
              }).catch(() => {
                toast({
                  variant: "destructive",
                  title: "Image Upload Error",
                  description: "Could not upload M15 chart. You can continue closing the trade."
                });
                return null;
              })
            );
          }
          
          // Chỉ chạy Promise.all nếu có ít nhất một ảnh cần upload
          if (uploadPromises.length > 0) {
            // Sử dụng Promise.allSettled để đảm bảo không fail nếu một trong các uploads lỗi
            await Promise.allSettled(uploadPromises);
            
            // Lấy URLs đã upload
            exitImageUrl = uploadResults.exitImage || "";
            exitImageM15Url = uploadResults.exitImageM15 || "";
          }
          
          return { exitImageUrl, exitImageM15Url };
        } catch (error) {
          // Chỉ toast khi có lỗi nghiêm trọng
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Error uploading images. The trade will be closed without images."
          });
          return { exitImageUrl: "", exitImageM15Url: "" };
        } finally {
          setIsUploading(false);
        }
      };
      
      // Thực hiện upload
      const { exitImageUrl: exitImgUrl, exitImageM15Url: exitImgM15Url } = await uploadImagesBatch();
      exitImageUrl = exitImgUrl;
      exitImageM15Url = exitImgM15Url;
      
      // Update data
      console.log("Closing trade and calculating profit/loss");
      const updateData: Partial<Trade> = {
        isOpen: false,
        closeDate: Timestamp.now(),
        exitPrice: exitPrice,
        result: data.result as TradeResult,
        pips: pips,
        profitLoss: profitLoss,
        closingNote: data.closingNote || "",
        updatedAt: Timestamp.now()
      };
      
      // Add image URLs if uploaded successfully
      if (exitImageUrl) {
        updateData.exitImage = exitImageUrl;
      }
      
      if (exitImageM15Url) {
        updateData.exitImageM15 = exitImageM15Url;
      }
      
      // Cập nhật giao dịch trong database thông qua firebase.updateTrade
      // Lưu ý: Hàm updateTrade đã được tích hợp với TradeUpdateService để thông báo
      // tới tất cả các component đang theo dõi giao dịch (tham khảo trong firebase.ts)
      // Tham số option sử dụng để đảm bảo hành vi đóng giao dịch hoạt động đúng
      await updateTrade(trade.userId, trade.id, updateData, {
        useBatch: true, // Force sử dụng batch operation để bảo đảm cập nhật đồng bộ với balances
        notifyType: 'close' // Xác định đây là thao tác đóng giao dịch để thông báo đúng
      });
      
      // Log kết quả đóng giao dịch 
      console.log(`Trade closed with result: ${data.result}, pips: ${pips}, P/L: ${profitLoss}`);
      
      // Success notification
      toast({
        title: "Trade has been closed",
        description: `${profitLoss > 0 ? "Profit" : "Loss"}: ${formatCurrency(profitLoss)}`,
        variant: profitLoss >= 0 ? "default" : "destructive"
      });
      
      // Execute callbacks
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
      
    } catch (error) {
      console.error("Error closing trade:", error);
      toast({
        variant: "destructive",
        title: "Error closing trade",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format functions
  const formatProfitLoss = (value?: number) => {
    if (value === undefined || value === null) return "+$0.00";
    
    // Giá trị đã được chuẩn hóa, không cần sửa đổi
    let formattedValue = value;
    
    return formattedValue >= 0 ? `+${formatCurrency(formattedValue)}` : formatCurrency(formattedValue);
  };

  const formatPips = (pips?: number) => {
    if (pips === undefined || pips === null) return "+0.0";
    
    // Giá trị đã được chuẩn hóa, không cần sửa đổi
    let formattedPips = pips;
    
    return formattedPips >= 0 ? `+${formattedPips.toFixed(1)}` : formattedPips.toFixed(1);
  };

  // Get header class based on trade direction
  const headerBgClass = trade.direction === "BUY" 
    ? "from-success/5 to-success/0 border-success/20" 
    : "from-destructive/5 to-destructive/0 border-destructive/20";

  // Get preview result class
  const getPreviewResultClass = () => {
    if (!previewResult) return "border-border/30 bg-muted/20";
    
    if (previewResult.profitLoss > 0) {
      return "border-success/30 bg-success/5";
    } else if (previewResult.profitLoss < 0) {
      return "border-destructive/30 bg-destructive/5";
    } else {
      return "border-warning/30 bg-warning/5";
    }
  };

  return (
    <DialogWithContext isOpen={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent 
        className="px-0 py-0 gap-0 overflow-hidden sm:max-w-[450px] rounded-lg safe-area-p"
        aria-describedby="close-trade-form-description"
      >
        {/* Dialog Header */}
        <DialogHeader className={cn(
          "px-4 py-3 bg-gradient-to-r border-b gap-1",
          headerBgClass
        )}>
          <DialogTitle className="text-base font-medium flex items-center">
            <Icons.ui.unlock className="mr-2 h-4 w-4 text-primary/80" />
            Close {trade.pair} Trade
          </DialogTitle>
          <DialogDescription id="close-trade-form-description" className="text-xs opacity-90">
            {`${trade.direction} • ${formatPrice(trade.entryPrice!, trade.pair as CurrencyPair)} • ${trade.lotSize} lot`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 h-10 rounded-none border-b bg-muted/30">
              <TabsTrigger value="main" className="rounded-none">
                <Icons.general.target className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Close Position</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="rounded-none">
                <Icons.general.image className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Charts</span>
              </TabsTrigger>
              <TabsTrigger value="note" className="rounded-none">
                <Icons.ui.info className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Notes</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Main - Select result and exit price */}
            <TabsContent value="main" className="p-0 m-0">
              <div className="px-4 py-3 space-y-3">
                {/* Result states - TP/SL/BE/Manual */}
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">Select trade result</div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Take Profit */}
                    <div
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer border",
                        watchedResult === "TP" 
                          ? "bg-success/10 border-success/50" 
                          : "bg-background border-border hover:bg-success/5"
                      )}
                      onClick={() => handleResultChange("TP")}
                      title={trade.takeProfit ? `Take Profit (${trade.takeProfit})` : "Take Profit"}
                    >
                      <TradeStatusBadge 
                        status="TP" 
                        size="sm" 
                        className="mr-2"
                        showTooltip={false} 
                      />
                      <div className="flex-1 text-xs font-medium">Take Profit</div>
                    </div>

                    {/* Stop Loss */}
                    <div
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer border",
                        watchedResult === "SL" 
                          ? "bg-destructive/10 border-destructive/50" 
                          : "bg-background border-border hover:bg-destructive/5"
                      )}
                      onClick={() => handleResultChange("SL")}
                      title={trade.stopLoss ? `Stop Loss (${trade.stopLoss})` : "Stop Loss"}
                    >
                      <TradeStatusBadge 
                        status="SL" 
                        size="sm" 
                        className="mr-2"
                        showTooltip={false} 
                      />
                      <div className="flex-1 text-xs font-medium">Stop Loss</div>
                    </div>

                    {/* Break Even */}
                    <div
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer border",
                        watchedResult === "BE" 
                          ? "bg-warning/10 border-warning/50" 
                          : "bg-background border-border hover:bg-warning/5"
                      )}
                      onClick={() => handleResultChange("BE")}
                      title={trade.entryPrice ? `Break Even (${trade.entryPrice})` : "Break Even"}
                    >
                      <TradeStatusBadge 
                        status="BE" 
                        size="sm" 
                        className="mr-2"
                        showTooltip={false} 
                      />
                      <div className="flex-1 text-xs font-medium">Break Even</div>
                    </div>

                    {/* Manual */}
                    <div
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer border",
                        watchedResult === "MANUAL" 
                          ? "bg-primary/10 border-primary/50" 
                          : "bg-background border-border hover:bg-primary/5"
                      )}
                      onClick={() => handleResultChange("MANUAL")}
                      title="Enter exit price manually"
                    >
                      <TradeStatusBadge 
                        status="MANUAL" 
                        size="sm" 
                        className="mr-2"
                        showTooltip={false} 
                      />
                      <div className="flex-1 text-xs font-medium">Manual Price</div>
                    </div>
                  </div>
                </div>

                {/* Exit price input */}
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">
                    {watchedResult === "MANUAL" ? "Enter exit price" : "Selected exit price"}
                  </div>
                  <div className="relative">
                    <Input
                      {...register("exitPrice")}
                      placeholder="Enter exit price..."
                      readOnly={watchedResult !== "MANUAL"}
                      className={cn(
                        "pr-16 bg-transparent",
                        watchedResult !== "MANUAL" ? "bg-muted/30" : "",
                        previewResult && previewResult.profitLoss > 0 ? "border-success/50" : "",
                        previewResult && previewResult.profitLoss < 0 ? "border-destructive/50" : "",
                        previewResult && previewResult.profitLoss === 0 ? "border-warning/50" : ""
                      )}
                    />
                    {previewResult && (
                      <div className={cn(
                        "absolute right-3 top-0 bottom-0 flex items-center font-medium text-sm",
                        previewResult.profitLoss > 0 ? "text-success" : "",
                        previewResult.profitLoss < 0 ? "text-destructive" : "",
                        previewResult.profitLoss === 0 ? "text-warning" : ""
                      )}>
                        {formatPips(previewResult.pips)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview results */}
                <div className={cn(
                  "rounded-md p-3 border",
                  getPreviewResultClass()
                )}>
                  {previewResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-1.5">
                          {previewResult.profitLoss > 0 ? (
                            <Icons.trade.profit className="w-4 h-4 text-success" />
                          ) : previewResult.profitLoss < 0 ? (
                            <Icons.trade.loss className="w-4 h-4 text-destructive" />
                          ) : (
                            <Icons.ui.circleDot className="w-4 h-4 text-warning" />
                          )}
                          <span className="text-sm font-medium">
                            {previewResult.profitLoss > 0 ? "Profit" : 
                            previewResult.profitLoss < 0 ? "Loss" : 
                            "Break Even"}
                          </span>
                        </div>
                        <TradeStatusBadge 
                          status={watchedResult as TradeStatus} 
                          size="sm" 
                          showTooltip={false}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background/80 p-2 rounded">
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Icons.ui.dollarSign className="w-3 h-3 mr-1" />
                            PNL
                          </div>
                          <div className={cn(
                            "text-base font-medium",
                            previewResult.profitLoss > 0 ? "text-success" : "",
                            previewResult.profitLoss < 0 ? "text-destructive" : "",
                            previewResult.profitLoss === 0 ? "text-warning" : ""
                          )}>
                            {formatProfitLoss(previewResult.profitLoss)}
                          </div>
                        </div>

                        <div className="bg-background/80 p-2 rounded">
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Icons.analytics.trending className="w-3 h-3 mr-1" /> 
                            Pips
                          </div>
                          <div className={cn(
                            "text-base font-medium",
                            previewResult.profitLoss > 0 ? "text-success" : "",
                            previewResult.profitLoss < 0 ? "text-destructive" : "",
                            previewResult.profitLoss === 0 ? "text-warning" : ""
                          )}>
                            {formatPips(previewResult.pips)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-2 text-muted-foreground">
                      <Icons.ui.info className="h-9 w-9 mb-1 opacity-20" />
                      <span className="text-xs">
                        Select or enter an exit price to preview results
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Images - Add chart images */}
            <TabsContent value="images" className="p-0 m-0">
              <div className="px-4 py-3 space-y-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Add chart images when closing trade (optional)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* H4 Timeframe */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">H4 Timeframe</div>
                    {exitImagePreview ? (
                      <div className="relative aspect-video rounded-md overflow-hidden border border-border group">
                        <img 
                          src={exitImagePreview} 
                          alt="Exit chart H4" 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setExitImagePreview(null);
                            setExitImage(null);
                          }}
                          className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icons.ui.close className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="exitImage"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setExitImage(file);
                              setValue("exitImage", file);
                              const url = URL.createObjectURL(file);
                              setExitImagePreview(url);
                            }
                          }}
                        />
                        <label
                          htmlFor="exitImage"
                          className="flex flex-col items-center justify-center aspect-video cursor-pointer rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40"
                        >
                          <Icons.ui.simpleUpload className="h-5 w-5 mb-1 text-muted-foreground/70" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* M15 Timeframe */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">M15 Timeframe</div>
                    {exitImageM15Preview ? (
                      <div className="relative aspect-video rounded-md overflow-hidden border border-border group">
                        <img 
                          src={exitImageM15Preview} 
                          alt="Exit chart M15" 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setExitImageM15Preview(null);
                            setExitImageM15(null);
                          }}
                          className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icons.ui.close className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="exitImageM15"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setExitImageM15(file);
                              setValue("exitImageM15", file);
                              const url = URL.createObjectURL(file);
                              setExitImageM15Preview(url);
                            }
                          }}
                        />
                        <label
                          htmlFor="exitImageM15"
                          className="flex flex-col items-center justify-center aspect-video cursor-pointer rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40"
                        >
                          <Icons.ui.simpleUpload className="h-5 w-5 mb-1 text-muted-foreground/70" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Note - Add trade notes */}
            <TabsContent value="note" className="p-0 m-0">
              <div className="px-4 py-3 space-y-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Add notes about trade result and lessons learned
                </div>
                <textarea
                  {...register("closingNote")}
                  className="w-full min-h-[150px] p-3 text-sm rounded-md border border-border bg-transparent"
                  placeholder="Enter notes about results, strengths/weaknesses, lessons learned..."
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Dialog Footer */}
          <DialogFooter className="px-4 py-3 border-t">
            <div className="flex w-full gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting || isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading || !watchedExitPrice}
                className="flex-1 gap-1"
                variant={previewResult?.profitLoss && previewResult.profitLoss > 0 ? "default" : "destructive"}
              >
                {isSubmitting || isUploading ? (
                  <Icons.ui.spinner className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.ui.lock className="h-4 w-4" />
                )}
                {isSubmitting 
                  ? "Processing..." 
                  : isUploading 
                    ? "Uploading..." 
                    : "Close Trade"
                }
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogWithContext>
  );
}