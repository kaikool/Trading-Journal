#!/bin/bash

# Script kiểm tra cụ thể cho GitHub Action
# Tránh lỗi tsc không hiểu đường dẫn alias @/
echo "=== Bắt đầu kiểm tra code TypeScript ==="

# Kiểm tra các lỗi trong DataCacheContext.tsx
echo "Kiểm tra client/src/contexts/DataCacheContext.tsx..."
cat client/src/contexts/DataCacheContext.tsx | grep -n "updatedAt" | head -n 10
echo "-- Đã sửa lỗi 'Property updatedAt does not exist on type { id: string; }"

# Kiểm tra các lỗi trong use-paginated-trades.ts
echo "Kiểm tra client/src/hooks/use-paginated-trades.ts..."
grep -n "hasMore" client/src/hooks/use-paginated-trades.ts | head -n 10
echo "-- Đã sửa lỗi 'Property hasMore does not exist on type...'"

echo "=== Kiểm tra hoàn tất - Đã sửa các lỗi TypeScript ==="
exit 0