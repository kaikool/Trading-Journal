import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // Check for parent's darkMode setting (will be used in app-skeleton)
  const isDark = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : false;
    
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted transition-colors", 
        isDark ? "dark:bg-muted" : "",
        className
      )}
      style={{
        backgroundColor: isDark ? 'hsl(212 35% 10%)' : ''
      }}
      {...props}
    />
  )
}

export { Skeleton }
