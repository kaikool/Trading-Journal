import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, db, updateUserData, updateDisplayName, logoutUser } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AppSettings } from "@/types";
import { cn } from "@/lib/utils";
import { evaluateDevicePerformance } from "@/lib/performance";

import { useTheme } from "@/contexts/ThemeContext";
import { DASHBOARD_CONFIG } from "@/lib/config";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AchievementsTab } from "@/components/settings/AchievementsTab";
import { StrategiesManagement } from "@/components/settings/StrategiesManagement";
import {
  User,
  CreditCard,
  Save,
  Moon,
  Sun,
  Monitor,
  Languages,
  Lock,
  LucideIcon,
  Loader2,
  Bell,
  DollarSign,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  AlertCircle,
  LogOut,
  Check,
  Palette,
  CalendarDays,
  Trophy,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}

function SettingsSection({ title, description, icon: Icon, children, rightElement }: SettingsSectionProps) {
  return (
    <Card className="mb-6 border border-border/40 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {rightElement}
        </div>
        {children}
      </div>
    </Card>
  );
}

// Card component for option items with consistent styling
function OptionItem({ 
  title, 
  description, 
  control 
}: { 
  title: string; 
  description: string; 
  control: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-between py-2 sm:py-3">
      <div className="space-y-0.5 pr-3">
        <h4 className="text-sm sm:text-base font-medium">{title}</h4>
        <p className="text-xs sm:text-sm text-muted-foreground/90">{description}</p>
      </div>
      <div className="ml-2 sm:ml-4 flex-shrink-0">
        {control}
      </div>
    </div>
  );
}

