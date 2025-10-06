// Import necessary Firebase functions
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Simple session key for local storage
const SESSION_KEY = 'aaasummit_authenticated';
const SESSION_EMAIL_KEY = 'aaasummit_authenticated_email';

// Wait for Firebase to be available
async function waitForFirebase() {
  return new Promise((resolve, reject) => {
    const checkFirebase = () => {
      if (window.firebase && window.firebase.app && window.firebase.auth) {
        resolve();
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

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

// Function to check if user is authenticated
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === 'true';
    const email = sessionStorage.getItem(SESSION_EMAIL_KEY);
    return isAuthenticated && email;
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait for Firebase to be ready
        await waitForFirebase();
        
        const { db } = window.firebase;
        
        if (!db) {
            console.error('Firebase not properly initialized');
            showMessage('Failed to initialize. Please refresh the page and try again.', 'error');
            return;
        }

        // Handle form submission
        const sermonAuthForm = document.getElementById('sermonAuthForm');
        const emailInput = document.getElementById('email');
        
        if (sermonAuthForm) {
            // Pre-fill email if it exists in URL
            const urlParams = new URLSearchParams(window.location.search);
            const emailParam = urlParams.get('email');
            if (emailParam && emailInput) {
                emailInput.value = emailParam;
            }
            
            sermonAuthForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = emailInput ? emailInput.value.trim() : '';
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                
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
                        resetButton(submitBtn, originalBtnText);
                        Swal.fire({
                            icon: 'error',
                            title: 'Email Not Found',
                            text: 'The email you entered is not registered. Please provide a registered email address.',
                            confirmButtonColor: '#271f41',
                            confirmButtonText: 'OK',
                            allowOutsideClick: false
                        });
                        return;
                    }
                    
                    // Email exists, set session and redirect
                    sessionStorage.setItem(SESSION_KEY, 'true');
                    sessionStorage.setItem(SESSION_EMAIL_KEY, email);
                    
                    // Redirect to sermons page
                    window.location.href = 'sermon.html';
                    
                } catch (error) {
                    console.error('Error checking email:', error);
                    showMessage('An error occurred. Please try again later.', 'error');
                    resetButton(submitBtn, originalBtnText);
                }
            });
        }

        // Check if user is already authenticated on sermon page
        if (window.location.pathname.includes('sermon.html')) {
            if (!checkAuth()) {
                // Store the current URL to redirect back after login
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showMessage('Failed to initialize. Please refresh the page and try again.', 'error');
    }
});
