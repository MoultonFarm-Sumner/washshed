import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isProtected } = useAuth();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      setLoginError("");
      console.log("Attempting login with provided password");
      
      const success = await login(data.password);
      console.log("Login result:", success);
      
      if (success) {
        console.log("Login successful, preparing to redirect");
        
        // Add a delay before redirecting to allow cookies to be set
        setTimeout(() => {
          console.log("Performing hard redirect to home page");
          // Force a complete page reload to ensure cookies are properly recognized
          window.location.replace("/");
        }, 500);
      } else {
        console.log("Login failed");
        setLoginError("Invalid password. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An unexpected error occurred during login.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Farm Management System</CardTitle>
          <CardDescription className="text-center">
            {isProtected 
              ? "Enter your password to access the system" 
              : "Setting up the system for the first time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {isProtected ? "Password" : "Create Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isProtected ? "Enter your password" : "Create a new password"}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
              {loginError && (
                <p className="text-sm text-red-500">{loginError}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Lock className="mr-2 h-4 w-4" />
              {isSubmitting ? "Processing..." : isProtected ? "Login" : "Set Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500 text-center w-full">
            {isProtected 
              ? "Your session will be remembered on this device for 30 days."
              : "This will secure your farm management system with password protection."}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}