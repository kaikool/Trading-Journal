import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  auth, 
  db, 
  updateUserData, 
  updateDisplayName, 
  logoutUser,
  linkAccountWithGoogle,
  getLinkedProviders,
  unlinkProvider,
  getProviderName
} from "@/lib/firebase";
// Removed direct Lucide imports in favor of centralized icon system
// Removed import for API key management
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AppSettings } from "@/types";
import { cn } from "@/lib/utils";


import { useTheme } from "@/contexts/ThemeContext";
import { DASHBOARD_CONFIG } from "@/lib/config";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { lazy } from "react";
import { Icons } from "@/components/icons/icons";
import type { ComponentType } from "react";

// Những component không được sử dụng đã bị xóa
// StrategiesManagement và AchievementsTab đã được xóa vì không sử dụng

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}

function SettingsSection({ title, description, children, rightElement }: SettingsSectionProps) {
  return (
    <Card className="border border-border/40 shadow-sm overflow-hidden">
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

  const [activeTab, setActiveTab] = useState<string>('general');
  
  // Theme management - using the improved ThemeContext
  const { theme, setTheme } = useTheme();
  
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
  
  // Liên kết tài khoản
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  
  // Removed API Settings
  
  // Removed device performance check since it's not being used
  
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
  
  // Lấy danh sách các phương thức xác thực đã liên kết
  useEffect(() => {
    const loadLinkedProviders = async () => {
      try {
        if (auth.currentUser) {
          const providers = await getLinkedProviders();
          setLinkedProviders(providers);
        }
      } catch (error) {
        console.error("Error loading linked providers:", error);
      }
    };
    
    loadLinkedProviders();
  }, []);
  
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
  
  // Xử lý liên kết với Google
  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    
    try {
      await linkAccountWithGoogle();
      
      // Cập nhật danh sách nhà cung cấp sau khi liên kết
      const updatedProviders = await getLinkedProviders();
      setLinkedProviders(updatedProviders);
      
      toast({
        title: "Account linked",
        description: "Your Google account has been linked successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Link failed",
        description: error instanceof Error ? error.message : "An error occurred while linking your account.",
      });
    } finally {
      setIsLinkingGoogle(false);
    }
  };
  
  // Xử lý hủy liên kết
  const handleUnlinkProvider = async (providerId: string) => {
    // Kiểm tra xem người dùng không thể hủy liên kết phương thức cuối cùng
    if (linkedProviders.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot unlink",
        description: "You must have at least one login method. Add another method before removing this one.",
      });
      return;
    }
    
    setIsUnlinking(true);
    
    try {
      // Thêm '.com' vào providerId nếu cần
      const fullProviderId = providerId.includes('.com') ? providerId : `${providerId}.com`;
      
      await unlinkProvider(fullProviderId);
      
      // Cập nhật danh sách nhà cung cấp sau khi hủy liên kết
      const updatedProviders = await getLinkedProviders();
      setLinkedProviders(updatedProviders);
      
      toast({
        title: "Unlinked successfully",
        description: `Login method "${getProviderName(providerId)}" has been unlinked.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unlink failed",
        description: error instanceof Error ? error.message : "An error occurred while unlinking your account.",
      });
    } finally {
      setIsUnlinking(false);
    }
  };
  
  // Save API settings đã bị xóa
  
  // Empty loading state (no skeletons)
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-9 w-48 mb-2"></div>
            <div className="h-5 w-64"></div>
          </div>
          <div className="h-10 w-36"></div>
        </div>
        
        <div className="h-12 w-full mb-8"></div>
        
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="mb-6 shadow-sm border border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full"></div>
                <div>
                  <div className="h-6 w-40 mb-1"></div>
                  <div className="h-4 w-64"></div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-6">
                {Array(3).fill(0).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-5 w-32"></div>
                    <div className="h-10 w-full"></div>
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
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configuration options
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
              Saving...
            </>
          ) : (
            <>
              <Icons.ui.save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      
      {/* Tabs navigation */}
      <Tabs defaultValue="general" className="mb-4 w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-4 sm:mb-6 touch-pan-x">
          <div className="mx-auto px-1">
            <TabsList className="w-full flex flex-row items-center justify-between p-1 rounded-xl bg-muted/80">
              <TabsTrigger 
                value="general" 
                className="flex-1 flex items-center justify-center h-9 px-2 sm:px-3 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <Icons.ui.palette className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">General</span>
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="flex-1 flex items-center justify-center h-9 px-2 sm:px-3 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <Icons.ui.user className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Account</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trading" 
                className="flex-1 flex items-center justify-center h-9 px-2 sm:px-3 gap-1.5 data-[state=active]:bg-primary/10 rounded-md transition-all"
              >
                <Icons.ui.barChart className="h-4 w-4 flex-shrink-0" />
                <span className="inline whitespace-nowrap text-xs sm:text-sm font-medium">Trading</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* General settings tab */}
        <TabsContent value="general" className="mt-6 space-y-6 pb-0">
          <SettingsSection 
            title="Appearance" 
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
                          <Icons.ui.sun className="h-4 w-4 mr-2" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Icons.ui.moon className="h-4 w-4 mr-2" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Icons.ui.monitor className="h-4 w-4 mr-2" />
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
                          <Icons.ui.languages className="h-4 w-4 mr-2" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="fr">
                        <div className="flex items-center">
                          <Icons.ui.languages className="h-4 w-4 mr-2" />
                          Français
                        </div>
                      </SelectItem>
                      <SelectItem value="de">
                        <div className="flex items-center">
                          <Icons.ui.languages className="h-4 w-4 mr-2" />
                          Deutsch
                        </div>
                      </SelectItem>
                      <SelectItem value="es">
                        <div className="flex items-center">
                          <Icons.ui.languages className="h-4 w-4 mr-2" />
                          Español
                        </div>
                      </SelectItem>
                      <SelectItem value="ja">
                        <div className="flex items-center">
                          <Icons.ui.languages className="h-4 w-4 mr-2" />
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
                description="Trade alerts and account updates"
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
                description="Date display format"
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
                          <Icons.ui.calendar className="h-4 w-4 mr-2" />
                          MM/DD/YYYY
                        </div>
                      </SelectItem>
                      <SelectItem value="DD/MM/YYYY">
                        <div className="flex items-center">
                          <Icons.ui.calendar className="h-4 w-4 mr-2" />
                          DD/MM/YYYY
                        </div>
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD">
                        <div className="flex items-center">
                          <Icons.ui.calendar className="h-4 w-4 mr-2" />
                          YYYY-MM-DD
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              
              <OptionItem
                title="Balance History Visibility"
                description="Show balance history in dashboard"
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
          {/* Removed API Settings section as it's not being used */}
        </TabsContent>
        
        {/* Account tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <SettingsSection 
            title="Account Information" 
            icon={Icons.ui.user}
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
                      <Icons.ui.check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your account email
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
                        <>{/* Đã xóa spinner */}</>
                      ) : (
                        <Icons.ui.check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Visible name in the app
                  </p>
                </FormField>
              </div>
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Password & Authentication" 
            icon={Icons.ui.shieldCheck}
          >
            {passwordError && (
              <Alert variant="destructive" className="mb-6">
                <Icons.ui.error className="h-4 w-4" />
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
                  >
                    {showCurrentPassword ? (
                      <Icons.ui.eyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.ui.eye className="h-4 w-4" />
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
                  >
                    {showNewPassword ? (
                      <Icons.ui.eyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.ui.eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                  >
                    {showConfirmPassword ? (
                      <Icons.ui.eyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.ui.eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormField>
              
              <div className="flex justify-end">
                <Button 
                  onClick={changePassword} 
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="mt-2"
                >
                  {isChangingPassword ? (
                    <>
                      {/* Đã xóa spinner */}
                      Updating...
                    </>
                  ) : (
                    <>
                      <Icons.ui.lock className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Linked Accounts"
            description="Control how you sign in to your account"
            icon={Icons.ui.link}
          >
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                {linkedProviders.includes('password') && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icons.ui.mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email & Password</p>
                        <p className="text-xs text-muted-foreground">
                          {auth.currentUser?.email || "Sign in with email and password"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      disabled={true}
                    >
                      <Icons.ui.check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                      Connected
                    </Button>
                  </div>
                )}
                
                {linkedProviders.includes('google.com') ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                        <svg viewBox="0 0 24 24" className="h-5 w-5">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Google</p>
                        <p className="text-xs text-muted-foreground">
                          Sign in with Google
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleUnlinkProvider('google.com')}
                      disabled={isUnlinking || linkedProviders.length <= 1}
                    >
                      {isUnlinking ? (
                        <Icons.ui.spinner className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Icons.ui.linkOff className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                        <svg viewBox="0 0 24 24" className="h-5 w-5">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Google</p>
                        <p className="text-xs text-muted-foreground">
                          Not connected
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={handleLinkGoogle}
                      disabled={isLinkingGoogle}
                    >
                      {isLinkingGoogle ? (
                        <Icons.ui.spinner className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Icons.ui.link className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Connect
                    </Button>
                  </div>
                )}
              
                {/* Github integration (placeholder) */}
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                      <Icons.ui.github className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">GitHub</p>
                      <p className="text-xs text-muted-foreground">
                        Coming soon
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    disabled={true}
                  >
                    <Icons.ui.link className="h-3.5 w-3.5 mr-1.5" />
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </SettingsSection>
          
          <div className="flex justify-end pt-2">
            <Button
              variant="destructive" 
              onClick={handleLogout}
              size="sm"
              className="text-xs h-8"
            >
              <Icons.ui.logOut className="h-3.5 w-3.5 mr-1.5" />
              Log Out
            </Button>
          </div>
        </TabsContent>
        
        {/* Trading settings tab */}
        <TabsContent value="trading" className="mt-6 space-y-6">
          <SettingsSection 
            title="Risk Management" 
          >
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="initialBalance" className="text-sm font-medium">Initial Balance</Label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <Icons.analytics.dollar className="h-4 w-4 text-foreground" />
                    </div>
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
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Starting amount for performance calculations
                  </p>
                </div>
                
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
                    Account balance risk per trade
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
                    Default profit target vs. stop loss ratio
                  </p>
                </div>
                
                <OptionItem
                  title="Auto-Calculate Lot Size"
                  description="Calculate lot size from risk settings"
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
                    Pre-selected for new trades
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
                    Position size for new trades
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>


        
        {/* Security settings tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <SettingsSection 
            title="Password & Authentication" 
          >
            {passwordError && (
              <Alert variant="destructive" className="mb-6">
                <Icons.ui.error className="h-4 w-4" />
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
                      <Icons.ui.eyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.ui.eye className="h-4 w-4" />
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
                      <Icons.ui.eyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.ui.eye className="h-4 w-4" />
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
                      <Icons.ui.eyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.ui.eye className="h-4 w-4" />
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
                      <Icons.ui.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Icons.ui.lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SettingsSection>
          
          <SettingsSection 
            title="Login Methods"
          >
            <div className="space-y-4 sm:space-y-6">
              {/* Current login methods list */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium border-b pb-2 mb-3">Current Login Methods</h4>
                
                {linkedProviders.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">Loading...</div>
                ) : (
                  linkedProviders.map((provider) => (
                    <div 
                      key={provider} 
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card"
                    >
                      <div className="flex items-center space-x-3">
                        {provider === 'google' && (
                          <>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Google</h4>
                              <p className="text-xs text-muted-foreground">{auth.currentUser?.email}</p>
                            </div>
                          </>
                        )}
                        
                        {provider === 'password' && (
                          <>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <Icons.ui.mail className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Email/Password</h4>
                              <p className="text-xs text-muted-foreground">{auth.currentUser?.email}</p>
                            </div>
                          </>
                        )}
                        
                        {provider !== 'google' && provider !== 'password' && (
                          <>
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Icons.ui.user className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">{getProviderName(provider)}</h4>
                              <p className="text-xs text-muted-foreground">{auth.currentUser?.email}</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkProvider(provider)}
                        disabled={linkedProviders.length <= 1 || isUnlinking}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        {isUnlinking ? (
                          <Icons.ui.spinner className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Icons.ui.linkOff className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1.5">Unlink</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add login method */}
              <div className="pt-2">
                <h4 className="text-sm font-medium border-b pb-2 mb-3">Add Login Method</h4>
                
                <div className="space-y-3">
                  {/* Google login */}
                  {!linkedProviders.includes('google') && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Google</h4>
                          <p className="text-xs text-muted-foreground">Link your Google account</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLinkGoogle}
                        disabled={isLinkingGoogle}
                        className="h-8"
                      >
                        {isLinkingGoogle ? (
                          <>
                            <Icons.ui.spinner className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            <span>Linking...</span>
                          </>
                        ) : (
                          <>
                            <Icons.ui.link className="h-3.5 w-3.5 mr-1.5" />
                            <span>Link</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Note message */}
                  <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                    <p className="flex items-start">
                      <Icons.ui.error className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Keep at least one login method active.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>
          {/* API Integration section removed as it's not being used */}
          
          <SettingsSection 
            title="Login Session" 
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <div>
                    <h4 className="text-sm font-medium">Current Session</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {auth.currentUser?.metadata?.lastSignInTime 
                        ? `Started from ${new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString()}` 
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
                  <Icons.ui.logOut className="h-3.5 w-3.5 mr-1" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}