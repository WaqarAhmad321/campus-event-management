
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { handleSignIn, handleSignUp, signInWithGoogle } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Github, Chrome, AlertTriangle, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthFormProps {
  mode: "login" | "register";
}

const getFirebaseErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      default:
        return "An authentication error occurred. Please try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
};


export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("attendee");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        if (!displayName.trim()) {
          setError("Display name is required.");
          setIsLoading(false);
          return;
        }
        await handleSignUp(email, password, displayName, selectedRole);
        toast({
          title: "Registration successful!",
          description: `Welcome to PUCIT Now. You registered as ${selectedRole}.`
        });
      } else {
        await handleSignIn(email, password);
        toast({ title: "Login successful!", description: "Welcome back to PUCIT Now." });
      }
      const redirectPath = searchParams.get('redirect') || '/dashboard'; // Redirect to dashboard or intended page
      router.push(redirectPath);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      toast({ title: mode === "register" ? "Registration Failed" : "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle(); // Role is handled as 'attendee' by default in signInWithGoogle
      toast({ title: "Signed in with Google successfully!" });
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      router.push(redirectPath);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      toast({ title: "Google Sign-In Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const showRoleWarning = mode === "register" && (selectedRole === "admin" || selectedRole === "organizer");

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 bg-background"> {/* Reverted BG */}
      <Card className="w-full max-w-md shadow-xl rounded-lg border-border/50 bg-card"> {/* Reverted Card styles */}
        <CardHeader className="pt-8">
          <div className="flex justify-center mb-4">
            {mode === "register" ? <UserPlus className="h-10 w-10 text-primary" /> : <LogIn className="h-10 w-10 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-bold text-center text-foreground font-heading"> {/* Added font-heading */}
            {mode === "register" ? "Create Your Account" : "Welcome Back!"}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground text-base pt-1">
            {mode === "register"
              ? "Join PUCIT Now today."
              : "Sign in to explore and manage events."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-6 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-5"> {/* Adjusted spacing */}
            {mode === "register" && (
              <>
                <div className="space-y-1.5"> {/* Adjusted spacing */}
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Your Full Name"
                    className="py-2.5" // Adjusted padding
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">I am an</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger id="role" className="py-2.5">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendee">Attendee</SelectItem>
                      <SelectItem value="organizer">Event Organizer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                   <p className="text-xs text-muted-foreground mt-1 px-1">
                    Default role is Attendee. Organizer/Admin roles are typically assigned by an existing administrator.
                  </p>
                </div>
                {showRoleWarning && (
                   <Alert variant="destructive" className="mt-2 p-3 rounded-md text-xs"> {/* Adjusted rounding and text size */}
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" /> {/* Adjusted icon size */}
                      <div>
                        <AlertTitle className="font-semibold text-sm">Security Advisory</AlertTitle>
                        <AlertDescription>
                          Selecting 'Administrator' or 'Event Organizer' grants significant permissions.
                          For true application security, these roles should be assigned by an existing administrator post-registration, not self-selected on a public form.
                          This option is included for demonstration purposes of role handling.
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="py-2.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="py-2.5"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full py-2.5 text-base rounded-md" disabled={isLoading} variant="default"> {/* Adjusted padding and rounding */}
              {isLoading ? (mode === "register" ? "Creating Account..." : "Logging In...") : (mode === "register" ? "Sign Up" : "Log In")}
            </Button>
          </form>
          <div className="mt-5 relative"> {/* Adjusted margin */}
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3"> {/* Adjusted margin and gap */}
            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="py-2.5 text-base rounded-md">
              <Chrome className="mr-2 h-4 w-4" /> {/* Adjusted icon size */}
              Sign in with Google
            </Button>
             {/* <Button variant="outline" disabled={true} className="py-2.5 text-base rounded-md">
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub (Coming Soon)
            </Button> */}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground"> {/* Adjusted margin */}
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Log In
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
