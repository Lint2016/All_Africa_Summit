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

// Initialize Firebase references from global (initialized in firebase-init.js)
let app = window.firebase && window.firebase.app;
let functions = window.functions;

if (app) {
  console.log('Firebase app reference available');
} else {
  console.warn('Firebase app not yet initialized. Ensure `firebase-init.js` is loaded as a module.');
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
    const markPaid = async (forceAlert = false) => {
        paymentApproved = true;
        sessionStorage.setItem('aaas_payment', 'approved');
        if (submitBtn) submitBtn.disabled = false;
        
        // Show thank you message when returning from payment
        const urlParams = new URLSearchParams(window.location.search);
        const hasPaypalFlag = urlParams.has('paypal');
        const hasPayfastFlag = urlParams.has('payfast');
        const hasToken = urlParams.has('token');
        const hasPayer = urlParams.has('PayerID') || urlParams.has('payerID');
        const shouldShow = forceAlert || (hasPaypalFlag || hasPayfastFlag || hasToken || hasPayer);
        if (shouldShow) {
            if (window.Swal) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Payment Successful!',
                    text: 'Thank you for your payment. Please complete your registration below.',
                    confirmButtonColor: '#b25538'
                });
            } else {
                // Defer showing alert until scripts finish loading
                sessionStorage.setItem('aaas_show_thanks', '1');
            }
        }
    };

    // If alert was deferred, show it once everything is loaded
    window.addEventListener('load', () => {
        const params = new URLSearchParams(window.location.search);
        const hasReturn = params.get('paypal') === 'return';
        const token = params.get('token');
        const payerId = params.get('PayerID') || params.get('payerID');
        if (sessionStorage.getItem('aaas_show_thanks') === '1' && (hasReturn || token || payerId)) {
            sessionStorage.removeItem('aaas_show_thanks');
            if (submitBtn) submitBtn.disabled = false;
            if (window.Swal) {
                Swal.fire({
                    icon: 'success',
                    title: 'Payment Successful!',
                    text: 'Thank you for your payment. Please complete your registration below.',
                    confirmButtonColor: '#b25538'
                });
            }
        }
    });

    // On load: if returning from PayPal
    (function handlePaypalReturn() {
        const params = new URLSearchParams(window.location.search);
        const hasReturn = params.get('paypal') === 'return';
        const token = params.get('token'); // PayPal order ID
        const payerId = params.get('PayerID') || params.get('payerID');
        const isCancel = params.get('paypal') === 'cancel';

        // If session says approved but not an actual return, ignore to avoid enabling on fresh loads
        if (sessionStorage.getItem('aaas_payment') === 'approved' && !(hasReturn || token || payerId)) {
            return;
        }

        // If user cancelled, clear flags and keep disabled
        if (isCancel) {
            sessionStorage.removeItem('aaas_payment');
            sessionStorage.removeItem('paypal_order_id');
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        if (hasReturn || token || payerId) {
            // Immediately enable and thank the user so the flow continues smoothly
            markPaid(true);

            // If we have a token, try to verify in the background
            if (token && typeof functions !== 'undefined') {
                const captureOrder = functions.httpsCallable('captureOrder');
                captureOrder({ orderID: token })
                    .then((res) => {
                        const data = res && res.data ? res.data : res;
                        if (!(data && (data.status === 'success' || data.details || data.result))) {
                            console.warn('PayPal capture returned unexpected result', data);
                        }
                    })
                    .catch((err) => {
                        console.warn('Non-blocking capture error (user already enabled):', err);
                    });
            }
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
            // Declare swalInstance in the outer scope
            let swalInstance = null;
            
            try {
                if (!app) {
                    throw new Error('Firebase not initialized');
                }
                
                // Show loading state
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
                
                const currentUrl = window.location.href.split('?')[0];
                const result = await createOrder({ 
                    amount: '0.50', 
                    currency: 'USD',
                    returnUrl: `${currentUrl}?paypal=return`,
                    cancelUrl: `${currentUrl}?paypal=cancel`
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
                    const approvalLink = result.data.links?.find(link => 
                        link.rel === 'approve' && link.method === 'GET'
                    );
                    
                    if (approvalLink && approvalLink.href) {
                        const approvalUrl = approvalLink.href;
                        // Show confirmation before redirecting to PayPal
                        if (window.Swal) {
                            const { isConfirmed } = await Swal.fire({
                                title: 'Redirecting to PayPal',
                                text: 'You will be redirected to PayPal to complete your payment of $120.00',
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
            
            const fd = new FormData(formEl);
            const selectedPaymentMethod = (fd.get('paymentMethod') || '').toLowerCase();

            // For EFT, allow submit without online payment approval
            const requiresOnlinePayment = selectedPaymentMethod !== 'eft';
            if (requiresOnlinePayment && !paymentApproved) {
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
                    const { addDoc, collection } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                    // Normalize payment method display label
                    const paymentLabel = selectedPaymentMethod === 'paypal' ? 'PayPal'
                        : selectedPaymentMethod === 'payfast' ? 'PayFast'
                        : 'EFT';
                    const nowIso = new Date().toISOString();

                    // Determine payment status and fields
                    const paymentDoc = {
                        ...formData,
                        paymentMethod: paymentLabel,
                        paymentDate: nowIso,
                        createdAt: nowIso
                    };

                    if (selectedPaymentMethod === 'eft') {
                        paymentDoc.paymentStatus = 'pending';
                    } else {
                        paymentDoc.paymentStatus = 'completed';
                        paymentDoc.paymentAmount = '120.00';
                    }

                    await addDoc(collection(window.db, 'registrations'), paymentDoc);
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

    // Styles moved to `register.css` and loaded in the HTML head for faster paint
  });
