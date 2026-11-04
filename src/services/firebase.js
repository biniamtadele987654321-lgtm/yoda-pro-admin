import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEUivy9xqP2Z2POAkhIsC3f7RDy5BS-G8",
  authDomain: "ashu-f0761.firebaseapp.com",
  projectId: "ashu-f0761",
  storageBucket: "ashu-f0761.firebasestorage.app",
  messagingSenderId: "732816610765",
  appId: "1:732816610765:web:70b552d7964fab07ec6084"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;