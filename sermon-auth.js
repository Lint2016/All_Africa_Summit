// Wait for Firebase to be available
async function waitForFirebase() {
  return new Promise((resolve) => {
    const checkFirebase = () => {
      if (window.firebase && window.firebase.app) {
        resolve();
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// Import necessary Firebase functions
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { 
  onAuthStateChanged, 
  signInAnonymously 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Helper function to validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Helper function to show messages
function showMessage(message, type) {
    // Remove any existing messages first
    const existingMessage = document.querySelector('.sermon-auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `sermon-auth-message ${type}`;
    messageEl.textContent = message;
    
    // Insert after the form
    const form = document.querySelector('.sermon-auth-form');
    if (form) {
        form.parentNode.insertBefore(messageEl, form.nextSibling);
        
        // Scroll to message
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove message after 5 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateY(-10px)';
            setTimeout(() => messageEl.remove(), 300);
        }, 5000);
    }
}

// Helper function to reset button state
function resetButton(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}

document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Firebase to be ready
    await waitForFirebase();
    
    const { db, auth } = window.firebase;
    
    if (!db || !auth) {
        console.error('Firebase not properly initialized');
        return;
    }
    const sermonAuthForm = document.getElementById('sermonAuthForm');
    const emailInput = document.getElementById('email');
    
    if (sermonAuthForm) {
        sermonAuthForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
            
            if (!email) {
                showMessage('Please enter your email address', 'error');
                resetButton(submitBtn, originalBtnText);
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address', 'error');
                resetButton(submitBtn, originalBtnText);
                return;
            }

            try {
                // Check if email exists in Firestore
                const usersRef = collection(db, 'registrations');
                const q = query(usersRef, where('email', '==', email));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    showMessage('Email not found. Please register first.', 'error');
                    resetButton(submitBtn, originalBtnText);
                    return;
                }

                // Email exists, sign in anonymously to access protected content
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error('Anonymous sign-in error:', error);
                    throw error; // Re-throw to be caught by the outer try-catch
                }
                
                // Store email in session storage for verification
                sessionStorage.setItem('authenticatedEmail', email);
                
                // Redirect to sermons page
                window.location.href = 'sermon.html';
                
            } catch (error) {
                console.error('Authentication error:', error);
                showMessage('An error occurred. Please try again later.', 'error');
                resetButton(submitBtn, originalBtnText);
            }
        });
    }

// Check if user is already authenticated on sermon page
    if (window.location.pathname.includes('sermon.html')) {
        onAuthStateChanged(auth, (user) => {
            if (!user || !sessionStorage.getItem('authenticatedEmail')) {
                // User is not authenticated, redirect to home page
                window.location.href = 'index.html';
            }
        });
    }
});
