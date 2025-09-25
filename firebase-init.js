 //Initialize and import of functions from firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyAl5oR3RvlgP8b9WvdxZaPvkc0rMb_R94M",
  authDomain: "aaasummit-d063e.firebaseapp.com",
  projectId: "aaasummit-d063e",
  storageBucket: "aaasummit-d063e.firebasestorage.app",
  messagingSenderId: "44977763419",
  appId: "1:44977763419:web:e3c5bd14fc98d724da3b7e",
  measurementId: "G-YWLCPLNLPZ"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


if (!window.firebase || !window.firebase.initializeApp) {
  console.error("Firebase SDK not loaded. Ensure firebase-app-compat.js is included.");
} else {
  try {
    window.firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
  } catch (e) {
    console.error("Failed to initialize Firebase:", e);
  }
}


