import { lazy, Suspense, useState } from "react";
import { LoadingFallback } from "@/components/dynamic/LoadingFallback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Trophy } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AppSettings } from "@/types";

// Lazy load the component
const AchievementsTab = lazy(() => 
  import("@/components/settings/AchievementsTab").then(mod => ({ default: mod.AchievementsTab }))
);

export default function AchievementsPage() {
  const userId = auth.currentUser?.uid;
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
  useState(() => {
    if (userData?.settings) {
      const userSettings = userData.settings as AppSettings;
      if (userSettings.showAchievements !== undefined) {
        setShowNotifications(userSettings.showAchievements);
      }
    }
  });
  
  return (
    <div className="container py-6 max-w-6xl">
      <PageHeader
        title="Trading Achievements"
        description="Track your trading milestones and achievements"
        icon={<Trophy className="h-6 w-6" />}
      />
      
      <div className="mt-8 space-y-8">
        <Suspense fallback={<LoadingFallback height={400} />}>
          <AchievementsTab
            showNotifications={showNotifications}
            onToggleNotifications={setShowNotifications}
          />
        </Suspense>
      </div>
    </div>
  );
}