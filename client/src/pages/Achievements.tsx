import { lazy, Suspense, useState, useEffect } from "react";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "@/components/icons/icons";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AppSettings } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useUserDataQuery } from "@/hooks/use-user-data-query";

// Lazy load the component
const AchievementsTab = lazy(() => 
  import("@/components/settings/AchievementsTab").then(mod => ({ default: mod.AchievementsTab }))
);

export default function AchievementsPage() {
  const { userData: cachedUserData, isLoading } = useUserDataQuery();
  const { userId } = useAuth();
  const [showNotifications, setShowNotifications] = useState(true);
  
  // Fetch user settings to get achievement notification preference
  const { data: userData } = useQuery({
    queryKey: [`/users/${userId}`],
    queryFn: async () => {
      if (!userId) return null;
      
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        throw new Error("User not found");
      }
    },
    enabled: !!userId,
  });
  
  // Initialize showNotifications from user settings
  useEffect(() => {
    if (userData?.settings) {
      const userSettings = userData.settings as AppSettings;
      if (userSettings.showAchievements !== undefined) {
        setShowNotifications(userSettings.showAchievements);
      }
    }
  }, [userData]);
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Icons.achievement.trophy className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Achievements Unlocked Yet</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        Complete trades and meet performance targets to unlock achievements.
      </p>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/90 via-primary to-primary/80 bg-clip-text text-transparent">
          Trading Achievements
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Track your trading milestones and performance achievements
        </p>
      </div>
      
      {/* Main content */}
      {isLoading ? (
        <div style={{ height: 400 }}>
          {/* Loading container without skeleton */}
        </div>
      ) : (
        <div className="space-y-8">
          <Suspense fallback={<div style={{ height: 400 }}></div>}>
            <AchievementsTab
              showNotifications={showNotifications}
              onToggleNotifications={setShowNotifications}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}