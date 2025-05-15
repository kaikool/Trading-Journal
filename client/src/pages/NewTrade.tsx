import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import TradeFormNew from "@/components/trades/TradeFormNew";
import { 
  Card, 
  CardContent, 
  CardGradient 
} from "@/components/ui/card";
import { Icons } from "@/components/icons/icons";

export default function NewTrade() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get userId from Firebase auth
  const [userId, setUserId] = useState<string | undefined>(auth.currentUser?.uid);
  
  useEffect(() => {
    if (auth.currentUser?.uid) {
      setUserId(auth.currentUser.uid);
    }
  }, []);

  if (!userId) {
    setLocation("/auth/login");
    return null;
  }

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          New Trade
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
          Record your trade details to track performance and gain insights
        </p>
      </div>

      {isSubmitting ? (
        <Card className="relative overflow-hidden card-spotlight">
          <CardGradient 
            variant="primary"
            intensity="subtle"
            direction="top-right"
          />
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-6 mb-5">
              <Icons.ui.spinner className="h-10 w-10 animate-spin text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Saving your trade...</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Please wait while we record your trade details and process any uploaded images.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden card-spotlight">
          <CardGradient 
            variant="primary"
            intensity="subtle"
            direction="bottom-left"
          />
          
          <CardContent className="pt-6">
            <TradeFormNew 
              mode="new"
              userId={userId}
              onSubmitting={setIsSubmitting}
              onSuccess={() => {
                toast({
                  title: "Trade saved successfully",
                  description: "Your trade has been recorded and added to your journal.",
                });
                setLocation("/history");
              }}
              onError={(error) => {
                toast({
                  variant: "destructive",
                  title: "Failed to save trade",
                  description: error instanceof Error ? error.message : "An error occurred",
                });
                setIsSubmitting(false);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
