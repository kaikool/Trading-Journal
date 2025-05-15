import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { db, getTrades } from "@/lib/firebase";
import { firebaseListenerService } from "@/services/firebase-listener-service";
import { debug, logError } from "@/lib/debug";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CurrencyPair, Direction } from "@/lib/forex-calculator";
import { Trade } from "@/types";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import TradeStatusBadge from "./TradeStatusBadge";
import DirectionBadge from "./DirectionBadge";
import { determineTradeStatus } from "@/lib/trade-status-helpers";

interface RecentTradesTableProps {
  userId: string | undefined;
  isLoading?: boolean;
  limit?: number;
}

export default function RecentTradesTable({ 
  userId, 
  isLoading: initialLoading = false,
  limit: tradeLimit = 5
}: RecentTradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [_, setLocation] = useLocation();
  
  // Kết hợp giữa loading prop được truyền vào và local loading state
  const isLoading = initialLoading || localLoading;

  // Dùng ref để giảm thiểu số lần cập nhật không cần thiết
  const lastUpdateRef = useRef(0);
  
  // Hàm để tải giao dịch đã đóng gần đây
  const fetchRecentClosedTrades = async () => {
    if (!userId) return;
    
    try {
      setLocalLoading(true);
      
      // Sử dụng hàm getTrades từ firebase.ts
      const allTrades = await getTrades(userId);
      
      // Lọc ra các giao dịch đã đóng và sắp xếp theo thời gian đóng
      const closedTrades = allTrades
        .filter(trade => trade.closeDate)
        .sort((a, b) => {
          const getTimestamp = (date: any) => {
            if (typeof date === 'object' && date && 'toDate' in date) {
              return date.toDate().getTime();
            }
            return new Date(date).getTime();
          };
          
          return getTimestamp(b.closeDate) - getTimestamp(a.closeDate);
        })
        .slice(0, tradeLimit) as Trade[];
      
      debug(`RecentTradesTable: Fetched ${closedTrades.length} recent closed trades`);
      setTrades(closedTrades);
      setLocalLoading(false);
    } catch (error) {
      logError("Error fetching recent closed trades:", error);
      setLocalLoading(false);
    }
  };
  
  useEffect(() => {
    if (!userId) {
      setLocalLoading(false);
      return;
    }
    
    // Tải dữ liệu ban đầu
    fetchRecentClosedTrades();
    
    // Đăng ký observer với TradeUpdateService
    const observer: TradeChangeObserver = {
      onTradesChanged: (action, tradeId) => {
        // Sử dụng ref để debounce các cập nhật quá nhanh
        const now = Date.now();
        if (now - lastUpdateRef.current < 200) {
          debug("[RecentTradesTable] Debouncing update, too frequent");
          return;
        }
        
        lastUpdateRef.current = now;
        debug(`[RecentTradesTable] Received update notification (${action}), refreshing data`);
        
        // Chỉ tải lại dữ liệu khi có tác động đến giao dịch đã đóng
        // Đặc biệt quan tâm đến việc đóng giao dịch ('close')
        fetchRecentClosedTrades();
      }
    };
    
    // Đăng ký observer
    const unregister = tradeUpdateService.registerObserver(observer);
    
    // Vẫn duy trì Firebase listener để đồng bộ với phần còn lại của ứng dụng
    // Nhưng không sử dụng callback để tránh cập nhật dữ liệu khi không cần thiết
    const firebaseUnsubscribe = firebaseListenerService.onTradesSnapshot(
      userId,
      {
        callback: () => {
          // Không làm gì, cập nhật sẽ được xử lý qua TradeUpdateService
        },
        errorCallback: (error) => {
          logError("Error in Firebase listener:", error);
        }
      }
    );
    
    // Cleanup function - hủy đăng ký cả hai listeners
    return () => {
      unregister();
      firebaseUnsubscribe();
      debug(`[RecentTradesTable] Unsubscribed from TradeUpdateService and Firebase`);
    };
  }, [userId, tradeLimit]);

  // Đã xóa hàm getStatusBadgeStyle thừa vì đã sử dụng TradeStatusBadge

  const renderDirectionBadge = (direction: Direction) => {
    return (
      <DirectionBadge
        direction={direction}
        size="sm"
        variant="modern"
        showTooltip={false}
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent Closed Trades</CardTitle>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Lot Size</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Profit/Loss</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Closed Trades</CardTitle>
        <Button 
          variant="link" 
          className="text-sm p-0 h-auto"
          onClick={() => setLocation("/trade/history")}
        >
          View all trades
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lot Size</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Profit/Loss</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length > 0 ? (
                trades.map((trade) => (
                  <TableRow 
                    key={trade.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/trade/view/${trade.id}`)}
                  >
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>
                      {renderDirectionBadge(trade.direction as Direction)}
                    </TableCell>
                    <TableCell>{trade.lotSize}</TableCell>
                    <TableCell>{trade.entryPrice}</TableCell>
                    <TableCell>{trade.exitPrice}</TableCell>
                    <TableCell className={cn(
                      "font-medium",
                      trade.profitLoss && trade.profitLoss > 0 
                        ? "text-success" 
                        : trade.profitLoss && trade.profitLoss < 0 
                          ? "text-destructive" 
                          : ""
                    )}>
                      {trade.profitLoss ? formatCurrency(trade.profitLoss) : '-'}
                    </TableCell>
                    <TableCell>
                      <TradeStatusBadge status={determineTradeStatus(trade)} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {trade.closeDate ? formatDate(trade.closeDate.toDate()) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No closed trades found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
