import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { cn, formatCurrency, getRelativeTime } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { RecentActivity as RecentActivityType } from "@/types";

interface RecentActivityProps {
  activities: RecentActivityType[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export default function RecentActivity({ 
  activities, 
  isLoading = false,
  onViewAll 
}: RecentActivityProps) {
  if (isLoading) {
    return null;
  }

  return (
    <Card className="shadow-sm border border-border/30 h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Icons.general.target className="h-5 w-5 mr-2 text-primary/80" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Your latest trading actions
            </CardDescription>
          </div>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-primary text-xs px-3 py-1.5 hover:bg-primary/5 rounded-full flex items-center transition-colors"
            >
              <Icons.general.clipboard className="h-3.5 w-3.5 mr-1.5" />
              See all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center bg-muted/5 rounded-md border border-dashed border-border/50 h-[230px]">
            <Icons.general.target className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">Complete a trade to see activity here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const isProfit = activity.amount > 0;
              
              return (
                <div 
                  key={activity.id}
                  className={cn(
                    "flex items-center p-3 rounded-lg transition-all border",
                    isProfit 
                      ? "bg-success/5 hover:bg-success/10 border-success/20" 
                      : "bg-destructive/5 hover:bg-destructive/10 border-destructive/20"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                    isProfit 
                      ? "bg-success/15" 
                      : "bg-destructive/15"
                  )}>
                    {isProfit ? (
                      <Icons.ui.arrowUp className={cn("h-4 w-4 text-success")} />
                    ) : (
                      <Icons.ui.arrowDown className={cn("h-4 w-4 text-destructive")} />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{activity.pair}</span>
                      <span className={cn(
                        "font-semibold text-sm",
                        isProfit ? "text-success" : "text-destructive"
                      )}>
                        {isProfit ? "+" : ""}{formatCurrency(activity.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span className="flex items-center">
                        {activity.direction === "BUY" ? "Buy" : "Sell"}
                        {activity.description && (
                          <>
                            <span className="mx-1 opacity-40">•</span>
                            {activity.description}
                          </>
                        )}
                      </span>
                      <span className="flex items-center">
                        <Icons.general.clock className="h-3 w-3 mr-1 opacity-70" />
                        {getRelativeTime(activity.date?.toDate())}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
