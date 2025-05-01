import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TradeFilterOptions } from "@/types";

import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  CircleCheck,
  CircleX,
  CircleDashed,
  CircleDot,
  Lightbulb,
  Heart,
  Check,
  X,
  Clock,
  Newspaper as NewspaperIcon,
} from "lucide-react";

interface FilterTagsProps {
  filters: TradeFilterOptions;
  onRemoveFilter: (
    type: string, 
    value?: string
  ) => void;
}

export function FilterTags({ filters, onRemoveFilter }: FilterTagsProps) {
  if (!filters || Object.keys(filters).length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {filters.startDate && filters.endDate && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <Calendar className="h-3 w-3" /> 
          {format(filters.startDate, "dd/MM/yy")} - {format(filters.endDate, "dd/MM/yy")}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('date')}
          />
        </Badge>
      )}
      
      {filters.pair?.map(pair => (
        <Badge 
          key={pair}
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <DollarSign className="h-3 w-3" /> {pair}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('pair', pair)}
          />
        </Badge>
      ))}
      
      {filters.direction?.map(dir => (
        <Badge 
          key={dir}
          variant="outline" 
          className={cn(
            "flex items-center gap-1",
            dir === "BUY" ? "bg-green-500/10 hover:bg-green-500/20" : "bg-red-500/10 hover:bg-red-500/20"
          )}
        >
          {dir === "BUY" ? 
            <ArrowUp className="h-3 w-3" /> : 
            <ArrowDown className="h-3 w-3" />
          } 
          {dir === "BUY" ? "Buy (Long)" : "Sell (Short)"}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('direction', dir)}
          />
        </Badge>
      ))}
      
      {filters.result?.map(result => (
        <Badge 
          key={result}
          variant="outline" 
          className={cn(
            "flex items-center gap-1",
            result === "TP" ? "bg-green-500/10 hover:bg-green-500/20" :
            result === "SL" ? "bg-red-500/10 hover:bg-red-500/20" :
            "bg-primary/5 hover:bg-primary/10"
          )}
        >
          {result === "TP" ? <CircleCheck className="h-3 w-3" /> : 
           result === "SL" ? <CircleX className="h-3 w-3" /> : 
           result === "BE" ? <CircleDashed className="h-3 w-3" /> : 
           <CircleDot className="h-3 w-3" />} 
          {result === "TP" ? "Take Profit" : 
           result === "SL" ? "Stop Loss" : 
           result === "BE" ? "Break Even" : "Manual Close"}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('result', result)}
          />
        </Badge>
      ))}
      
      {filters.strategy?.map(strategy => (
        <Badge 
          key={strategy}
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <Lightbulb className="h-3 w-3" /> {strategy}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('strategy', strategy)}
          />
        </Badge>
      ))}
      
      {filters.emotion?.map(emotion => (
        <Badge 
          key={emotion}
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <Heart className="h-3 w-3" /> {emotion}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('emotion', emotion)}
          />
        </Badge>
      ))}
      
      {filters.hasFollowedPlan !== undefined && (
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center gap-1",
            filters.hasFollowedPlan 
              ? "bg-green-500/10 hover:bg-green-500/20" 
              : "bg-red-500/10 hover:bg-red-500/20"
          )}
        >
          {filters.hasFollowedPlan 
            ? <Check className="h-3 w-3" /> 
            : <X className="h-3 w-3" />
          } 
          {filters.hasFollowedPlan ? "Followed Plan" : "Didn't Follow Plan"}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('followedPlan')}
          />
        </Badge>
      )}
      
      {filters.sessionType?.map(session => (
        <Badge 
          key={session}
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <Clock className="h-3 w-3" /> {session}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('sessionType', session)}
          />
        </Badge>
      ))}
      
      {filters.hasNews !== undefined && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <NewspaperIcon className="h-3 w-3" /> 
          {filters.hasNews ? "With News" : "Without News"}
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('news')}
          />
        </Badge>
      )}

      {filters.hasEnteredEarly && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <CircleX className="h-3 w-3" /> 
          Entered Early
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('enteredEarly')}
          />
        </Badge>
      )}

      {filters.hasMovedSL && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <CircleX className="h-3 w-3" /> 
          Moved Stop Loss
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('movedSL')}
          />
        </Badge>
      )}

      {filters.hasOverLeveraged && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <CircleX className="h-3 w-3" /> 
          Over Leveraged
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('overLeveraged')}
          />
        </Badge>
      )}

      {filters.hasRevenge && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
        >
          <CircleX className="h-3 w-3" /> 
          Revenge Trading
          <X
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => onRemoveFilter('revenge')}
          />
        </Badge>
      )}
    </div>
  );
}