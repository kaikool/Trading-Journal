/**
 * Custom hook để sử dụng dữ liệu người dùng với React Query
 * 
 * Hook này thay thế hoàn toàn phiên bản cũ (useUserData) và:
 * - Sử dụng React Query để quản lý cache, invalidation và stale time
 * - Hỗ trợ tự động cập nhật UI khi dữ liệu thay đổi
 * - Giảm cache conflicts và logic phức tạp
 * 
 * Cách sử dụng:
 * - Thay vì useUserData, sử dụng useUserDataQuery
 */

import { useCallback } from "react";
import { useAuth } from "./use-auth";
import { useQuery } from "@tanstack/react-query";
import { getUserData } from "@/lib/firebase";
import { DASHBOARD_CONFIG } from "@/lib/config";
import { debug } from "@/lib/debug";
import { useUserDataQuery } from "./use-user-data-query";

export function useUserData() {
  // Để hỗ trợ các component cũ chưa update
  const { userId } = useAuth();
  const { data: userData, isLoading } = useUserDataQuery();
  
  // Function để lấy số dư ban đầu
  const getInitialBalance = useCallback(() => {
    return userData?.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;
  }, [userData]);
  
  // Function để lấy số dư hiện tại
  const getCurrentBalance = useCallback(() => {
    // Đơn giản trả về giá trị initial balance, để component tự tính currentBalance
    return getInitialBalance();
  }, [getInitialBalance]);
  
  return {
    userId,
    userData,
    isLoading,
    fetchUserData: () => {}, // No-op function for backward compatibility
    getCurrentBalance,
    getInitialBalance
  };
}