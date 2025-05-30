import { useState, useEffect, useRef } from "react";
import { getTrades } from "@/lib/firebase";
import { debug, logError } from "@/lib/debug";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/utils";
import { formatCurrency, formatProfitLoss, formatPriceForPair } from "@/utils/format-number";
import { Direction } from "@/lib/forex-calculator";
import { Trade } from "@/types";
import { tradeUpdateService, TradeChangeObserver } from "@/services/trade-update-service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

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
        .filter((trade: any) => trade.closeDate)
        .sort((a: any, b: any) => {
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
    
    // Không còn sử dụng Firebase listener nữa, chỉ dùng TradeUpdateService
    
    // Cleanup function - hủy đăng ký listener từ TradeUpdateService
    return () => {
      unregister();
      debug(`[RecentTradesTable] Unsubscribed from TradeUpdateService`);
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
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Closed Trades</CardTitle>
        <Button 
          variant="link" 
          className="text-sm p-0 h-auto"
          onClick={() => setLocation("/history")}
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
                    <TableCell>{trade.entryPrice ? formatPriceForPair(trade.entryPrice, trade.pair) : '-'}</TableCell>
                    <TableCell>{trade.exitPrice ? formatPriceForPair(trade.exitPrice, trade.pair) : '-'}</TableCell>
                    <TableCell className={cn(
                      "font-medium",
                      trade.profitLoss && trade.profitLoss > 0 
                        ? "text-success" 
                        : trade.profitLoss && trade.profitLoss < 0 
                          ? "text-destructive" 
                          : ""
                    )}>
                      {trade.profitLoss ? formatProfitLoss(trade.profitLoss) : '-'}
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
