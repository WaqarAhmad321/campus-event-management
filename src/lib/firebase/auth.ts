
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateFirebaseProfile,
  type UserCredential,
  type User as FirebaseUser // Renamed to avoid conflict
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { UserProfile, UserRole } from "@/lib/types";

// Helper to create/update user profile in Firestore
const updateUserProfileDocument = async (
  user: FirebaseUser, // Use FirebaseUser type
  additionalData?: Partial<Omit<UserProfile, 'uid' | 'email' | 'photoURL' | 'createdAt' | 'updatedAt'>> & { role?: UserRole }
) => {
  if (!user) return;
  const userRef = doc(db, `users/${user.uid}`);
  const profileSnapshot = await getDoc(userRef);

  const defaultRole: UserRole = additionalData?.role || 'attendee';

  if (!profileSnapshot.exists()) {
    // New user, create profile
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();
    try {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: additionalData?.displayName || displayName,
        email,
        photoURL,
        role: defaultRole,
        createdAt,
        updatedAt: createdAt,
        ...additionalData, // Spread additionalData, role might be overridden if present
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  } else {
    // Existing user, update profile if necessary
    const dataToUpdate: Record<string, any> = { ...additionalData, updatedAt: serverTimestamp() };
    if (additionalData?.role) {
      dataToUpdate.role = additionalData.role;
    }
    // Only update if there's actually something to update besides timestamp
    const keysToUpdate = Object.keys(additionalData || {});
    if (keysToUpdate.length > 0) {
        try {
            await setDoc(userRef, dataToUpdate , { merge: true });
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    }
  }
};


export const handleSignUp = async (email: string, password: string, displayName: string, role: UserRole) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update Firebase Auth profile (displayName only)
    await updateFirebaseProfile(userCredential.user, { displayName });
    // Create user profile in Firestore with the selected role
    await updateUserProfileDocument(userCredential.user, { displayName, role });
    return userCredential;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const handleSignIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Optional: update last login or other info in Firestore profile if needed
    // On sign-in, role is not changed, it's fetched by AuthContext from existing profile
    // await updateUserProfileDocument(userCredential.user, { lastLogin: serverTimestamp() });
    return userCredential;
  } catch (error)
{
    console.error("Error signing in:", error);
    throw error;
  }
};

export const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Create/update user profile in Firestore, Google sign-ins default to 'attendee' role
    // as there's no role selection step in Google's OAuth flow.
    // If profile exists, role will not be overwritten unless explicitly passed.
    await updateUserProfileDocument(user, { displayName: user.displayName, role: 'attendee' });
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Function to get user profile from Firestore (used in AuthContext)
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, `users/${uid}`);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    // Ensure a default role if 'role' field is missing for some reason
    const data = docSnap.data();
    return { role: 'attendee', ...data } as UserProfile;
  }
  return null;
};
