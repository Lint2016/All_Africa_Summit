console.log('Firebase initialization module loaded');

// Import Firebase services
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { 
  getAuth,
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAl5oR3RvlgP8b9WvdxZaPvkc0rMb_R94M",
  authDomain: "aaasummit-d063e.firebaseapp.com",
  projectId: "aaasummit-d063e",
  storageBucket: "aaasummit-d063e.appspot.com",
  messagingSenderId: "44977763419",
  appId: "1:44977763419:web:e3c5bd14fc98d724da3b7e",
  measurementId: "G-YWLCPLNLPZ"
};

// Initialize Firebase services
let app;
let db;
let auth;
let isInitialized = false;

// ✅ Function to initialize Firebase
export async function initializeFirebase() {
  if (isInitialized) {
    console.log('Firebase already initialized');
    return { db, auth };
  }

  try {
    console.log('Initializing Firebase app...');
    
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized:', app.name);

    // Initialize services
    db = getFirestore(app);
    auth = getAuth(app);

    // Make available globally for debugging
    window.firebase = { app, db, auth };
    window.db = db;
    window.auth = auth;

    // Enable offline persistence in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      try {
        await enableIndexedDbPersistence(db);
        console.log('✅ Firestore persistence enabled');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('Offline persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence.');
        } else {
          console.warn('Error enabling offline persistence:', err);
        }
      }
    }

    // Test Firestore connection
    await testFirestoreConnection();
    
    // Set up auth state listener
    setupAuthStateListener();
    
    isInitialized = true;
    console.log('✅ Firebase initialization complete');
    return { db, auth };

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

// Test Firestore connection
async function testFirestoreConnection() {
  try {
    if (!db) throw new Error('Firestore not initialized');
    
    const testRef = doc(db, "test", "connection-test");
    const docSnap = await getDoc(testRef);
    
    if (docSnap.exists()) {
      console.log("Firestore test connection successful:", docSnap.data());
    } else {
      console.log("No test document found, but connection is successful!");
    }
  } catch (err) {
    console.error("Firestore test connection failed:", err);
    throw err; // Re-throw to handle in the calling function
  }
}

// Set up auth state listener
function setupAuthStateListener() {
  if (!auth) {
    console.error('Auth not initialized');
    return;
  }
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in:', user.uid);
    } else {
      console.log('No user is signed in');
    }
  });
}

// Initialize Firebase when this module is loaded
(async () => {
  try {
    await initializeFirebase();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
})();

// Remove redundant catch block


