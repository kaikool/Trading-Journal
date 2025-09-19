
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { NumberInput } from '@/components/ui/number-input';
import { Icons } from '@/components/icons/icons';
import { GetPriceButton } from '../GetPriceButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TradeFormValues } from '../types';
import { formatRiskReward } from '@/utils/format-number';

interface TradeDetailsProps {
  isCalculatingLotSize: boolean;
  isCalculatingTakeProfit: boolean;
  accountBalance: number;
  riskPercentage: number;
  setRiskPercentage: (value: number) => void;
  calculateOptimalLotSize: () => void;
  calculateOptimalTakeProfit: () => void;
  riskRewardRatio?: number;
}

export function TradeDetails({
  isCalculatingLotSize,
  isCalculatingTakeProfit,
  accountBalance,
  riskPercentage,
  setRiskPercentage,
  calculateOptimalLotSize,
  calculateOptimalTakeProfit,
  riskRewardRatio = 0
}: TradeDetailsProps) {
  const form = useFormContext<TradeFormValues>();
  const selectedPair = form.watch("pair");
  const formattedRatio = riskRewardRatio !== undefined 
    ? formatRiskReward(riskRewardRatio, { formatAsRatio: true, minimumFractionDigits: 2 }) 
    : "1:0";
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-4">
          {/* Direction Buttons */}
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => field.onChange("BUY")}
                      variant={field.value === "BUY" ? "default" : "outline"}
                      className={cn(
                        "h-9 transition-all",
                        field.value === "BUY" ? "bg-green-600 hover:bg-green-700 text-white" : "hover:border-green-600 hover:text-green-600"
                      )}
                    >
                      <Icons.trade.arrowUp className="mr-1 h-4 w-4" /> 
                      Buy (Long)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => field.onChange("SELL")}
                      variant={field.value === "SELL" ? "default" : "outline"}
                      className={cn(
                        "h-9 transition-all",
                        field.value === "SELL" ? "bg-red-600 hover:bg-red-700 text-white" : "hover:border-red-600 hover:text-red-600"
                      )}
                    >
                      <Icons.trade.arrowDown className="mr-1 h-4 w-4" /> 
                      Sell (Short)
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency Pair + Entry Price in one row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Currency Pair */}
            <FormField
              control={form.control}
              name="pair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency Pair</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="pair" className="h-9 text-sm">
                        <SelectValue placeholder="Select pair" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EURUSD">EUR/USD</SelectItem>
                      <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                      <SelectItem value="USDJPY">USD/JPY</SelectItem>
                      <SelectItem value="AUDUSD">AUD/USD</SelectItem>
                      <SelectItem value="USDCAD">USD/CAD</SelectItem>
                      <SelectItem value="NZDUSD">NZD/USD</SelectItem>
                      <SelectItem value="EURGBP">EUR/GBP</SelectItem>
                      <SelectItem value="USDCHF">USD/CHF</SelectItem>
                      <SelectItem value="XAUUSD">XAU/USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entry Price */}
            <FormField
              control={form.control}
              name="entryPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <NumberInput
                        placeholder="0.00000"
                        value={field.value}
                        onChange={field.onChange}
                        decimalPlaces={selectedPair === "XAUUSD" || selectedPair === "USDJPY" ? 2 : 4}
                        className="h-9 pr-9"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <GetPriceButton
                          symbol={selectedPair || "XAUUSD"}
                          onPriceReceived={(price) => form.setValue("entryPrice", price, { shouldValidate: true })}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* --- RIGHT COLUMN --- */}
        <div className="space-y-4">
          {/* Stop Loss and Take Profit in one row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Stop Loss */}
            <FormField
              control={form.control}
              name="stopLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stop Loss</FormLabel>
                  <FormControl>
                    <NumberInput
                      placeholder="0.00000"
                      value={field.value}
                      onChange={field.onChange}
                      decimalPlaces={selectedPair === "XAUUSD" || selectedPair === "USDJPY" ? 2 : 4}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Take Profit */}
            <FormField
              control={form.control}
              name="takeProfit"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1">
                    <FormLabel>Take Profit</FormLabel>
                    <span className="text-xs text-muted-foreground italic bg-muted px-1 rounded">Auto</span>
                  </div>
                  <FormControl>
                    <NumberInput
                      placeholder="0.00000"
                      value={field.value}
                      onChange={field.onChange}
                      decimalPlaces={selectedPair === "XAUUSD" || selectedPair === "USDJPY" ? 2 : 4}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Lot Size */}
          <FormField
            control={form.control}
            name="lotSize"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Lot Size</FormLabel>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-sm gap-1 rounded-sm"
                    onClick={calculateOptimalLotSize}
                    disabled={isCalculatingLotSize}
                  >
                    <span>Calculate</span>
                  </Button>
                </div>
                <FormControl>
                  <NumberInput
                    placeholder="0.01"
                    value={field.value}
                    onChange={field.onChange}
                    min={0.01}
                    step={0.01}
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
