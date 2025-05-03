import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CurrencyPair, Direction } from "@/lib/forex-calculator";
import { Trade } from "@/types";

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

  useEffect(() => {
    if (!userId) {
      setLocalLoading(false);
      return;
    }
    
    try {
      // Sử dụng memoization và giới hạn truy vấn để giảm tải Firebase
      const tradesRef = collection(db, "users", userId, "trades");
      const q = query(
        tradesRef,
        where("closeDate", "!=", null),
        orderBy("closeDate", "desc"),
        limit(tradeLimit)
      );
      
      // Đặt một cache version để theo dõi phiên bản dữ liệu
      let cacheVersion = 0;
      const currentCacheVersion = cacheVersion;
      
      // Cải thiện hiệu suất với việc giảm tần suất cập nhật UI
      // Nó sẽ hạn chế hiển thị những cập nhật không cần thiết
      let debounceTimeout: NodeJS.Timeout | null = null;
      
      // Sử dụng onSnapshot với cơ chế tối ưu
      const unsubscribe = onSnapshot(
        q, 
        { includeMetadataChanges: false }, // Chỉ nhận thông báo khi có thay đổi thực sự
        (querySnapshot) => {
          // Nếu phiên bản cache đã thay đổi, không xử lý callback này
          if (currentCacheVersion !== cacheVersion) return;
          
          // Clear timeout trước đó nếu có
          if (debounceTimeout) clearTimeout(debounceTimeout);
          
          // Debounce để tránh render quá thường xuyên khi có nhiều sự kiện liên tiếp
          debounceTimeout = setTimeout(() => {
            const recentTrades = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Trade[];
            
            console.log("RecentTradesTable: Realtime update received, trades:", recentTrades.length);
            setTrades(recentTrades);
            setLocalLoading(false);
          }, 150); // Debounce 150ms
        }, 
        (error) => {
          console.error("Error listening to recent trades:", error);
          setLocalLoading(false);
        }
      );
      
      // Cleanup function với cơ chế hủy đăng ký tốt hơn
      return () => {
        // Tăng cache version để bỏ qua các callback trễ
        cacheVersion++;
        
        // Clear timeout nếu có
        if (debounceTimeout) clearTimeout(debounceTimeout);
        
        // Hủy đăng ký listener
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up recent trades listener:", error);
      setLocalLoading(false);
    }
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
