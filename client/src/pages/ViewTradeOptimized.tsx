import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { auth, getTradeById, deleteTrade } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Trade } from "@/types";
import { useLocation } from "wouter";
import { LazyTradeViewEdit } from "@/components/trades/LazyTradeViewEdit";
import { debug, logError } from "@/lib/debug";

export default function ViewTradeOptimized() {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const userId = auth.currentUser?.uid;
  const [_, navigate] = useLocation();

  // Fetch trade data
  useEffect(() => {
    const fetchTrade = async () => {
      if (!tradeId || !userId) {
        setError("Trade ID or user ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        debug(`Fetching trade with ID: ${tradeId}`);
        const tradeData = await getTradeById(userId, tradeId);

        if (!tradeData) {
          setError("Trade not found");
          setIsLoading(false);
          return;
        }

        debug("Trade data loaded:", tradeData);
        const trade = tradeData as Trade;
        setTrade(trade);
      } catch (err) {
        logError("Error fetching trade:", err);
        setError("Failed to load trade data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrade();
  }, [tradeId, userId]);

  // Navigate back
  const handleBack = () => {
    navigate("/trade/history");
  };

  // Handle delete trade
  const handleDelete = async (tradeId: string) => {
    if (!userId) return;
    
    if (window.confirm("Are you sure you want to delete this trade? This action cannot be undone.")) {
      try {
        setIsLoading(true);
        await deleteTrade(userId, tradeId);
        toast({
          title: "Trade deleted",
          description: "The trade has been permanently deleted",
        });
        navigate("/trade/history");
      } catch (error) {
        logError("Error deleting trade:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete trade. Please try again.",
        });
        setIsLoading(false);
      }
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    toast({
      title: "Trade updated",
      description: "Your trade has been updated successfully",
    });
    // Refresh data after edit
    if (userId && tradeId) {
      getTradeById(userId, tradeId).then(updatedTrade => {
        if (updatedTrade) {
          setTrade(updatedTrade as Trade);
        }
      });
    }
  };

  // Handle edit error
  const handleEditError = (error: unknown) => {
    toast({
      variant: "destructive",
      title: "Failed to update trade",
      description: typeof error === 'string' 
        ? error 
        : error instanceof Error 
          ? error.message 
          : "An error occurred",
    });
  };

  return (
    <div className="container max-w-5xl px-0 sm:px-4">
      <div className="mt-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trade History
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">{error}</h3>
            <p className="text-muted-foreground mb-4">
              The trade could not be loaded. Please try again later.
            </p>
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              Return to Trade History
            </Button>
          </CardContent>
        </Card>
      ) : trade ? (
        <>
          <LazyTradeViewEdit
            trade={trade}
            userId={userId || ""}
            isLoading={isLoading}
            onEdit={(isSubmitting) => setIsLoading(isSubmitting)}
            onSuccess={handleEditSuccess}
            onError={handleEditError}
            onDelete={handleDelete}
            onBack={handleBack}
          />
        </>
      ) : (
        <Card className="mb-4 overflow-hidden">
          <CardContent className="py-8 px-4 sm:p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">Trade not found</h3>
            <p className="text-muted-foreground mb-4">
              The trade you're looking for doesn't exist or might have been deleted.
            </p>
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              Return to Trade History
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}