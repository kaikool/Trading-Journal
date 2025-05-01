import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, footer, children, className }: AuthCardProps) {
  return (
    <Card className={cn("shadow-md border-border/30 overflow-hidden", className)}>
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/50"></div>
      
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className="flex justify-center border-t border-border/20 py-4">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

export default AuthCard;