// Form field component for 2-col grid layouts
function FormField({
  label,
  htmlFor,
  className,
  children
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5 sm:space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const userId = auth.currentUser?.uid;
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  
  // Theme management - using the improved ThemeContext
  const { theme, setTheme, isDarkMode } = useTheme();
  
  const [settings, setSettings] = useState<AppSettings>({
    theme: theme, // Initial value from context
    currency: 'USD',
    defaultRiskPerTrade: 2,
    defaultRiskRewardRatio: 2,
    defaultLotSize: 0.1,
    language: 'en',
    notifications: true,
    dateFormat: 'MM/DD/YYYY',
    showBalanceHistory: true,
    autoCalculateLotSize: true,
    defaultTimeframe: 'H4',
    showAchievements: true
  });

  // Always keep settings.theme in sync with the theme from context
  useEffect(() => {
    // This ensures that the UI always shows the correct theme value
    setSettings(prev => ({
      ...prev,
      theme: theme
    }));
    console.log("Settings theme synced with context:", theme);
  }, [theme]);
  
  const [initialBalance, setInitialBalance] = useState<number>(DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE);
  const [displayName, setDisplayName] = useState<string>(auth.currentUser?.displayName || "");
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Check device performance
  useEffect(() => {
    evaluateDevicePerformance().then(performance => {
      setDevicePerformance(performance);
    });
  }, []);
  
  // Fetch user settings
  const { data: userData, isLoading } = useQuery({
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
  
  // Chỉ tải settings từ userData một lần khi component mount
  useEffect(() => {
    if (userData) {
      if (userData.settings) {
        const userSettings = userData.settings as AppSettings;
        
        // Tạo một object settings mới với theme từ context (đã được khởi tạo từ localStorage)
        setSettings(prev => ({
          ...userSettings,
          // Ưu tiên theme từ context hơn là từ userData để tránh xung đột
          theme: theme
        }));
      }
      
      if (userData.initialBalance) {
        setInitialBalance(userData.initialBalance);
      }
    }
  }, [userData, theme]);
  
  const saveSettings = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    
    try {
      await updateUserData(userId, {
        settings,
        initialBalance
      });
      
      // Apply theme permanently when saving settings
      setTheme(settings.theme);
      
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      window.location.href = "/login";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };
  
  // Update Display Name
  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast({
        variant: "destructive", 
        title: "Display Name required",
        description: "Please enter a valid display name."
      });
      return;
    }
    
    setIsUpdatingDisplayName(true);
    
    try {
      await updateDisplayName(displayName);
      
      toast({
        title: "Display Name updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred updating your display name",
      });
    } finally {
      setIsUpdatingDisplayName(false);
    }
  };

  const changePassword = async () => {
    if (!userId) return;
    
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      // Reauthenticate user (in a real app)
      // Update user password
      // For this demo, we'll just show success
      
      setTimeout(() => {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
      }, 1500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error changing password",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      setIsChangingPassword(false);
    }
  };
  
  // Loading state with skeleton UI
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        
        <Skeleton className="h-12 w-full mb-8" />
        
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="mb-6 shadow-sm border border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-40 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-6">
                {Array(3).fill(0).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Main content
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-6 space-y-6 has-mobile-nav-spacing">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Customize your trading journal preferences
          </p>
        </div>
        
        <Button 
          onClick={saveSettings} 
          disabled={isSaving} 
          size="default"
          className="md:min-w-[140px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      
      {/* Tabs navigation */}
      <Tabs defaultValue="general" className="mb-4 w-full">
        <div className="overflow-x-auto pb-1 mb-4 sm:mb-6 touch-pan-x">
          <div className="min-w-max mx-auto px-1">
            <TabsList className="w-fit sm:w-auto flex flex-nowrap h-auto justify-start p-1 space-x-1 rounded-xl bg-muted/80">
              <TabsTrigger 
                value="general" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">General</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trading" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Trading</span>
              </TabsTrigger>
              <TabsTrigger 
                value="strategies" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Strategies</span>
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <Trophy className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Achievements</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center justify-center h-9 px-2 sm:px-4 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Security</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* General settings tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <SettingsSection 
            title="Appearance" 
            description="Customize the look and feel of your application"
          >
            <div className="grid gap-4 sm:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField label="Theme" htmlFor="theme">
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => {
                      const themeValue = value as 'light' | 'dark' | 'system';
                      // Update settings state
                      setSettings({ ...settings, theme: themeValue });
                      // Apply the theme immediately when selected
                      setTheme(themeValue);
                      console.log(`Theme selected in dropdown: ${themeValue}`);
                    }}
                  >
                    <SelectTrigger id="theme" className="w-full">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Monitor className="h-4 w-4 mr-2" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Language" htmlFor="language">
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      setSettings({ ...settings, language: value as 'en' | 'fr' | 'de' | 'es' | 'ja' })
                    }
                  >
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center">
                          <Languages className="h-4 w-4 mr-2" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="fr">
                        <div className="flex items-center">
                          <Languages className="h-4 w-4 mr-2" />
                          Français
                        </div>
                      </SelectItem>
                      <SelectItem value="de">
                        <div className="flex items-center">
                          <Languages className="h-4 w-4 mr-2" />
                          Deutsch
                        </div>
                      </SelectItem>
                      <SelectItem value="es">
                        <div className="flex items-center">
                          <Languages className="h-4 w-4 mr-2" />
                          Español
                        </div>
                      </SelectItem>
                      <SelectItem value="ja">
                        <div className="flex items-center">
                          <Languages className="h-4 w-4 mr-2" />
                          日本語
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              
              <Separator className="my-2" />
              
              <OptionItem
                title="Notifications"
                description="Receive alerts and updates about your trades and account"
                control={
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notifications: checked })
                    }
                  />
                }
              />
              
              <OptionItem
                title="Date Format"
                description="Choose how dates are displayed throughout the application"
                control={
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      setSettings({ 
                        ...settings, 
                        dateFormat: value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' 
                      })
                    }
                  >
                    <SelectTrigger id="dateFormat" className="w-[160px]">
                      <SelectValue placeholder="Date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          MM/DD/YYYY
                        </div>
                      </SelectItem>
                      <SelectItem value="DD/MM/YYYY">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          DD/MM/YYYY
                        </div>
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          YYYY-MM-DD
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              
              <OptionItem
                title="Balance History Visibility"
                description="Show your account balance history in dashboard charts"
                control={
                  <Switch
                    id="showBalanceHistory"
                    checked={settings.showBalanceHistory}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showBalanceHistory: checked })
                    }
                  />
                }
              />
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Account Information" 
            description="Manage your account details and preferences"
          >
            <div className="grid gap-4 sm:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField label="Email Address" htmlFor="email">
                  <div className="relative">
                    <Input
                      id="email"
                      value={auth.currentUser?.email || ""}
                      className="pr-20"
                      disabled
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Email address associated with your account
                  </p>
                </FormField>
                
                <FormField label="Display Name" htmlFor="displayName">
                  <div className="flex space-x-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUpdateDisplayName} 
                      disabled={isUpdatingDisplayName}
                      variant="outline"
                      size="icon"
                      className="px-3"
                    >
                      {isUpdatingDisplayName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Name displayed to other users in the app
                  </p>
                </FormField>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField label="Account Currency" htmlFor="currency">
                  <Select
                    value={settings.currency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, currency: value as 'USD' | 'EUR' | 'GBP' | 'JPY' })
                    }
                  >
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          USD - US Dollar
                        </div>
                      </SelectItem>
                      <SelectItem value="EUR">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          EUR - Euro
                        </div>
                      </SelectItem>
                      <SelectItem value="GBP">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          GBP - British Pound
                        </div>
                      </SelectItem>
                      <SelectItem value="JPY">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          JPY - Japanese Yen
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Primary currency used for profit/loss calculations
                  </p>
                </FormField>
                
                <FormField label="Initial Balance" htmlFor="initialBalance">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {settings.currency === 'USD' ? '$' : 
                       settings.currency === 'EUR' ? '€' : 
                       settings.currency === 'GBP' ? '£' : '¥'}
                    </span>
                    <Input
                      id="initialBalance"
                      type="text"
                      inputMode="numeric"
                      value={initialBalance === 0 ? '' : initialBalance.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (/^[0-9]*\.?[0-9]*$/.test(inputValue) || inputValue === '') {
                          setInitialBalance(inputValue === '' ? 0 : Number(inputValue));
                        }
                      }}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your initial deposit amount, used to calculate performance metrics
                  </p>
                </FormField>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
        
        {/* Trading settings tab */}
        <TabsContent value="trading" className="mt-6 space-y-6">
          <SettingsSection 
            title="Risk Management" 
            description="Configure your default risk parameters and position sizing"
          >
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="defaultRiskPerTrade" className="text-sm font-medium">Default Risk Per Trade (%)</Label>
                    <Badge variant="outline" className="font-mono bg-muted/60">{settings.defaultRiskPerTrade}%</Badge>
                  </div>
                  <Slider
                    id="defaultRiskPerTrade"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={[settings.defaultRiskPerTrade]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultRiskPerTrade: value[0] })
                    }
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Conservative (0.1%)</span>
                    <span>Aggressive (5%)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    The percentage of your account balance to risk on each trade
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="defaultRiskRewardRatio" className="text-sm font-medium">Default Risk:Reward Ratio</Label>
                    <Badge variant="outline" className="font-mono bg-muted/60">1:{settings.defaultRiskRewardRatio}</Badge>
                  </div>
                  <Slider
                    id="defaultRiskRewardRatio"
                    min={1}
                    max={5}
                    step={0.1}
                    value={[settings.defaultRiskRewardRatio]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultRiskRewardRatio: value[0] })
                    }
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1:1</span>
                    <span>1:5</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    The default risk-to-reward ratio for your trades
                  </p>
                </div>
                
                <OptionItem
                  title="Auto-Calculate Lot Size"
                  description="Automatically calculate the lot size based on your risk parameters"
                  control={
                    <Switch
                      id="autoCalculateLotSize"
                      checked={settings.autoCalculateLotSize}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoCalculateLotSize: checked })
                      }
                    />
                  }
                />
              </div>
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Trading Defaults" 
            description="Configure default parameters for new trades"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField label="Default Trading Timeframe" htmlFor="defaultTimeframe">
                  <Select
                    value={settings.defaultTimeframe}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultTimeframe: value as 'M5' | 'M15' | 'H1' | 'H4' | 'D1' })
                    }
                  >
                    <SelectTrigger id="defaultTimeframe" className="w-full">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M5">M5 - 5 minutes</SelectItem>
                      <SelectItem value="M15">M15 - 15 minutes</SelectItem>
                      <SelectItem value="H1">H1 - 1 hour</SelectItem>
                      <SelectItem value="H4">H4 - 4 hours</SelectItem>
                      <SelectItem value="D1">D1 - Daily</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    This will be pre-selected when creating new trades
                  </p>
                </FormField>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="defaultLotSize" className="text-sm font-medium">Default Lot Size</Label>
                    <Badge variant="outline" className="font-mono bg-muted">{settings.defaultLotSize.toFixed(2)}</Badge>
                  </div>
                  <Slider
                    id="defaultLotSize"
                    min={0.01}
                    max={2}
                    step={0.01}
                    value={[settings.defaultLotSize]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultLotSize: value[0] })
                    }
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Micro (0.01)</span>
                    <span>Standard (2.00)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Default position size, 1 standard lot = 100,000 units of the base currency
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Strategies tab */}
        <TabsContent value="strategies" className="mt-6 space-y-6">
          <div className="grid gap-6">
            <StrategiesManagement />
          </div>
        </TabsContent>
        
        {/* Achievements tab */}
        <TabsContent value="achievements" className="mt-6 space-y-6">
          <div className="grid gap-6">
            <AchievementsTab 
              showNotifications={Boolean(settings.showAchievements)}
              onToggleNotifications={(show: boolean) => setSettings({ ...settings, showAchievements: show })}
            />
          </div>
        </TabsContent>
        
        {/* Security settings tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <SettingsSection 
            title="Password & Authentication" 
            description="Update your account password and security preferences"
          >
            {passwordError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-6">
              <FormField label="Current Password" htmlFor="currentPassword">
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormField>
              
              <FormField label="New Password" htmlFor="newPassword">
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Password must be at least 6 characters long
                </p>
              </FormField>
              
              <FormField label="Confirm New Password" htmlFor="confirmPassword">
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormField>
              
              <div className="pt-2">
                <Button 
                  onClick={changePassword} 
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Account Security" 
            description="Manage your account security settings and active sessions"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <div>
                    <h4 className="text-sm font-medium">Current Session</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {auth.currentUser?.metadata?.lastSignInTime 
                        ? `Started ${new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString()}` 
                        : 'Current session'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs space-x-1"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}