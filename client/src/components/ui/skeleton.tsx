import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted dark:bg-[hsl(212_35%_10%)] transition-colors", className)}
      {...props}
    />
  )
}

export { Skeleton }
