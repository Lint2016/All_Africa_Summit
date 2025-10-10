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

// Initialize Firebase
let app;
let functions;

try {
  app = firebase.initializeApp(firebaseConfig);
  functions = firebase.functions();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a nav link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Back to top button
    const backToTopBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Registration form elements
    const formEl = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const paypalBtn = document.querySelector('.paypal-btn');
    const payfastBtn = document.querySelector('.payfast-btn');
    const bankDetailsBtn = document.getElementById('showBankDetails');
    const bankDetails = document.getElementById('bankDetails');
    let paymentApproved = false;

    // Bank details toggle
    if (bankDetailsBtn && bankDetails) {
        bankDetailsBtn.addEventListener('click', () => {
            if (bankDetails.style.display === 'block') {
                bankDetails.style.display = 'none';
                bankDetailsBtn.textContent = 'Show Bank Details';
            } else {
                bankDetails.style.display = 'block';
                bankDetailsBtn.textContent = 'Hide Bank Details';
            }
        });
    }

    // Helper: persist payment approval in session to handle redirect returns
    const markPaid = async () => {
        paymentApproved = true;
        sessionStorage.setItem('aaas_payment', 'approved');
        if (submitBtn) submitBtn.disabled = false;
        
        // Show thank you message when returning from payment
        if (window.Swal && (new URLSearchParams(window.location.search).has('paypal') || 
                           new URLSearchParams(window.location.search).has('payfast'))) {
            await Swal.fire({
                icon: 'success',
                title: 'Payment Successful!',
                text: 'Thank you for your payment. Please complete your registration below.',
                confirmButtonColor: '#b25538'
            });
        }
    };

    // On load: if returning from PayPal
    (function handlePaypalReturn() {
        const params = new URLSearchParams(window.location.search);
        if (sessionStorage.getItem('aaas_payment') === 'approved') {
            if (submitBtn) submitBtn.disabled = false;
            paymentApproved = true;
            
            // Show thank you message if just returning from payment
            if (params.has('paypal') || params.has('payfast')) {
                markPaid();
            }
            return;
        }
        
        const hasReturn = params.get('paypal') === 'return';
        const token = params.get('token'); // PayPal order ID
        
        if (hasReturn && token) {
            // Show loading state
            let swalInstance = null;
            if (window.Swal) {
                swalInstance = Swal.fire({
                    title: 'Processing Payment...',
                    text: 'Please wait while we verify your payment.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }
            
            // Capture order server-side
            fetch('/.netlify/functions/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: token })
            })
            .then(r => r.json())
            .then(async (data) => {
                if (data && data.capture && (data.capture.status === 'COMPLETED' || data.capture.purchase_units)) {
                    await markPaid();
                } else {
                    console.error('Capture failed', data);
                    if (window.Swal) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Payment Error',
                            text: 'There was an issue verifying your payment. Please try again or contact support.',
                            confirmButtonColor: '#b25538'
                        });
                    }
                }
            })
            .catch(async (err) => {
                console.error('Capture error', err);
                if (window.Swal) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Connection Error',
                        text: 'Unable to verify payment. Please check your connection and try again.',
                        confirmButtonColor: '#b25538'
                    });
                }
            })
            .finally(() => {
                if (swalInstance) {
                    swalInstance.close();
                }
            });
        }
    })();

    // On load: if returning from PayFast
    (function handlePayfastReturn() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payfast') === 'return') {
            // Treat return as approval (basic). For production, validate via ITN.
            markPaid();
            return;
        }
    })();

    // PayPal integration
    if (paypalBtn) {
        paypalBtn.addEventListener('click', async () => {
            try {
                if (!app) {
                    throw new Error('Firebase not initialized');
                }
                
                // Show loading state
                let swalInstance = null;
                if (window.Swal) {
                    swalInstance = Swal.fire({
                        title: 'Preparing Payment',
                        text: 'Please wait while we connect to PayPal...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                }
                
                const createOrder = functions.httpsCallable('createOrder');
                console.log('Sending createOrder request...');
                
                const result = await createOrder({ 
                    amount: '20.00', 
                    currency: 'USD' 
                });
                
                console.log('Order created:', result);
                
                // Close loading state
                if (swalInstance) {
                    await swalInstance.close();
                }
                
                if (result && result.data && result.data.id) {
                    // First, save the order ID in session storage
                    sessionStorage.setItem('paypal_order_id', result.data.id);
                    
                    // Get the approval URL from the response
                    const approvalUrl = result.data.links?.find(link => 
                        link.rel === 'approve'
                    )?.href;
                    
                    if (approvalUrl) {
                        // Show confirmation before redirecting to PayPal
                        if (window.Swal) {
                            const { isConfirmed } = await Swal.fire({
                                title: 'Redirecting to PayPal',
                                text: 'You will be redirected to PayPal to complete your payment of $20.00',
                                icon: 'info',
                                showCancelButton: true,
                                confirmButtonColor: '#b25538',
                                cancelButtonColor: '#6c757d',
                                confirmButtonText: 'Proceed to PayPal',
                                cancelButtonText: 'Cancel',
                                reverseButtons: true
                            });
                            
                            if (isConfirmed) {
                                // Redirect to PayPal's approval URL
                                window.location.href = approvalUrl;
                            }
                        } else {
                            // If SweetAlert is not available, just redirect
                            window.location.href = approvalUrl;
                        }
                    } else {
                        throw new Error('No approval URL found in PayPal response');
                    }
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (err) {
                console.error('Create order error:', err);
                
                // Close loading state if it's still open
                if (swalInstance) {
                    await swalInstance.close();
                }
                
                // Show error message
                if (window.Swal) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Payment Error',
                        text: 'Error creating PayPal order: ' + (err.message || 'Unknown error'),
                        confirmButtonColor: '#b25538'
                    });
                } else {
                    alert('Error creating PayPal order: ' + (err.message || 'Unknown error'));
                }
            }
        });
    }

    // PayFast integration (redirect flow)
    if (payfastBtn) {
        
        }

    // Guard form submission: require payment first
    if (formEl) {
        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable submit button to prevent multiple submissions
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.cursor = 'not-allowed';
            }
            
            if (!paymentApproved) {
                if (window.Swal) {
                    await Swal.fire({
                        icon: 'info',
                        title: 'Payment required',
                        text: 'Please complete payment first.',
                        confirmButtonColor: '#b25538'
                    });
                }
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
            
            const fd = new FormData(formEl);
            const formData = Object.fromEntries(fd.entries());
            const submitText = submitBtn ? submitBtn.textContent : 'Submit';
            
            if (submitBtn) {
                submitBtn.textContent = 'Submitting...';
                submitBtn.disabled = true;
            }

            // Show loading state
            let swalInstance = null;
            if (window.Swal) {
                swalInstance = Swal.fire({
                    title: 'Processing...',
                    text: 'Please wait while we process your registration.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }

            try {
                // Write to Firebase Firestore
                if (window.db) {
                    const { addDoc, collection } = await import('firebase/firestore');
                    await addDoc(collection(window.db, 'registrations'), {
                        ...formData,
                        paymentStatus: 'completed',
                        paymentMethod: 'PayPal',
                        paymentAmount: '20.00',
                        paymentDate: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    });
                }

                // Send to Formspree
                const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgvnvzzr';
                const res = await fetch(FORMSPREE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: fd
                });
                
                if (!res.ok) {
                    throw new Error('Failed to submit form');
                }

                // Close loading state
                if (swalInstance) {
                    await swalInstance.close();
                }

                // Show success message
                if (window.Swal) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Registration Successful!',
                        html: 'Thank you for registering for the All  Africa Apostolic Summit!<br><br>You will receive a welcome email with further details within 24-48 hours.',
                        confirmButtonColor: '#b25538',
                        allowOutsideClick: false
                    });
                }
                
                // Reset form and state
                sessionStorage.removeItem('aaas_payment');
                formEl.reset();
                paymentApproved = false;
                
            } catch (err) {
                console.error('Submission error:', err);
                
                // Close loading state if it's still open
                if (swalInstance) {
                    await swalInstance.close();
                }
                
                // Show error message
                if (window.Swal) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'There was an error processing your registration. Please try again.',
                        confirmButtonColor: '#b25538'
                    });
                }
                
                // Re-enable the submit button on error
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitText;
                }
            }
        });
    }

    // Style form elements
    const style = document.createElement('style');
    style.textContent = `
        #registrationForm label {
            margin: 10px 0 5px;
            font-weight: bold;
            color: #333;
            display: block;
        }

        #registrationForm input,
        #registrationForm select {
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 6px;
            border: 1px solid #ccc;
            font-size: 1rem;
            width: 100%;
        }

        #registrationForm button[type="submit"] {
            background: #b25538;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 12px;
            cursor: pointer;
            font-size: 1rem;
            width: 100%;
            transition: background 0.3s ease;
        }

        #registrationForm button[type="submit"]:hover {
            background: #9a472f;
        }

        #registrationForm button[type="submit"]:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .help-link {
            display: block;
            font-size: 0.9rem;
            color: #0070ba;
            text-decoration: none;
        }

        .help-link:hover {
            text-decoration: underline;
        }

        .bank-details {
            margin-top: 1rem;
            text-align: left;
            font-size: 0.95rem;
            color: #333;
            background: #f9f9f9;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #ddd;
        }

        .bank-details p {
            margin-bottom: 8px;
            line-height: 1.4;
        }

        .payment-card.bank-transfer {
            border: 2px solid #007bff;
        }

        .payment-card.bank-transfer:hover {
            border-color: #0056b3;
            background-color: #f8f9ff;
        }
    `;
    document.head.appendChild(style);
});
