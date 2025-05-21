
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, PlusCircle, Bell, UserCircle, LayoutDashboard } from "lucide-react"; // Changed Users to UserCircle or LayoutDashboard
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Define items structure with roles
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType; // Lucide icons are components
  disabled?: boolean;
  roles?: Array<"admin" | "organizer" | "attendee">; // Roles that can see this item
  requiresAuth?: boolean; // If true, only shown if currentUser exists
}

const allNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, disabled: true },
  { href: "/events/new", label: "Add Event", icon: PlusCircle, roles: ["admin", "organizer"], requiresAuth: true },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true }, // Using LayoutDashboard
  { href: "/notifications", label: "Notifications", icon: Bell, disabled: true, requiresAuth: true },
];


export default function BottomNavbar() {
  const pathname = usePathname();
  const { currentUser, loading } = useAuth();

  // Debug log
  if (typeof window !== 'undefined' && !loading && currentUser) {
    console.log("[BottomNavbar] CurrentUser Role:", currentUser.role);
  }

  if (loading) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-50">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center p-2">
            <div className="h-6 w-6 bg-muted rounded-full animate-pulse mb-1"></div>
            <div className="h-3 w-10 bg-muted rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  const visibleNavItems = allNavItems.filter(item => {
    if (item.requiresAuth && !currentUser) {
      return false; // Hide if requires auth and no user
    }
    if (item.roles && currentUser) { // If roles are defined and user exists
      if (!item.roles.includes(currentUser.role)) {
        return false; // Hide if user's role is not in the item's allowed roles
      }
    }
    return true; // Show by default or if conditions pass
  });
  
  // Debug log for Add Event item visibility specifically
  if (currentUser) {
    const addEventItemConfig = allNavItems.find(item => item.label === "Add Event");
    if (addEventItemConfig?.roles) {
        console.log("[BottomNavbar] 'Add Event' check: current role", currentUser.role, "item roles", addEventItemConfig.roles, "can see?", addEventItemConfig.roles.includes(currentUser.role));
    }
  }


  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-50 shadow-top">
      {visibleNavItems.slice(0, 5).map((item) => { // Limit to 5 items for typical bottom nav
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs p-2 transition-colors w-1/4", // w-1/4 implies 4 items, adjust if more
              isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-disabled={item.disabled}
            onClick={(e) => item.disabled && e.preventDefault()}
          >
            <Icon className={cn("h-6 w-6 mb-0.5", isActive && "fill-primary/10")} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(isActive && "font-semibold")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
