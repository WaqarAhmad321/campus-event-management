
"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import type { UserProfile } from "@/lib/types";
import { getUserProfile } from "@/lib/firebase/auth"; // Corrected import path

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isManuallySignedOut: boolean;
  setIsManuallySignedOut: (isSignedOut: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isManuallySignedOut: false,
  setIsManuallySignedOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManuallySignedOut, setIsManuallySignedOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Fetch user profile from Firestore if needed, or construct from auth user
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setCurrentUser(profile);
        } else {
           // Create a basic profile if one doesn't exist, or handle as an error
           // For now, just use auth user details
          const basicProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };
          setCurrentUser(basicProfile);
        }
        setIsManuallySignedOut(false);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, isManuallySignedOut, setIsManuallySignedOut }}>
      {children}
    </AuthContext.Provider>
  );
};
