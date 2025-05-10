/**
 * Custom hook để lưu trữ và quản lý dữ liệu người dùng giữa các trang
 * 
 * Hook này cung cấp trạng thái global cho userData và currentBalance
 * để tránh việc tải/tính toán lại mỗi khi chuyển trang
 * 
 * NGUYÊN TẮC HOẠT ĐỘNG:
 * 1. Khi hook được gọi trong một component, nó trước tiên kiểm tra xem có dữ liệu global không
 * 2. Nếu có dữ liệu global, sử dụng dữ liệu đó luôn mà không fetch lại từ server
 * 3. Chỉ fetch dữ liệu từ server khi:
 *    - Chưa có dữ liệu global
 *    - Đã quá thời gian làm mới (60 giây)
 *    - Được yêu cầu force refresh (ví dụ: sau khi xóa/thêm/sửa lệnh)
 * 4. Dữ liệu global được chia sẻ giữa tất cả các component sử dụng hook này
 * 
 * QUAN TRỌNG:
 * - Khi thêm/xóa/sửa lệnh gọi fetchUserData(true) để buộc refresh cache
 * - Khi navigate giữa các trang, cache được tái sử dụng để tránh tính toán lại
 */

import { useState, useEffect, useCallback } from "react";
import { auth, getUserData } from "@/lib/firebase";
import { DASHBOARD_CONFIG } from "@/lib/config";

// Biến lưu trữ toàn cục - được chia sẻ giữa các trang để tránh fetch nhiều lần
let globalUserData: any = null;
let globalCurrentBalance: number | null = null;
let lastFetchTime = 0;
const REFRESH_INTERVAL = 60000; // Thời gian làm mới: 1 phút

export function useUserData() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(globalUserData);
  const [isLoading, setIsLoading] = useState<boolean>(!globalUserData);
  
  // Đăng ký lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Clear global data on logout
        globalUserData = null;
        globalCurrentBalance = null;
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Tải dữ liệu người dùng khi userId thay đổi hoặc khi cần làm mới
  const fetchUserData = useCallback(async (force = false) => {
    if (!userId) return;
    
    // Kiểm tra xem có cần fetch lại dữ liệu hay không
    const now = Date.now();
    
    // Chỉ làm mới khi:
    // 1. Bị force refresh (ví dụ sau khi thêm/xóa/sửa lệnh)
    // 2. Chưa có dữ liệu global
    // 3. Đã quá thời gian làm mới (60 giây)
    const shouldRefresh = force || !globalUserData || (now - lastFetchTime > REFRESH_INTERVAL);
    
    // Nếu có userData và không cần làm mới, không làm gì cả
    if (!shouldRefresh) {
      // Đảm bảo rằng state local có dữ liệu từ global cache
      if (globalUserData && (!userData || userData.currentBalance !== globalUserData.currentBalance)) {
        console.log("Global user hook: Using cached user data, no fetch needed");
        setUserData(globalUserData);
      }
      return;
    }
    
    // Nếu cần làm mới, fetch dữ liệu mới
    setIsLoading(true);
    try {
      console.log("Global user hook: Fetching user data" + (force ? " (forced)" : ""));
      const data = await getUserData(userId);
      
      if (data) {
        console.log("Global user hook: User data loaded, balance:", data.currentBalance);
        
        // Update both local state and global variable
        setUserData(data);
        globalUserData = data;
        
        // Update global currentBalance - this value is not stored persistently 
        // so each component can calculate based on trades
        globalCurrentBalance = null;
          
        // Update fetch timestamp
        lastFetchTime = now;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userData]);
  
  // Fetch dữ liệu khi userId thay đổi
  useEffect(() => {
    fetchUserData();
  }, [userId, fetchUserData]);
  
  // Function để lấy số dư hiện tại
  // IMPORTANT: Không sử dụng currentBalance từ userData nữa!
  // Mỗi component nên tự tính currentBalance từ trades và initialBalance
  // theo quy tắc ở balance-calculation-rules.ts
  const getCurrentBalance = useCallback(() => {
    // Đơn giản trả về giá trị initial balance, để component tự tính currentBalance
    return getInitialBalance();
  }, []);
  
  // Function để lấy số dư ban đầu
  const getInitialBalance = useCallback(() => {
    return userData?.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;
  }, [userData]);
  
  return {
    userId,
    userData,
    isLoading,
    fetchUserData,
    getCurrentBalance,
    getInitialBalance
  };
}