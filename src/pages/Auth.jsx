import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Shield } from "lucide-react";
import logoImage from "@/components/logo.png";
import { useGesture } from "@/hooks/useGesture";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  // Haptic feedback for mobile
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    triggerHapticFeedback();

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            mobile_number: mobileNumber
          }
        }
      });

      if (error) {
        triggerHapticFeedback();
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      }
    } catch (error) {
      triggerHapticFeedback();
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    triggerHapticFeedback();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        triggerHapticFeedback();
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
      } else {
        navigate("/");
      }
    } catch (error) {
      triggerHapticFeedback();
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gesture support
  const gestureProps = useGesture({
    onSwipeLeft: () => {
      // Switch to signup tab on swipe left
      const signupTab = document.querySelector('[value="signup"]') as HTMLElement;
      if (signupTab) signupTab.click();
    },
    onSwipeRight: () => {
      // Switch to signin tab on swipe right  
      const signinTab = document.querySelector('[value="signin"]') as HTMLElement;
      if (signinTab) signinTab.click();
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 safe-area-inset">
      <Card className="w-full max-w-md mobile-card">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src={logoImage} 
                alt="ToTodo Logo" 
                className="h-20 w-20 object-contain mobile-logo"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                <Smartphone className="h-3 w-3" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome to ToTodo
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your mobile productivity companion
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secure • Mobile-First • Offline-Ready</span>
          </div>
        </CardHeader>
        <CardContent {...gestureProps}>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 mobile-tabs">
              <TabsTrigger value="signin" className="text-sm font-medium">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm font-medium">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <div className="text-center mt-2 text-xs text-muted-foreground">
              Swipe to switch tabs
            </div>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base mobile-input"
                    placeholder="your@email.com"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base mobile-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg mobile-button" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 text-base mobile-input"
                    placeholder="Your display name"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-mobile">Mobile Number</Label>
                  <Input
                    id="signup-mobile"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="h-12 text-base mobile-input"
                    placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base mobile-input"
                    placeholder="your@email.com"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base mobile-input"
                    placeholder="Choose a secure password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg mobile-button" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            By signing up, you agree to our terms of service and privacy policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;