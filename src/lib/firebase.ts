// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyLYGx41HVNu7bvnTYPXEKiX5ZvmBMBcI",
  authDomain: "only-journaling.firebaseapp.com",
  projectId: "only-journaling",
  storageBucket: "only-journaling.firebasestorage.app",
  messagingSenderId: "919365824460",
  appId: "1:919365824460:web:e2663daa0d5b4ce0e97769"
};
// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
