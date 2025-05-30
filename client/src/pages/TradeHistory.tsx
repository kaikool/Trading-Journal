import { useState, useEffect, useCallback, useRef } from "react";
import { CurrencyPair, Direction, TradeResult } from "@/lib/forex-calculator";
import { TradeFilterOptions, Trade } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTradeList } from "@/hooks/use-trade-list";
import { cn } from "@/lib/utils";
import { useUserDataQuery } from "@/hooks/use-user-data-query";
import { useAuth } from "@/hooks/use-auth";
import { debug, logError } from "@/lib/debug";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";
import { useQueryClient } from "@tanstack/react-query";


import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import HistoryCard from "@/components/trades/History/HistoryCard";
import { FilterTags } from "@/components/trades/History/FilterTags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Icons } from "@/components/icons/icons";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


import { Badge } from "@/components/ui/badge";
// Removed pagination imports

export default function TradeHistory() {
  const [, setLocation] = useLocation(); // Sử dụng dấu phẩy để bỏ biến đầu tiên không sử dụng
  const { toast } = useToast();
  const { userData } = useUserDataQuery();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TradeFilterOptions>({});
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "profit" | "loss">("newest");
  const [showFilters, setShowFilters] = useState(false);
  // State để theo dõi các giao dịch đang được xóa - cải thiện trải nghiệm người dùng
  const [deletingTradeIds, setDeletingTradeIds] = useState<string[]>([]);
  // State cho dialog xác nhận xóa
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State để buộc cập nhật UI khi có thay đổi
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Thêm state để tracking các discipline flags
  const [hasEnteredEarly, setHasEnteredEarly] = useState<boolean | undefined>(undefined);
  const [hasRevenge, setHasRevenge] = useState<boolean | undefined>(undefined);
  const [hasMovedSL, setHasMovedSL] = useState<boolean | undefined>(undefined);
  const [hasOverLeveraged, setHasOverLeveraged] = useState<boolean | undefined>(undefined);
  
  // Tham chiếu cho filter card và tổng số trades
  const filterCardRef = useRef<HTMLDivElement>(null);
  const totalTradesCountRef = useRef<number | null>(null);

  // Sử dụng hook để lấy toàn bộ giao dịch đã được sắp xếp
  const {
    data,
    isLoading,
    sortBy: hookSortBy,
    setSortBy: hookSetSortBy
  } = useTradeList({
    initialFilters: filters, // Filters được truyền trực tiếp vào hook
    initialSortBy: sortBy,
    enableRealtime: true
  });
  
  // Lấy danh sách giao dịch từ data
  const trades = data?.trades || [];
  
  // Tham chiếu để theo dõi thời gian của lần cập nhật cuối
  const lastTradesUpdateRef = useRef<number>(0);
  
  // Đăng ký observer để theo dõi thay đổi giao dịch (thêm, sửa, xóa) - sử dụng cơ chế tương tự dashboard
  useEffect(() => {
    if (!userId) return;
    
    debug("[TradeHistory] Registering optimized observer with TradeUpdateService");
    
    // Tạo observer để theo dõi thay đổi giao dịch theo cơ chế tối ưu của dashboard
    const observer: TradeChangeObserver = {
      onTradesChanged: (action, tradeId) => {
        // Tối ưu: Sử dụng ref để tránh cập nhật liên tục và chỉ theo dõi cập nhật mới nhất
        const now = Date.now();
        lastTradesUpdateRef.current = now;
        
        debug(`[REALTIME-DEBUG][TradeHistory] Trade changed (${action}), tradeId: ${tradeId || 'unknown'}, refreshing data...`);
        
        // Cải thiện cơ chế cập nhật: thêm độ trễ ngắn để đảm bảo xử lý theo trình tự
        setTimeout(() => {
          // Kiểm tra nếu đây là yêu cầu cập nhật mới nhất
          if (lastTradesUpdateRef.current !== now) {
            debug(`[REALTIME-DEBUG][TradeHistory] Skipping outdated update request for ${action}`);
            return;
          }
          
          debug(`[REALTIME-DEBUG][TradeHistory] Executing immediate cache invalidation for action: ${action}`);
          
          // Vô hiệu hóa cache để lấy dữ liệu mới nhất
          queryClient.invalidateQueries({ 
            queryKey: ['trades', userId],
            refetchType: 'active'
          });
          
          // Tối ưu: Tăng update trigger để kích hoạt cập nhật UI
          setUpdateTrigger(prev => prev + 1);
          
          // Thực hiện lần refetch thứ hai sau khoảng thời gian ngắn để đảm bảo dữ liệu đã được cập nhật
          setTimeout(() => {
            debug(`[REALTIME-DEBUG][TradeHistory] Executing secondary data refresh for action: ${action}`);
            hookSetSortBy(hookSortBy); // Kích hoạt refetch bằng cách giả lập thay đổi bộ lọc
          }, 150); // Giảm thời gian trễ xuống để cập nhật nhanh hơn
        }, 50);
      }
    };
    
    // Đăng ký observer với service
    debug(`[TradeHistory] Registering observer for trade updates for user ${userId}`);
    const unregister = tradeUpdateService.registerObserver(observer);
    
    // Hủy đăng ký khi component unmount
    return () => {
      debug(`[TradeHistory] Unregistering observer for trade updates`);
      unregister();
    };
  }, [userId, queryClient, setUpdateTrigger, hookSetSortBy, hookSortBy]);
  
  // Đồng bộ hóa trạng thái sắp xếp của hook với local state
  // Sử dụng initialSync để đảm bảo chỉ sync một chiều: từ component đến hook
  const initialSyncDone = useRef(false);
  
  // Chỉ đồng bộ từ component sortBy đến hook, không đồng bộ ngược lại
  useEffect(() => {
    // Nếu chưa thực hiện đồng bộ ban đầu thì bỏ qua để tránh reset giá trị mặc định
    if (!initialSyncDone.current) {
      initialSyncDone.current = true;
      return;
    }
    
    // Chỉ đồng bộ khi có thay đổi thực sự để tránh vòng lặp vô hạn
    if (sortBy !== hookSortBy) {
      debug(`Syncing sort order from component to hook: ${sortBy}`);
      hookSetSortBy(sortBy);
    }
  }, [sortBy, hookSortBy, hookSetSortBy]);
  
  // Cải thiện logging và cập nhật tổng số trades
  // Sử dụng 1 effect thay vì nhiều effect để tránh render nhiều lần
  const prevFiltersRef = useRef<typeof filters>({});
  const prevSortByRef = useRef<typeof sortBy>(sortBy);
  const prevTradesLengthRef = useRef<number>(0);
  
  useEffect(() => {
    // Giảm thiểu số lượng log - chỉ log khi có thay đổi thực sự
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    const sortByChanged = sortBy !== prevSortByRef.current;
    const tradesLengthChanged = trades.length !== prevTradesLengthRef.current;
    
    // Cập nhật ref để so sánh lần sau
    prevFiltersRef.current = {...filters};
    prevSortByRef.current = sortBy;
    prevTradesLengthRef.current = trades.length;
    
    // Debug thêm khi có trigger cập nhật từ observer
    if (updateTrigger > 0) {
      debug(`[TradeHistory] Refreshing UI due to updateTrigger: ${updateTrigger}`);
    }
    
    // Ghi log có điều kiện
    if (filtersChanged) {
      debug("TradeHistory filters changed:", filters);
    }
    
    if (sortByChanged) {
      debug("TradeHistory sortBy changed:", sortBy);
    }
    
    if (tradesLengthChanged || filtersChanged) {
      debug("Filtered trades count:", trades.length);
    }
    
    // Chỉ cập nhật tổng số trades khi không có filter nào được áp dụng
    if (Object.keys(filters).length === 0 && tradesLengthChanged) {
      totalTradesCountRef.current = trades.length;
    }
  }, [trades, filters, sortBy]);

  const clearFilters = () => {
    setFilters({});
    setHasEnteredEarly(undefined);
    setHasRevenge(undefined);
    setHasMovedSL(undefined);
    setHasOverLeveraged(undefined);
  };

  // Handle filter removal
  const handleRemoveFilter = (type: string, value?: string) => {
    switch (type) {
      case 'date':
        setFilters({...filters, startDate: undefined, endDate: undefined});
        break;
      case 'pair':
        if (filters.pair && value) {
          const newPairs = [...filters.pair];
          const index = newPairs.indexOf(value as CurrencyPair);
          if (index !== -1) newPairs.splice(index, 1);
          setFilters({...filters, pair: newPairs.length ? newPairs : undefined});
        }
        break;
      case 'direction':
        if (filters.direction && value) {
          const newDirections = [...filters.direction];
          const index = newDirections.indexOf(value as Direction);
          if (index !== -1) newDirections.splice(index, 1);
          setFilters({...filters, direction: newDirections.length ? newDirections : undefined});
        }
        break;
      case 'result':
        if (filters.result && value) {
          const newResults = [...filters.result];
          const index = newResults.indexOf(value as TradeResult);
          if (index !== -1) newResults.splice(index, 1);
          setFilters({...filters, result: newResults.length ? newResults : undefined});
        }
        break;
      case 'strategy':
        if (filters.strategy && value) {
          const newStrategies = [...filters.strategy];
          const index = newStrategies.indexOf(value);
          if (index !== -1) newStrategies.splice(index, 1);
          setFilters({...filters, strategy: newStrategies.length ? newStrategies : undefined});
        }
        break;
      case 'emotion':
        if (filters.emotion && value) {
          const newEmotions = [...filters.emotion];
          const index = newEmotions.indexOf(value);
          if (index !== -1) newEmotions.splice(index, 1);
          setFilters({...filters, emotion: newEmotions.length ? newEmotions : undefined});
        }
        break;
      case 'followedPlan':
        const { hasFollowedPlan, ...restFollowed } = filters;
        setFilters(restFollowed);
        break;
      case 'sessionType':
        if (filters.sessionType && value) {
          const newSessions = [...filters.sessionType];
          const index = newSessions.indexOf(value);
          if (index !== -1) newSessions.splice(index, 1);
          setFilters({...filters, sessionType: newSessions.length ? newSessions : undefined});
        }
        break;
      case 'news':
        const { hasNews, ...restNews } = filters;
        setFilters(restNews);
        break;
      case 'enteredEarly':
        const { hasEnteredEarly, ...restEarly } = filters;
        setFilters(restEarly);
        setHasEnteredEarly(undefined);
        break;
      case 'movedSL':
        const { hasMovedSL, ...restMoved } = filters;
        setFilters(restMoved);
        setHasMovedSL(undefined);
        break;
      case 'overLeveraged':
        const { hasOverLeveraged, ...restLeveraged } = filters;
        setFilters(restLeveraged);
        setHasOverLeveraged(undefined);
        break;
      case 'revenge':
        const { hasRevenge, ...restRevenge } = filters;
        setFilters(restRevenge);
        setHasRevenge(undefined);
        break;
    }
  };

  // Sử dụng dữ liệu động cho các filter options
  const [pairOptions, setPairOptions] = useState<CurrencyPair[]>([]);
  const [strategyOptions, setStrategyOptions] = useState<string[]>([]);
  const [emotionOptions, setEmotionOptions] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  
  // Cập nhật các tùy chọn lọc động từ dữ liệu với cơ chế chống lặp vô hạn
  // Sử dụng biến ref để theo dõi trades đã xử lý tránh các render không cần thiết
  const processedTradesRef = useRef<string>("");
  
  useEffect(() => {
    if (!trades || trades.length === 0) return;
    
    // Tạo một chuỗi độc đáo đại diện cho bộ trades hiện tại
    // Chỉ xử lý khi trades thay đổi thực sự
    const tradesSignature = trades.map(t => t.id).sort().join('|');
    
    // Nếu chuỗi giống với lần xử lý trước đó, bỏ qua để tránh vòng lặp
    if (tradesSignature === processedTradesRef.current) {
      return;
    }
    
    // Cập nhật chuỗi đã xử lý
    processedTradesRef.current = tradesSignature;
    
    // Sử dụng Set để loại bỏ các giá trị trùng lặp
    const uniquePairs = new Set<CurrencyPair>();
    const uniqueStrategies = new Set<string>();
    const uniqueEmotions = new Set<string>();
    const uniqueSessions = new Set<string>();
    
    // Lặp qua mỗi trade để thu thập giá trị duy nhất
    trades.forEach((trade: Trade) => {
      // Đảm bảo chỉ thêm giá trị hợp lệ
      if (trade.pair) uniquePairs.add(String(trade.pair).toUpperCase() as CurrencyPair);
      if (trade.strategy) uniqueStrategies.add(trade.strategy);
      if (trade.emotion) uniqueEmotions.add(trade.emotion);
      if (trade.sessionType) uniqueSessions.add(trade.sessionType);
    });
    
    // Chuyển đổi Set thành Array
    const newPairs = Array.from(uniquePairs);
    const newStrategies = Array.from(uniqueStrategies);
    const newEmotions = Array.from(uniqueEmotions);
    const newSessions = Array.from(uniqueSessions);
    
    // Cập nhật state cho tất cả các tùy chọn một lần duy nhất
    setPairOptions(newPairs);
    setStrategyOptions(newStrategies); 
    setEmotionOptions(newEmotions);
    setSessionOptions(newSessions);
    
    debug("Dynamic filter options updated:", {
      pairs: newPairs,
      strategies: newStrategies,
      emotions: newEmotions,
      sessions: newSessions
    });
  }, [trades]); // Chỉ phụ thuộc vào trades để tránh vòng lặp không cần thiết

  // Hàm trợ giúp để cập nhật filter một cách nhất quán
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters, [key]: value };
      debug(`Updated ${key} filter:`, JSON.stringify(updatedFilters));
      return updatedFilters;
    });
  }, []);

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.pair && filters.pair.length > 0) count++;
    if (filters.direction && filters.direction.length > 0) count++;
    if (filters.result && filters.result.length > 0) count++;
    if (filters.strategy && filters.strategy.length > 0) count++;
    if (filters.emotion && filters.emotion.length > 0) count++;
    if (filters.hasFollowedPlan !== undefined) count++;
    if (filters.sessionType && filters.sessionType.length > 0) count++;
    if (filters.hasNews !== undefined) count++;
    if (filters.hasEnteredEarly !== undefined) count++;
    if (filters.hasMovedSL !== undefined) count++;
    if (filters.hasOverLeveraged !== undefined) count++;
    if (filters.hasRevenge !== undefined) count++;
    return count;
  };

  return (
    <div className="px-0 sm:px-6 lg:px-8 w-full">
      {/* Header đã được tối ưu cho mobile - loại bỏ px-4 vì đã có padding từ MobileLayout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Trade History</h1>
          <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
            Review and analyze your past trading activities
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex flex-wrap gap-1.5">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icons.general.filter className="h-4 w-4 mr-2" />
            Filters
            {countActiveFilters() > 0 && (
              <Badge className="ml-2" variant="secondary">
                {countActiveFilters()}
              </Badge>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Icons.ui.chevronsUpDown className="h-4 w-4 mr-2" />
                Sort: {sortBy === "newest" && "Newest first"}
                {sortBy === "oldest" && "Oldest first"}
                {sortBy === "profit" && "Highest profit"}
                {sortBy === "loss" && "Highest loss"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === "newest"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    debug("Setting sort to newest");
                    setSortBy("newest");
                  }
                }}
              >
                Newest first
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "oldest"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    debug("Setting sort to oldest");
                    setSortBy("oldest");
                  }
                }}
              >
                Oldest first
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "profit"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    debug("Setting sort to profit");
                    setSortBy("profit");
                  }
                }}
              >
                Highest profit
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "loss"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    debug("Setting sort to loss");
                    setSortBy("loss");
                  }
                }}
              >
                Highest loss
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6" ref={filterCardRef}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Icons.ui.slidersHorizontal className="h-5 w-5 mr-2" />
                Filter Trades
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                disabled={countActiveFilters() === 0}
              >
                <Icons.ui.close className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </div>
          </CardHeader>
          
          {/* Active Filter Tags */}
          {countActiveFilters() > 0 && (
            <div className="px-6 pb-2">
              <FilterTags filters={filters} onRemoveFilter={handleRemoveFilter} />
            </div>
          )}
          
          <CardContent className="pt-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="basic">Basic Filters</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Date Range
                    </label>
                    <DateRangePicker
                      from={filters.startDate}
                      to={filters.endDate}
                      onFromChange={(date) => updateFilter('startDate', date)}
                      onToChange={(date) => updateFilter('endDate', date)}
                    />
                  </div>
                  
                  {/* Currency Pairs */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Currency Pairs
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.pair?.length 
                            ? `${filters.pair.length} selected`
                            : "Select pairs"}
                          <Icons.ui.chevronsUpDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto">
                        {pairOptions.map((pair) => (
                          <DropdownMenuCheckboxItem
                            key={pair}
                            checked={filters.pair?.includes(pair)}
                            onCheckedChange={(checked) => {
                              const newPairs = [...(filters.pair || [])];
                              if (checked) {
                                newPairs.push(pair);
                              } else {
                                const index = newPairs.indexOf(pair);
                                if (index !== -1) newPairs.splice(index, 1);
                              }
                              updateFilter('pair', newPairs.length ? newPairs : undefined);
                            }}
                          >
                            {pair}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Direction */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Direction
                    </label>
                    <div className="flex gap-1">
                      <Button
                        variant={filters.direction?.includes("BUY") ? "default" : "outline"}
                        className={cn("flex-1", filters.direction?.includes("BUY") ? "" : "border-dashed")}
                        onClick={() => {
                          const newDirections = [...(filters.direction || [])];
                          const buyIndex = newDirections.indexOf("BUY");
                          
                          if (buyIndex === -1) {
                            newDirections.push("BUY");
                          } else {
                            newDirections.splice(buyIndex, 1);
                          }
                          
                          debug("Setting BUY direction filter:", newDirections);
                          // Sử dụng hàm updateFilter thay vì setFilters trực tiếp
                          updateFilter('direction', newDirections.length ? newDirections : undefined);
                        }}
                        size="sm"
                      >
                        <Icons.ui.arrowUp className="h-4 w-4 mr-1 text-green-500" />
                        Buy
                      </Button>
                      
                      <Button
                        variant={filters.direction?.includes("SELL") ? "default" : "outline"}
                        className={cn("flex-1", filters.direction?.includes("SELL") ? "" : "border-dashed")}
                        onClick={() => {
                          const newDirections = [...(filters.direction || [])];
                          const sellIndex = newDirections.indexOf("SELL");
                          
                          if (sellIndex === -1) {
                            newDirections.push("SELL");
                          } else {
                            newDirections.splice(sellIndex, 1);
                          }
                          
                          updateFilter('direction', newDirections.length ? newDirections : undefined);
                        }}
                        size="sm"
                      >
                        <Icons.ui.arrowDown className="h-4 w-4 mr-1 text-red-500" />
                        Sell
                      </Button>
                    </div>
                  </div>
                  
                  {/* Result */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Result
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant={filters.result?.includes("TP") ? "default" : "outline"}
                        className={cn("text-xs h-9", filters.result?.includes("TP") ? "" : "border-dashed")}
                        onClick={() => {
                          const newResults = [...(filters.result || [])];
                          const index = newResults.indexOf("TP");
                          
                          if (index === -1) {
                            newResults.push("TP");
                          } else {
                            newResults.splice(index, 1);
                          }
                          
                          updateFilter('result', newResults.length ? newResults : undefined);
                        }}
                      >
                        <Icons.ui.circleCheck className="h-4 w-4 mr-1 text-green-500" />
                        Take Profit
                      </Button>
                      
                      <Button
                        variant={filters.result?.includes("SL") ? "default" : "outline"}
                        className={cn("text-xs h-9", filters.result?.includes("SL") ? "" : "border-dashed")}
                        onClick={() => {
                          const newResults = [...(filters.result || [])];
                          const index = newResults.indexOf("SL");
                          
                          if (index === -1) {
                            newResults.push("SL");
                          } else {
                            newResults.splice(index, 1);
                          }
                          
                          updateFilter('result', newResults.length ? newResults : undefined);
                        }}
                      >
                        <Icons.ui.circleX className="h-4 w-4 mr-1 text-red-500" />
                        Stop Loss
                      </Button>
                      
                      <Button
                        variant={filters.result?.includes("BE") ? "default" : "outline"}
                        className={cn("text-xs h-9", filters.result?.includes("BE") ? "" : "border-dashed")}
                        onClick={() => {
                          const newResults = [...(filters.result || [])];
                          const index = newResults.indexOf("BE");
                          
                          if (index === -1) {
                            newResults.push("BE");
                          } else {
                            newResults.splice(index, 1);
                          }
                          
                          updateFilter('result', newResults.length ? newResults : undefined);
                        }}
                      >
                        <Icons.ui.circleDashed className="h-4 w-4 mr-1 text-orange-500" />
                        Break Even
                      </Button>
                      
                      <Button
                        variant={filters.result?.includes("MANUAL") ? "default" : "outline"}
                        className={cn("text-xs h-9", filters.result?.includes("MANUAL") ? "" : "border-dashed")}
                        onClick={() => {
                          const newResults = [...(filters.result || [])];
                          const index = newResults.indexOf("MANUAL");
                          
                          if (index === -1) {
                            newResults.push("MANUAL");
                          } else {
                            newResults.splice(index, 1);
                          }
                          
                          updateFilter('result', newResults.length ? newResults : undefined);
                        }}
                      >
                        <Icons.ui.circleDot className="h-4 w-4 mr-1 text-blue-500" />
                        Manual
                      </Button>
                    </div>
                  </div>
                  
                  {/* Strategy */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Trading Strategy
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.strategy?.length 
                            ? `${filters.strategy.length} selected`
                            : "Select strategies"}
                          <Icons.ui.chevronsUpDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px] max-h-[200px] overflow-y-auto">
                        {strategyOptions.map((strategy) => (
                          <DropdownMenuCheckboxItem
                            key={strategy}
                            checked={filters.strategy?.includes(strategy)}
                            onCheckedChange={(checked) => {
                              const newStrategies = [...(filters.strategy || [])];
                              if (checked) {
                                newStrategies.push(strategy);
                              } else {
                                const index = newStrategies.indexOf(strategy);
                                if (index !== -1) newStrategies.splice(index, 1);
                              }
                              updateFilter('strategy', newStrategies.length ? newStrategies : undefined);
                            }}
                          >
                            {strategy}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Followed Plan */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Followed Trading Plan
                    </label>
                    <div className="flex gap-1">
                      <Button
                        variant={filters.hasFollowedPlan === true ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          updateFilter('hasFollowedPlan', filters.hasFollowedPlan === true ? undefined : true);
                        }}
                        size="sm"
                      >
                        <Icons.ui.check className="h-4 w-4 mr-1 text-green-500" />
                        Yes
                      </Button>
                      <Button
                        variant={filters.hasFollowedPlan === false ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          updateFilter('hasFollowedPlan', filters.hasFollowedPlan === false ? undefined : false);
                        }}
                        size="sm"
                      >
                        <Icons.ui.close className="h-4 w-4 mr-1 text-red-500" />
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Emotional State */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Emotional State
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.emotion?.length 
                            ? `${filters.emotion.length} selected`
                            : "Select emotions"}
                          <Icons.ui.chevronsUpDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px] max-h-[200px] overflow-y-auto">
                        {emotionOptions.map((emotion) => (
                          <DropdownMenuCheckboxItem
                            key={emotion}
                            checked={filters.emotion?.includes(emotion)}
                            onCheckedChange={(checked) => {
                              const newEmotions = [...(filters.emotion || [])];
                              if (checked) {
                                newEmotions.push(emotion);
                              } else {
                                const index = newEmotions.indexOf(emotion);
                                if (index !== -1) newEmotions.splice(index, 1);
                              }
                              updateFilter('emotion', newEmotions.length ? newEmotions : undefined);
                            }}
                          >
                            {emotion}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Market Session */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Market Session
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.sessionType?.length 
                            ? `${filters.sessionType.length} selected`
                            : "Select sessions"}
                          <Icons.ui.chevronsUpDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px] max-h-[200px] overflow-y-auto">
                        {sessionOptions.map((session) => (
                          <DropdownMenuCheckboxItem
                            key={session}
                            checked={filters.sessionType?.includes(session)}
                            onCheckedChange={(checked) => {
                              const newSessions = [...(filters.sessionType || [])];
                              if (checked) {
                                newSessions.push(session);
                              } else {
                                const index = newSessions.indexOf(session);
                                if (index !== -1) newSessions.splice(index, 1);
                              }
                              updateFilter('sessionType', newSessions.length ? newSessions : undefined);
                            }}
                          >
                            {session}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* News Impact */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      News Impact
                    </label>
                    <div className="flex gap-1">
                      <Button
                        variant={filters.hasNews === true ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          updateFilter('hasNews', filters.hasNews === true ? undefined : true);
                        }}
                        size="sm"
                      >
                        <Icons.general.newspaper className="h-4 w-4 mr-1" />
                        Has News
                      </Button>
                      <Button
                        variant={filters.hasNews === false ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => {
                          updateFilter('hasNews', filters.hasNews === false ? undefined : false);
                        }}
                        size="sm"
                      >
                        <Icons.general.fileX className="h-4 w-4 mr-1" />
                        No News
                      </Button>
                    </div>
                  </div>
                  
                  {/* Discipline Flags */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Discipline Issues
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant={hasEnteredEarly ? "default" : "outline"}
                        className={cn("text-xs h-9", hasEnteredEarly ? "" : "border-dashed")}
                        onClick={() => {
                          const newValue = !hasEnteredEarly;
                          setHasEnteredEarly(newValue ? true : undefined);
                          updateFilter('hasEnteredEarly', newValue ? true : undefined);
                        }}
                      >
                        <Icons.general.timerOff className="h-4 w-4 mr-1" />
                        Entered Early
                      </Button>
                      
                      <Button
                        variant={hasRevenge ? "default" : "outline"}
                        className={cn("text-xs h-9", hasRevenge ? "" : "border-dashed")}
                        onClick={() => {
                          const newValue = !hasRevenge;
                          setHasRevenge(newValue ? true : undefined);
                          updateFilter('hasRevenge', newValue ? true : undefined);
                        }}
                      >
                        <Icons.general.repeat className="h-4 w-4 mr-1" />
                        Revenge Trading
                      </Button>
                      
                      <Button
                        variant={hasMovedSL ? "default" : "outline"}
                        className={cn("text-xs h-9", hasMovedSL ? "" : "border-dashed")}
                        onClick={() => {
                          const newValue = !hasMovedSL;
                          setHasMovedSL(newValue ? true : undefined);
                          updateFilter('hasMovedSL', newValue ? true : undefined);
                        }}
                      >
                        <Icons.general.moveRight className="h-4 w-4 mr-1" />
                        Moved Stop Loss
                      </Button>
                      
                      <Button
                        variant={hasOverLeveraged ? "default" : "outline"}
                        className={cn("text-xs h-9", hasOverLeveraged ? "" : "border-dashed")}
                        onClick={() => {
                          const newValue = !hasOverLeveraged;
                          setHasOverLeveraged(newValue ? true : undefined);
                          updateFilter('hasOverLeveraged', newValue ? true : undefined);
                        }}
                      >
                        <Icons.ui.alertTriangle className="h-4 w-4 mr-1" />
                        Over Leveraged
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing: <span className="font-medium">{trades.length}</span>
                {totalTradesCountRef.current ? 
                  <> / <span className="font-medium">{totalTradesCountRef.current}</span> trades</> 
                  : ' trades'}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({});
                    setHasEnteredEarly(undefined);
                    setHasRevenge(undefined);
                    setHasMovedSL(undefined);
                    setHasOverLeveraged(undefined);
                    setShowFilters(false);
                  }}
                >
                  <Icons.ui.close className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setShowFilters(false);
                  }}
                >
                  <Icons.ui.check className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && trades.length === 0 && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Icons.ui.slidersHorizontal className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-medium">No trades found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {countActiveFilters() > 0 
                ? "Try adjusting your filters or add new trades" 
                : "Start adding trades to see them here"}
            </p>
            <Button onClick={() => setLocation("/trade/new")}>
              <Icons.ui.plus className="h-4 w-4 mr-2" />
              Add New Trade
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="w-full space-y-5 overflow-hidden">
        {!isLoading && trades.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full overflow-hidden">
              <AnimatePresence>
                {trades
                  .filter(trade => !deletingTradeIds.includes(trade.id))
                  .map((trade: Trade) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      className="w-full overflow-hidden"
                    >
                      <HistoryCard 
                        key={`${trade.id}-${updateTrigger}`} 
                        trade={trade} 
                        onEdit={() => setLocation(`/trade/edit/${trade.id}`)}
                        onDelete={() => {
                          setTradeToDelete(trade);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Pagination removed - displaying all trades at once */}
          </>
        ) : null}
      </div>
      
      {/* Dialog xác nhận xóa giao dịch */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="safe-area-p">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Trade Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this 
              <strong> {tradeToDelete?.pair} {tradeToDelete?.direction} </strong>
              trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (tradeToDelete) {
                  handleDeleteTradeConfirm(tradeToDelete);
                }
                setIsDeleteDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  
  // Function to handle trade deletion after confirmation
  function handleDeleteTradeConfirm(trade: Trade) {
    if (!userId || !trade) return;
    const tradeId = trade.id;
    
    // Update UI immediately before actual deletion
    setDeletingTradeIds(prev => [...prev, tradeId]);
    
    // Import thông qua dynamic import để tối ưu code-splitting
    import("@/lib/firebase").then(({ deleteTrade }) => {
      // Sử dụng deleteTrade từ firebase.ts
      // Lưu ý: deleteTrade đã được tích hợp với TradeUpdateService để thông báo UI updates
      // thông qua tradeUpdateService.notifyTradeDeleted trong firebase.ts
      deleteTrade(userId, tradeId)
        .then(() => {
          toast({
            title: "Trade deleted",
            description: "The trade has been successfully deleted"
          });
          // Không cần cập nhật UI thủ công vì TradeUpdateService đã xử lý
          // UI sẽ được cập nhật thông qua các observer đã đăng ký
        })
        .catch((error) => {
          // If deletion fails, restore UI by removing tradeId from deletingTradeIds
          setDeletingTradeIds(prev => prev.filter(id => id !== tradeId));
          
          logError("Error deleting trade:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Unable to delete the trade. Please try again later."
          });
        });
    });
  }
}