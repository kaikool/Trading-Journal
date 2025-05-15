#!/bin/bash

# Script kiểm tra type cho GitHub Action
echo "=== Bắt đầu kiểm tra types ==="

# Kiểm tra DataCacheContext.tsx
echo "Kiểm tra client/src/contexts/DataCacheContext.tsx..."
tsc --noEmit --skipLibCheck client/src/contexts/DataCacheContext.tsx

# Kiểm tra use-paginated-trades.ts
echo "Kiểm tra client/src/hooks/use-paginated-trades.ts..."
tsc --noEmit --skipLibCheck client/src/hooks/use-paginated-trades.ts

echo "=== Hoàn thành kiểm tra types ==="