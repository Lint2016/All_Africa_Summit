// Firebase configuration
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
let db;
try {
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  window.firebase = firebase;
  window.db = db;
  
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Failed to initialize Firebase:", e);
}


