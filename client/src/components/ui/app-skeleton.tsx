import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton, CircleSkeleton, TextSkeleton, RectSkeleton } from "./skeleton";

// Define skeleton types for different components
export enum SkeletonLevel {
  LIST_ITEM = "list_item",
  CARD = "card",
  FORM = "form",
  PAGE = "page",
  CHART = "chart",
  TABLE = "table",
  STATS = "stats",
  AVATAR = "avatar",
}

interface AppSkeletonProps {
  level: SkeletonLevel;
  className?: string;
  repeat?: number;
  gap?: number;
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  hasTitle?: boolean;
  hasPicture?: boolean;
  hasFooter?: boolean;
}

export function AppSkeleton({
  level,
  className,
  repeat = 1,
  gap = 4,
  width,
  height,
  animation = "pulse",
  hasTitle = true,
  hasPicture = false,
  hasFooter = false,
}: AppSkeletonProps) {
  const renderSkeleton = (index: number) => {
    const key = `skeleton-${level}-${index}`;
    
    switch (level) {
      case SkeletonLevel.LIST_ITEM:
        return (
          <div 
            key={key} 
            className={cn(
              "flex items-center px-4 py-3 space-x-3 border-b",
              className
            )}
          >
            {hasPicture && <CircleSkeleton size={40} animation={animation} />}
            <div className="flex-1">
              {hasTitle && <TextSkeleton className="w-3/4 mb-2" animation={animation} />}
              <TextSkeleton className="w-full" animation={animation} />
              {hasFooter && <TextSkeleton className="w-1/2 mt-2" animation={animation} />}
            </div>
          </div>
        );
        
      case SkeletonLevel.CARD:
        return (
          <div 
            key={key} 
            className={cn(
              "rounded-lg border bg-card p-4",
              className
            )}
            style={{
              width: width ? (typeof width === "number" ? `${width}px` : width) : "100%"
            }}
          >
            {hasPicture && (
              <RectSkeleton 
                height={150} 
                className="w-full mb-4 rounded-md" 
                animation={animation} 
              />
            )}
            {hasTitle && <TextSkeleton className="w-3/4 mb-3" height={24} animation={animation} />}
            <TextSkeleton className="w-full mb-2" animation={animation} />
            <TextSkeleton className="w-full mb-2" animation={animation} />
            <TextSkeleton className="w-2/3" animation={animation} />
            {hasFooter && (
              <div className="mt-4 pt-3 border-t flex justify-between">
                <TextSkeleton className="w-1/3" animation={animation} />
                <TextSkeleton className="w-1/4" animation={animation} />
              </div>
            )}
          </div>
        );
        
      case SkeletonLevel.FORM:
        return (
          <div 
            key={key} 
            className={cn(
              "space-y-4",
              className
            )}
          >
            {hasTitle && <TextSkeleton className="w-1/2 mb-2" height={24} animation={animation} />}
            <div className="space-y-2">
              <TextSkeleton className="w-1/4" animation={animation} />
              <RectSkeleton height={40} className="w-full" animation={animation} />
            </div>
            <div className="space-y-2">
              <TextSkeleton className="w-1/4" animation={animation} />
              <RectSkeleton height={40} className="w-full" animation={animation} />
            </div>
            <div className="space-y-2">
              <TextSkeleton className="w-1/4" animation={animation} />
              <RectSkeleton height={100} className="w-full" animation={animation} />
            </div>
            {hasFooter && (
              <div className="pt-4 flex justify-end space-x-3">
                <RectSkeleton width={100} height={40} animation={animation} />
                <RectSkeleton width={100} height={40} animation={animation} />
              </div>
            )}
          </div>
        );
        
      case SkeletonLevel.PAGE:
        return (
          <div key={key} className={cn("space-y-6", className)}>
            {hasTitle && (
              <div className="space-y-2">
                <TextSkeleton className="w-1/2" height={32} animation={animation} />
                <TextSkeleton className="w-full" animation={animation} />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <RectSkeleton 
                  key={`card-${i}`} 
                  height={180} 
                  className="rounded-lg" 
                  animation={animation} 
                />
              ))}
            </div>
            <div className="space-y-4">
              <TextSkeleton className="w-1/3" height={24} animation={animation} />
              <RectSkeleton height={200} animation={animation} />
            </div>
            {hasFooter && (
              <div className="pt-4 mt-6 border-t">
                <RectSkeleton height={60} animation={animation} />
              </div>
            )}
          </div>
        );
        
      case SkeletonLevel.CHART:
        return (
          <div 
            key={key} 
            className={cn(
              "rounded-lg border bg-card p-4",
              className
            )}
          >
            {hasTitle && <TextSkeleton className="w-1/3 mb-4" animation={animation} />}
            <RectSkeleton 
              height={height || 250} 
              className="w-full" 
              animation={animation} 
            />
            {hasFooter && (
              <div className="mt-4 flex justify-between">
                <TextSkeleton className="w-1/5" animation={animation} />
                <TextSkeleton className="w-1/5" animation={animation} />
                <TextSkeleton className="w-1/5" animation={animation} />
              </div>
            )}
          </div>
        );
        
      case SkeletonLevel.TABLE:
        return (
          <div key={key} className={cn("space-y-4", className)}>
            {hasTitle && <TextSkeleton className="w-1/3 mb-2" animation={animation} />}
            <div className="rounded-md border overflow-hidden">
              {/* Table header */}
              <div className="flex border-b bg-muted/40 p-2">
                <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                <TextSkeleton className="w-2/6 mx-2" animation={animation} />
                <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                <TextSkeleton className="w-1/6 mx-2" animation={animation} />
              </div>
              {/* Table rows */}
              {[...Array(5)].map((_, i) => (
                <div key={`row-${i}`} className="flex border-b p-3">
                  <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                  <TextSkeleton className="w-2/6 mx-2" animation={animation} />
                  <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                  <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                  <TextSkeleton className="w-1/6 mx-2" animation={animation} />
                </div>
              ))}
            </div>
            {hasFooter && (
              <div className="flex justify-between items-center py-2">
                <TextSkeleton className="w-1/5" animation={animation} />
                <div className="flex space-x-1">
                  <RectSkeleton width={36} height={36} className="rounded-md" animation={animation} />
                  <RectSkeleton width={36} height={36} className="rounded-md" animation={animation} />
                  <RectSkeleton width={36} height={36} className="rounded-md" animation={animation} />
                </div>
              </div>
            )}
          </div>
        );
        
      case SkeletonLevel.STATS:
        return (
          <div key={key} className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
            {[...Array(3)].map((_, i) => (
              <div key={`stat-${i}`} className="bg-card border rounded-lg p-4">
                <TextSkeleton className="w-1/2 mb-1" animation={animation} />
                <TextSkeleton className="w-full mb-3" height={28} animation={animation} />
                <TextSkeleton className="w-3/4" animation={animation} />
              </div>
            ))}
          </div>
        );
        
      case SkeletonLevel.AVATAR:
        return (
          <div 
            key={key} 
            className={cn(
              "flex items-center",
              className
            )}
          >
            <CircleSkeleton 
              size={width ? Number(width) : 40} 
              animation={animation} 
            />
            {hasTitle && (
              <div className="ml-3">
                <TextSkeleton className="w-24" animation={animation} />
                {hasFooter && <TextSkeleton className="w-16 mt-1" animation={animation} />}
              </div>
            )}
          </div>
        );
        
      default:
        return <Skeleton key={key} className={className} animation={animation} />;
    }
  };
  
  // For repeating skeletons
  if (repeat > 1) {
    return (
      <div 
        className="flex flex-col" 
        style={{ gap: `${gap * 0.25}rem` }}
      >
        {[...Array(repeat)].map((_, index) => renderSkeleton(index))}
      </div>
    );
  }
  
  return renderSkeleton(0);
}