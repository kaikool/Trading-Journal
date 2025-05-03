import { ReactNode, useState, useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { 
  Brain, 
  TrendingUp, 
  LineChart, 
  Rocket, 
  Smartphone, 
  CloudOff,
  BarChart4,
  Badge,
  ChevronRight
} from "lucide-react";
import { Badge as UIBadge } from "@/components/ui/badge";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Features carousel for auto-changing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Main features list with icons and descriptions
  const features = [
    {
      title: "Advanced Pattern Analysis",
      description: "Comprehensive trade analysis to identify patterns in your trading behavior",
      icon: <TrendingUp className="h-5 w-5" />,
      highlight: "patterns",
      color: "bg-blue-500/20 text-blue-500"
    },
    {
      title: "Detailed Performance Tracking",
      description: "Comprehensive metrics on win rates, profit factors, and performance by pair/strategy",
      icon: <BarChart4 className="h-5 w-5" />,
      highlight: "metrics",
      color: "bg-green-500/20 text-green-500"
    },
    {
      title: "Chart Image Analysis",
      description: "Upload entry/exit chart images and get technical analysis and detailed feedback",
      icon: <LineChart className="h-5 w-5" />,
      highlight: "feedback",
      color: "bg-purple-500/20 text-purple-500"
    },
    {
      title: "Psychology Tracking",
      description: "Identify how emotions affect your trading performance with psychological insights",
      icon: <Brain className="h-5 w-5" />,
      highlight: "emotions",
      color: "bg-amber-500/20 text-amber-500"
    },
    {
      title: "Works Offline",
      description: "Full Progressive Web App support for using the journal even without internet connection",
      icon: <CloudOff className="h-5 w-5" />,
      highlight: "offline",
      color: "bg-indigo-500/20 text-indigo-500"
    },
    {
      title: "Achievement System",
      description: "Gamified trading experience with badges and achievements to keep you motivated",
      icon: <Badge className="h-5 w-5" />,
      highlight: "gamified",
      color: "bg-rose-500/20 text-rose-500"
    }
  ];
  
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Branding area with enhanced features showcase */}
      <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-primary/90 to-primary/70 text-white p-8 flex-col justify-between relative overflow-hidden">
        {/* Abstract decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
        
        {/* Logo and brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <AppLogo variant="light" size="lg" />
            <span className="font-semibold text-xl tracking-tight">Forex Trade Journal</span>
          </div>
          
          <div className="mt-12 mb-8">
            <UIBadge variant="outline" className="border-white/30 text-white/70 mb-3">
              Professional Trading Journal
            </UIBadge>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Trading Success <br />Starts With Analysis
            </h1>
            <p className="text-white/80 text-lg max-w-md mt-4">
              Track, analyze, and improve your Forex trading with advanced insights designed for serious traders.
            </p>
          </div>
        </div>
        
        {/* Features showcase */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="h-[320px] relative">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute top-0 left-0 w-full p-6 rounded-xl transition-all duration-500 ${
                  currentFeature === index 
                    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                    : 'opacity-0 translate-y-5 scale-95 pointer-events-none'
                }`}
              >
                <div className={`inline-flex items-center justify-center p-2 rounded-lg ${feature.color} mb-3`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                
                <p className="text-white/80 mb-4">
                  {feature.description.split(feature.highlight).map((part, i, arr) => 
                    i === arr.length - 1 ? (
                      <span key={`part-${index}-${i}`}>{part}</span>
                    ) : (
                      <span key={`part-${index}-${i}`}>
                        {part}<span className="font-semibold text-white">{feature.highlight}</span>
                      </span>
                    )
                  )}
                </p>
                
                <div className="flex items-center gap-1 text-white/60 text-sm font-medium group cursor-pointer">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Feature pagination dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentFeature === index ? 'bg-white w-8' : 'bg-white/30'
                }`}
                aria-label={`View feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Mobile and trusted section */}
        <div className="mt-6 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/80">Available on all devices - iOS, Android & Desktop</span>
          </div>
          
          <div className="pt-6 text-sm text-white/60 border-t border-white/10">
            © {new Date().getFullYear()} Forex Trade Journal. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Form area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

export default AuthLayout;