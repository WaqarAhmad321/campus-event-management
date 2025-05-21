import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyCvqwo2htkkroCQXqs2KGxZ8q0mU9AvUWE",
  authDomain: "fcitlive.firebaseapp.com",
  projectId: "fcitlive",
  storageBucket: "fcitlive.firebasestorage.app",
  messagingSenderId: "926502398710",
  appId: "1:926502398710:web:1ccd02a6c62b52e9ebdad7",
};

// Log the config to help with debugging environment variable issues
console.log("Attempting to initialize Firebase with config:", firebaseConfig);
if (!firebaseConfig.apiKey) {
  console.warn(
    "Firebase API Key is missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your environment.",
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

export { app, auth, db, storage }; // Export storage
