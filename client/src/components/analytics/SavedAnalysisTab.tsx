/**
 * SavedAnalysisTab.tsx
 * 
 * Component hiển thị các phân tích đã lưu trước đó (tối đa 5)
 * Được lưu trữ trong Firebase và tự động xóa khi vượt quá giới hạn
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons/icons";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TradingStrategy } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import {
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  doc,
  getFirestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

// Sử dụng Firebase đã khởi tạo
const db = getFirestore(getApp());

// Interface cho phân tích đã lưu
interface SavedAnalysis {
  id: string;
  strategyId: string;
  strategyName: string;
  createdAt: Timestamp;
  overallWinRate: number;
  totalTrades: number;
  conditions: {
    id: string;
    label: string;
    winRate: number;
    type: string; 
  }[];
  recommendations?: {
    id: string;
    title: string;
    description: string;
    impact: string;
  }[];
}

export default function SavedAnalysisTab({ strategies }: { strategies: TradingStrategy[] }) {
  const { userId } = useAuth();
  const { toast } = useToast();
  
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);

  // Tải danh sách phân tích đã lưu
  useEffect(() => {
    const loadSavedAnalyses = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Truy vấn 5 phân tích gần nhất
        const analysisRef = collection(db, "users", userId, "savedAnalyses");
        const q = query(analysisRef, orderBy("createdAt", "desc"), limit(5));
        const snapshot = await getDocs(q);
        
        const analyses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SavedAnalysis[];
        
        setSavedAnalyses(analyses);
      } catch (error) {
        console.error("Error loading saved analyses:", error);
        toast({
          title: "Lỗi tải dữ liệu",
          description: "Không thể tải danh sách phân tích đã lưu",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedAnalyses();
  }, [userId, toast]);

  // Xử lý xóa phân tích
  const handleDelete = async (analysisId: string) => {
    if (!userId) return;
    
    setDeleteInProgress(analysisId);
    try {
      const docRef = doc(db, "users", userId, "savedAnalyses", analysisId);
      await deleteDoc(docRef);
      
      // Cập nhật state để không cần tải lại
      setSavedAnalyses(prev => prev.filter(a => a.id !== analysisId));
      
      toast({
        title: "Đã xóa",
        description: "Phân tích đã được xóa thành công",
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "Lỗi xóa dữ liệu",
        description: "Không thể xóa phân tích này",
        variant: "destructive",
      });
    } finally {
      setDeleteInProgress(null);
    }
  };

  // Hàm lấy tên chiến lược từ ID
  const getStrategyName = (strategyId: string): string => {
    const strategy = strategies.find(s => s.id === strategyId);
    return strategy?.name || strategyId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Phân tích đã lưu</h2>
        <Badge variant="outline" className="px-2 py-0.5">
          {savedAnalyses.length}/5
        </Badge>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savedAnalyses.length === 0 ? (
        <Alert>
          <AlertDescription>
            Chưa có phân tích nào được lưu. Phân tích chiến lược trong tab AI Analysis để lưu trữ kết quả.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {savedAnalyses.map(analysis => (
            <Card key={analysis.id} className="bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    <div className="flex items-center gap-2">
                      <Icons.analytics.target className="h-4 w-4 text-primary" />
                      {getStrategyName(analysis.strategyId)}
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(analysis.createdAt.toDate(), {
                        addSuffix: true,
                        locale: vi
                      })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full hover:bg-destructive/10"
                      onClick={() => handleDelete(analysis.id)}
                      disabled={deleteInProgress === analysis.id}
                    >
                      {deleteInProgress === analysis.id ? (
                        <Icons.ui.spinner className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Icons.ui.close className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tỷ lệ thắng</span>
                    <Badge variant={
                      analysis.overallWinRate >= 60 ? "default" :
                      analysis.overallWinRate >= 45 ? "secondary" : "destructive"
                    } className={`font-medium ${
                      analysis.overallWinRate >= 60 ? "bg-green-100 text-green-800 hover:bg-green-100" :
                      analysis.overallWinRate >= 45 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                      "bg-red-100 text-red-800 hover:bg-red-100"
                    }`}
                      {analysis.overallWinRate.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Top conditions:</div>
                    <div className="space-y-1">
                      {analysis.conditions.slice(0, 3).map(condition => (
                        <div key={condition.id} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[70%]">{condition.label}</span>
                          <span className={`font-medium ${
                            condition.winRate >= 60 ? 'text-green-600' :
                            condition.winRate >= 45 ? 'text-amber-600' : 'text-red-600'
                          }`}>{condition.winRate.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}