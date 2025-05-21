
"use client";

import Link from "next/link";
import { LogIn, UserPlus, PlusCircle, LogOutIcon, Menu, LibraryBig, LayoutDashboard } from "lucide-react"; // Changed PartyPopper to LibraryBig
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { handleSignOut } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ThemeToggleButton from "./ThemeToggleButton";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { currentUser, loading, setIsManuallySignedOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const onSignOut = async () => {
    try {
      await handleSignOut();
      setIsManuallySignedOut(true);
      toast({ title: "Signed out successfully!" });
      router.push("/");
    } catch (error) {
      toast({ title: "Sign out failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "PN"; // PUCIT Now
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // if (typeof window !== 'undefined' && !loading && currentUser) {
  //   console.log("[Navbar] CurrentUser Role:", currentUser.role, "Can add event?", currentUser.role === 'admin' || currentUser.role === 'organizer');
  // }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/30 bg-[#2F2F2F] text-white shadow-md"> {/* PUCIT Theme: Dark Gray BG, White text */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white hover:text-gray-300 transition-colors">
            <LibraryBig className="h-7 w-7" /> {/* Changed Icon */}
            <span className="text-2xl font-bold font-heading">PUCIT Now</span> {/* Changed Name & font */}
          </Link>

          <div className="hidden md:flex items-center gap-3">
             {/* Temporarily remove asChild for diagnostics */}
            <Button variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10">
              {/* <Link href={currentUser ? "/dashboard" : "/"}>Events</Link> */}
              <span>Events</span> {/* Diagnostic Change */}
            </Button>
            {loading ? (
              // Adjusted pulse for dark bg
              <div className="h-9 w-20 bg-gray-700 rounded-md animate-pulse"></div>
            ) : currentUser ? (
              <>
                {(currentUser.role === 'admin' || currentUser.role === 'organizer') && (
                  <Button variant="ghost" asChild className="text-white hover:text-gray-300 hover:bg-white/10">
                    <Link href="/events/new">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10 p-0">
                      <Avatar className="h-9 w-9 border-2 border-primary/70">
                        <AvatarImage src={currentUser.photoURL ?? undefined} alt={currentUser.displayName ?? "User"} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{getInitials(currentUser.displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{currentUser.displayName || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email} ({currentUser.role})
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                       <LayoutDashboard className="mr-2 h-4 w-4" />
                       My Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-white hover:text-gray-300 hover:bg-white/10">
                  <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
                <Button variant="default" asChild className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-md px-4 py-2">
                  <Link href="/auth/register">
                    <UserPlus className="mr-2 h-4 w-4" /> Register
                  </Link>
                </Button>
              </>
            )}
            <ThemeToggleButton />
          </div>
          <div className="md:hidden flex items-center">
            <ThemeToggleButton />
            {/* Mobile menu trigger can go here if BottomNavbar isn't sufficient */}
          </div>
        </div>
      </nav>
    </>
  );
}
