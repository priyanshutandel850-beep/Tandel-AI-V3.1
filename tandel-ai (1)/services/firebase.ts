import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ------------------------------------------------------------------
// IMPORTANT: Replace the configuration below with your Firebase project details.
// You can obtain these from the Firebase Console: https://console.firebase.google.com/
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCS-QbhTtXMfcbUYlCzR-wSQnLeShuDwe0",
  authDomain: "add-web-app-961e7.firebaseapp.com",
  projectId: "add-web-app-961e7",
  storageBucket: "add-web-app-961e7.firebasestorage.app",
  messagingSenderId: "321478550092",
  appId: "1:321478550092:web:b9f21fa5c8db53af2c4ae9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
