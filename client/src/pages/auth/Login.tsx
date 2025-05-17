import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loginUser, loginWithGoogle, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/icons/icons";
import { FcGoogle } from "react-icons/fc";
import { AppSkeleton, SkeletonLevel } from "@/components/ui/app-skeleton";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      await loginUser(data.email, data.password);
      toast({
        title: "Login successful",
        description: "Welcome back to FX Trade Journal!",
      });
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error 
          ? error.message 
          : "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Check if user is already logged in and redirect if necessary
  useEffect(() => {
    if (auth.currentUser) {
      setLocation("/");
    }
  }, [setLocation]);

  return (
    <AuthLayout>
      <AuthCard
        title="Sign in to your account"
        description="Enter your credentials to access your dashboard"
        footer={
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 text-primary font-medium" 
              onClick={() => setLocation("/auth/register")}
            >
              Create account
            </Button>
          </p>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              form={form}
              name="email"
              label="Email address"
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              icon={Icons.ui.mail}
            />
            
            <FormInput
              form={form}
              name="password"
              label="Password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              icon={Icons.ui.lock}
            />
            
            <div className="flex justify-end">
              <Button 
                variant="link" 
                className="text-sm p-0 h-auto" 
                type="button"
              >
                Forgot password?
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading}
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </Form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={async () => {
            try {
              setIsLoading(true);
              const result = await loginWithGoogle();
              
              // Lấy thông tin người dùng mới từ kết quả trả về
              const isNewUser = (result as any).isNewUser;
              
              toast({
                title: isNewUser ? "Account created" : "Login successful",
                description: isNewUser 
                  ? "Your account has been created and you are now signed in!" 
                  : "Welcome back to FX Trade Journal!",
              });
              setLocation("/");
            } catch (error) {
              console.error("Google login error:", error);
              toast({
                variant: "destructive",
                title: "Google login failed",
                description: error instanceof Error 
                  ? error.message 
                  : "Could not sign in with Google. Please try again.",
              });
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-1 z-10">
            <FcGoogle className="h-4 w-4" />
          </div>
          <span>Sign in with Google</span>
        </Button>
      </AuthCard>
    </AuthLayout>
  );
}
