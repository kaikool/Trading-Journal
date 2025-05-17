import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // Return empty div instead of animated skeleton
  return null;
}

export { Skeleton }
