
"use client";

import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/lib/types";
import type { ReactNode } from "react";

interface CurrentUserContextClientProps {
  // event prop removed as it's not used by this component directly
  children: (currentUser: UserProfile | null) => ReactNode;
}

export default function CurrentUserContextClient({ children }: CurrentUserContextClientProps) {
  const { currentUser } = useAuth();
  return <>{children(currentUser)}</>;
}
