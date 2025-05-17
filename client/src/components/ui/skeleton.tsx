import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "rounded" | "circular" | "text";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animation = "pulse"
}: SkeletonProps) {
  let animationClass = "";
  switch (animation) {
    case "pulse":
      animationClass = "animate-pulse";
      break;
    case "wave":
      animationClass = "skeleton-wave";
      break;
    case "none":
      animationClass = "";
      break;
  }
  
  const variantClass = getVariantClass(variant);
  
  return (
    <div
      className={cn(
        "bg-muted",
        animationClass,
        variantClass,
        className
      )}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
        height: height ? (typeof height === "number" ? `${height}px` : height) : "1rem"
      }}
    />
  );
}

function getVariantClass(variant: SkeletonProps["variant"]) {
  switch (variant) {
    case "rounded":
      return "rounded-md";
    case "circular":
      return "rounded-full";
    case "text":
      return "rounded-sm h-4";
    default:
      return "rounded-sm";
  }
}

// For convenience, export specialized skeletons
export function CircleSkeleton({ className, size = 40, ...props }: Omit<SkeletonProps, "variant" | "width" | "height"> & { size?: number }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
      {...props}
    />
  );
}

export function TextSkeleton({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return (
    <Skeleton
      variant="text"
      className={cn("w-full max-w-[200px]", className)}
      {...props}
    />
  );
}

export function RectSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      variant="rounded"
      className={className}
      {...props}
    />
  );
}