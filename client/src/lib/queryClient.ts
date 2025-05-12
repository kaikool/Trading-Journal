import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Cấu hình mặc định cho các loại queries dựa trên tính chất dữ liệu
const DEFAULT_CACHE_TIME = 1000 * 60 * 5; // 5 phút

// Tạo queryClient với cấu hình được tối ưu hóa
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 phút
      retry: 1, // Thử lại 1 lần trong trường hợp lỗi mạng
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      gcTime: DEFAULT_CACHE_TIME, // Thời gian cache
    },
    mutations: {
      retry: 1, // Thử lại 1 lần trong trường hợp lỗi mạng
      retryDelay: 1000, // 1 giây
    },
  },
});

// Cập nhật cấu hình QueryClient dựa trên hiệu năng thiết bị
export async function updateQueryClientConfig() {
  try {
    // Use direct import instead of dynamic import to avoid module loading issues
    import('./performance').then(async (module) => {
      const config = await module.getOptimalUiConfig();
      
      // Cập nhật cấu hình dựa trên hiệu năng thiết bị
      const staleTime = config.queryStaleTime;
      const gcTime = config.queryStaleTime * 2; // Thời gian cache sau khi stale
      
      // Áp dụng cấu hình tối ưu cho ứng dụng single-user
      queryClient.setDefaultOptions({
        queries: {
          queryFn: getQueryFn({ on401: "throw" }),
          refetchInterval: false,
          refetchOnWindowFocus: false, // Tắt refetch khi focus vì đây là ứng dụng single-user
          staleTime: staleTime,
          gcTime: gcTime,
          retry: config.devicePerformance === 'low' ? 0 : 1, // Giảm số lần retry trên thiết bị hiệu năng thấp
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          structuralSharing: true, // Tối ưu hóa bộ nhớ
        },
      });
      
      // Log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log('QueryClient configured based on device performance', {
          devicePerformance: config.devicePerformance,
          staleTime,
          gcTime,
          refetchOnWindowFocus: false,
        });
      }
    }).catch(error => {
      console.error('Failed to optimize QueryClient config:', error);
      
      // Apply default configuration if optimization fails
      queryClient.setDefaultOptions({
        queries: {
          queryFn: getQueryFn({ on401: "throw" }),
          refetchInterval: false,
          refetchOnWindowFocus: false,
          staleTime: 1000 * 60 * 5, // 5 minutes default
          gcTime: 1000 * 60 * 10, // 10 minutes default
          retry: 1,
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          structuralSharing: true,
        },
      });
    });
  } catch (error) {
    console.error('Failed to optimize QueryClient config', error);
  }
}
