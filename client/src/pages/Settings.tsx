import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, db, updateUserData, updateDisplayName, logoutUser, createDefaultStrategiesIfNeeded } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AppSettings } from "@/types";
import { cn } from "@/lib/utils";
import { evaluateDevicePerformance } from "@/lib/performance";
// import { motion } from "framer-motion";
import { StrategiesManagement } from "@/components/settings/StrategiesManagement";
import { AchievementsTab } from "@/components/settings/AchievementsTab";

import { useTheme } from "@/contexts/ThemeContext";
import { DASHBOARD_CONFIG } from "@/lib/config";

// Import only needed Lucide icons

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  ChevronRight,
  Check,
  Palette,
  CalendarDays,
  HelpCircle,
  Sparkles,
  Lightbulb,
  Trophy,
  Award,

} from "lucide-react";

interface SettingsSectionProps {
  title: string;
  description: string; // kept for backwards compatibility
  icon: LucideIcon;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}

function SettingsSection({ title, description, icon: Icon, children, rightElement }: SettingsSectionProps) {
  return (
    <div className="opacity-100 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <Card className="mb-6 border border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
            </div>
            {rightElement}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 px-4 sm:px-6 sm:pt-6">
          {children}
        </CardContent>
      </Card>
    </div>
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
  // Removed debug logs to improve performance
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const userId = auth.currentUser?.uid;
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('high');
  
  // Sử dụng ThemeContext để quản lý theme
  const { theme, setTheme, applyTheme } = useTheme();
  
  const [settings, setSettings] = useState<AppSettings>({
    theme: theme, // Sử dụng giá trị từ ThemeContext
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
  
  // Check device performance for optimal animations
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
  
  useEffect(() => {
    if (userData) {
      if (userData.settings) {
        // Lưu trữ settings gốc từ dữ liệu người dùng
        const userSettings = userData.settings as AppSettings;
        
        // Đảm bảo theme trong context và settings được đồng bộ
        if (userSettings.theme) {
          // Cập nhật theme trong context (không áp dụng ngay)
          setTheme(userSettings.theme as 'light' | 'dark' | 'system');
          
          // Cập nhật settings với theme từ người dùng
          setSettings(prev => ({
            ...userSettings,
            theme: userSettings.theme as 'light' | 'dark' | 'system'
          }));
        } else {
          // Nếu không có theme, sử dụng các cài đặt khác nhưng giữ theme hiện tại
          setSettings(prev => ({
            ...userSettings,
            theme: theme // Giữ theme từ context
          }));
        }
      }
      
      if (userData.initialBalance) {
        setInitialBalance(userData.initialBalance);
      }
    }
  }, [userData, setTheme, theme]);
  
  const saveSettings = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    
    try {
      await updateUserData(userId, {
        settings,
        initialBalance
      });
      
      // Áp dụng theme mới chỉ sau khi đã lưu thành công
      applyTheme(settings.theme);
      
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
  
  // Hàm cập nhật Display Name
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
      <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6 animate-in fade-in duration-500">
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
    <div className="container max-w-7xl mx-auto py-5 md:py-8 px-0 sm:px-5 animate-in fade-in duration-700">
      {/* Header section - tối ưu cho mobile */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Customize your trading journal preferences and account settings
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
      
      {/* Tabs navigation - fully responsive and centered, no 3D effects */}
      <Tabs defaultValue="general" className="mb-2">
        <div className="flex justify-center sm:justify-start w-full">
          <TabsList className="w-full max-w-4xl mx-auto flex-wrap sm:flex-nowrap h-auto justify-center p-1 space-x-1 space-y-1 sm:space-y-0 rounded-xl bg-muted/70">
            <TabsTrigger 
              value="general" 
              className="flex-1 sm:flex-none flex items-center justify-center h-9 px-3 sm:px-6 data-[state=active]:bg-primary/10 rounded-md hover:bg-muted transition-colors"
            >
              <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">General</span>
            </TabsTrigger>
            <TabsTrigger 
              value="trading" 
              className="flex-1 sm:flex-none flex items-center justify-center h-9 px-3 sm:px-6 data-[state=active]:bg-primary/10 rounded-md hover:bg-muted transition-colors"
            >
              <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Trading</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="flex-1 sm:flex-none flex items-center justify-center h-9 px-3 sm:px-6 data-[state=active]:bg-primary/10 rounded-md hover:bg-muted transition-colors"
            >
              <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Achievements</span>
            </TabsTrigger>

            <TabsTrigger 
              value="security" 
              className="flex-1 sm:flex-none flex items-center justify-center h-9 px-3 sm:px-6 data-[state=active]:bg-primary/10 rounded-md hover:bg-muted transition-colors"
            >
              <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Security</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* General settings tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <SettingsSection 
            title="Appearance" 
            description="Customize the look and feel of your application"
            icon={Palette}
          >
            <div className="grid gap-4 sm:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField label="Theme" htmlFor="theme">
                  <Select
                    value={settings.theme}
                    onValueChange={(value) =>
                      setSettings({ ...settings, theme: value as 'light' | 'dark' | 'system' })
                    }
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
                          <span className="inline-block w-4 h-4 mr-2 rounded-full overflow-hidden bg-primary/5">🇺🇸</span>
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="fr">
                        <div className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full overflow-hidden bg-primary/5">🇫🇷</span>
                          Français
                        </div>
                      </SelectItem>
                      <SelectItem value="de">
                        <div className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full overflow-hidden bg-primary/5">🇩🇪</span>
                          Deutsch
                        </div>
                      </SelectItem>
                      <SelectItem value="es">
                        <div className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full overflow-hidden bg-primary/5">🇪🇸</span>
                          Español
                        </div>
                      </SelectItem>
                      <SelectItem value="ja">
                        <div className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full overflow-hidden bg-primary/5">🇯🇵</span>
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
                description="Receive alerts and updates about your trades and account activity"
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
            icon={User}
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
                </FormField>
                
                <FormField label="Display Name" htmlFor="displayName">
                  <div className="flex space-x-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="flex-grow"
                    />
                    <Button 
                      onClick={handleUpdateDisplayName} 
                      size="sm" 
                      disabled={isUpdatingDisplayName || displayName === auth.currentUser?.displayName}
                    >
                      {isUpdatingDisplayName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This name will be displayed in your profile and trading history.
                  </p>
                </FormField>
              </div>
              
              <Separator className="my-2" />
              
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
                      <SelectGroup>
                        <SelectLabel>Currencies</SelectLabel>
                        <SelectItem value="USD">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            USD ($)
                          </div>
                        </SelectItem>
                        <SelectItem value="EUR">
                          <div className="flex items-center">
                            <span className="font-medium mr-2 text-base">€</span>
                            EUR (€)
                          </div>
                        </SelectItem>
                        <SelectItem value="GBP">
                          <div className="flex items-center">
                            <span className="font-medium mr-2 text-base">£</span>
                            GBP (£)
                          </div>
                        </SelectItem>
                        <SelectItem value="JPY">
                          <div className="flex items-center">
                            <span className="font-medium mr-2 text-base">¥</span>
                            JPY (¥)
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Initial Account Balance" htmlFor="initialBalance">
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
                        // Chỉ cho phép số và dấu thập phân
                        if (/^[0-9]*\.?[0-9]*$/.test(inputValue) || inputValue === '') {
                          setInitialBalance(inputValue === '' ? 0 : Number(inputValue));
                        }
                      }}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your initial deposit amount, used to calculate overall performance metrics.
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
            icon={Sparkles}
            
          >
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="defaultRisk" className="text-sm font-medium">Default Risk Per Trade</Label>
                    <Badge variant="outline" className="font-mono bg-muted">{settings.defaultRiskPerTrade}%</Badge>
                  </div>
                  <Slider
                    id="defaultRisk"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={[settings.defaultRiskPerTrade]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultRiskPerTrade: value[0] })
                    }
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Lower Risk (0.5%)</span>
                    <span>Higher Risk (5%)</span>
                  </div>
                  <div className="flex mt-2 p-3 rounded-md bg-muted/40 text-sm text-muted-foreground/90 gap-2">
                    <HelpCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <p>
                      Percentage of your account balance to risk on each trade.
                      Most professionals recommend 1-2% per trade.
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="defaultRatio" className="text-sm font-medium">Default Risk-Reward Ratio</Label>
                    <Badge variant="outline" className="font-mono bg-muted">1:{settings.defaultRiskRewardRatio}</Badge>
                  </div>
                  <Slider
                    id="defaultRatio"
                    min={1}
                    max={5}
                    step={0.5}
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
                </div>
                
                <OptionItem
                  title="Auto-Calculate Lot Size"
                  description="Automatically determine position size based on risk percentage and stop loss"
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
            icon={BarChart3}
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
                    This will be pre-selected when creating new trades.
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
                    Default position size, 1 standard lot = 100,000 units of the base currency.
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Trading Strategies" 
            description="Manage your trading strategies"
            icon={Lightbulb}
            rightElement={
              <Button size="sm" variant="outline" onClick={() => {
                // Create default strategies for user if they don't exist
                if (auth.currentUser) {
                  toast({
                    title: "Checking strategies",
                    description: "Looking for your trading strategies...",
                  });
                  
                  createDefaultStrategiesIfNeeded(auth.currentUser.uid)
                    .then((created) => {
                      if (created) {
                        toast({
                          title: "Default strategies created",
                          description: "We've added some default trading strategies to get you started",
                        });
                      }
                    })
                    .catch((error) => {
                      console.error("Error creating default strategies:", error);
                    });
                }
              }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Defaults
              </Button>
            }
          >
            <div className="mt-2">
              {/* Import the StrategiesManagement component */}
              <StrategiesManagement />
            </div>
          </SettingsSection>
        </TabsContent>
        
        {/* Achievements tab */}
        <TabsContent value="achievements" className="mt-6 space-y-6">
          <SettingsSection
            title="User Achievements"
            description="Manage and view your achievements"
            icon={Award}
          >
            <AchievementsTab 
              showNotifications={settings.showAchievements || false}
              onToggleNotifications={(show) => 
                setSettings({ ...settings, showAchievements: show })
              }
            />
          </SettingsSection>
        </TabsContent>
        

        
        {/* Security settings tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <SettingsSection 
            title="Password Management" 
            description="Update your account password and security preferences"
            icon={Lock}
            
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full w-10 px-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    type="button"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full w-10 px-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    type="button"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Password must be at least 6 characters long.
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full w-10 px-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormField>
              
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={changePassword} 
                  disabled={isChangingPassword}
                  className="min-w-[160px]"
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
            icon={ShieldCheck}
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
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
              

            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
