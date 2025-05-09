import { useState } from "react";
import { useLocation } from "wouter";
import { registerUser, loginWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/icons/icons";
import { FcGoogle } from "react-icons/fc";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { Separator } from "@/components/ui/separator";

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    
    try {
      await registerUser(data.email, data.password, data.displayName);
      toast({
        title: "Registration successful",
        description: "Welcome to FX Trade Journal!",
      });
      setLocation("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error 
          ? error.message 
          : "Could not create your account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Create your account"
        description="Start your trading journey with a free Forex Trade Journal account"
        footer={
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 text-primary font-medium" 
              onClick={() => setLocation("/auth/login")}
            >
              Sign in
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
              name="displayName"
              label="Display name"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isLoading}
              icon={Icons.ui.user}
              description="This is how you'll appear in the application"
            />
            
            <FormInput
              form={form}
              name="password"
              label="Create password"
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              icon={Icons.ui.lock}
              description="Min. 6 characters with at least 1 uppercase letter & 1 number"
            />
            
            <FormInput
              form={form}
              name="confirmPassword"
              label="Confirm password"
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              icon={Icons.ui.shieldCheck}
            />
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-5 h-5 flex items-center justify-center z-10">
                  <Icons.ui.check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground/80">Free access to basic features</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-5 h-5 flex items-center justify-center z-10">
                  <Icons.ui.check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground/80">No credit card required</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Icons.ui.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
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
              console.error("Google signup error:", error);
              toast({
                variant: "destructive",
                title: "Google signup failed",
                description: error instanceof Error 
                  ? error.message 
                  : "Could not sign up with Google. Please try again.",
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
          <span>Sign up with Google</span>
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{" "}
          <Button variant="link" className="p-0 h-auto text-xs" type="button">
            Terms of Service
          </Button>{" "}
          and{" "}
          <Button variant="link" className="p-0 h-auto text-xs" type="button">
            Privacy Policy
          </Button>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
