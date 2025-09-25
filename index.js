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

    // Countdown Timer
    const countdown = () => {
        const countDate = new Date('February 25, 2026 09:00:00').getTime();
        const now = new Date().getTime();
        const gap = countDate - now;

        // Time calculations
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;

        // Calculate remaining time
        const textDay = Math.floor(gap / day);
        const textHour = Math.floor((gap % day) / hour);
        const textMinute = Math.floor((gap % hour) / minute);
        const textSecond = Math.floor((gap % minute) / second);

        // Update the countdown display
        document.getElementById('days').textContent = textDay.toString().padStart(2, '0');
        document.getElementById('hours').textContent = textHour.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = textMinute.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = textSecond.toString().padStart(2, '0');
    };

    // Run countdown every second
    setInterval(countdown, 1000);
    countdown(); // Initial call

    // Tab functionality for schedule
    const scheduleTabs = document.querySelectorAll('.schedule-tabs .tab-btn');
    scheduleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-day');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.schedule-tabs .tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.schedule-tabs .tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Tab functionality for sermons
    const sermonTabs = document.querySelectorAll('.sermon-tabs .tab-btn');
    sermonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.sermon-tabs .tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sermon-tabs .tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Audio Player Functionality
    const audioPlayers = document.querySelectorAll('.audio-player');
    
    audioPlayers.forEach(player => {
        const audio = player.querySelector('audio');
        const playBtn = player.querySelector('.play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const timeEl = player.querySelector('.time');
        
        // Format time in seconds to MM:SS
        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        // Update progress bar and time (guard against metadata not loaded)
        const updateProgress = () => {
            const { currentTime, duration } = audio;
            if (!isFinite(duration) || duration === 0) {
                progressBar.style.width = '0%';
                timeEl.textContent = `${formatTime(currentTime || 0)} / 00:00`;
                return;
            }
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            timeEl.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        };
        
        // Play/Pause functionality
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                // Pause all other audio players and reset their buttons
                document.querySelectorAll('.audio-player').forEach(p => {
                    const aEl = p.querySelector('audio');
                    const btnEl = p.querySelector('.play-btn');
                    if (aEl !== audio) {
                        aEl.pause();
                        btnEl && btnEl.classList.remove('playing');
                        const pb = p.querySelector('.progress-bar');
                        if (pb) pb.style.width = '0%';
                    }
                });

                audio.play();
                playBtn.classList.add('playing');
            } else {
                audio.pause();
                playBtn.classList.remove('playing');
            }
        });
        
        // Update progress bar as audio plays
        audio.addEventListener('timeupdate', updateProgress);
        
        // Update progress bar on click
        const progressContainer = player.querySelector('.progress-container');
        progressContainer.addEventListener('click', (e) => {
            const width = progressContainer.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            audio.currentTime = (clickX / width) * duration;
        });
        
        // Reset play button when audio ends
        audio.addEventListener('ended', () => {
            playBtn.classList.remove('playing');
            progressBar.style.width = '0%';
            timeEl.textContent = '00:00 / 00:00';
        });
        
        // Initialize time display
        audio.addEventListener('loadedmetadata', () => {
            timeEl.textContent = `00:00 / ${formatTime(audio.duration)}`;
            progressBar.style.width = '0%';
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

//  MODAL SCRIPT  FOR PAYMENT//

 // Get elements
  const openModal = document.getElementById('registerBtn');
  const closeModal = document.getElementById('closeModal');
  const modal = document.getElementById('paymentModal');
  const toggleBankBtn = null;
  const bankDetails = null;
  const payfastBtn = document.querySelector('.bank-btn');

  // Open modal
  openModal.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  // Close modal
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside content
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Removed bank details toggle

  // PayFast integration (redirect flow)
  if (payfastBtn) {
    payfastBtn.addEventListener('click', async () => {
      try {
        const buyer = {
          firstName: document.getElementById('firstName')?.value || '',
          lastName: document.getElementById('lastName')?.value || '',
          email: document.getElementById('email')?.value || ''
        };
        const res = await fetch('/.netlify/functions/payfast-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: '10.00', buyer })
        });
        const data = await res.json();
        if (data && data.redirect) {
          window.location.href = data.redirect;
        }
      } catch (err) {
        console.error('PayFast create error', err);
      }
    });
  }

  // PayPal integration
  const paypalBtn = document.querySelector('.paypal-btn');
  const submitBtn = document.getElementById('submitBtn');
  const formEl = document.getElementById('modalRegistrationForm');
  let paymentApproved = false;

  // Helper: persist payment approval in session to handle redirect returns
  const markPaid = () => {
    paymentApproved = true;
    sessionStorage.setItem('aaas_payment', 'approved');
    if (submitBtn) submitBtn.disabled = false;
  };

  // On load: if returning from PayPal
  (function handlePaypalReturn() {
    const params = new URLSearchParams(window.location.search);
    // PayFast return handler
    if (params.get('payfast') === 'return') {
      // Treat return as approval (basic). For production, validate via ITN.
      markPaid();
      return;
    }
    if (sessionStorage.getItem('aaas_payment') === 'approved') {
      if (submitBtn) submitBtn.disabled = false;
      paymentApproved = true;
      return;
    }
    const hasReturn = params.get('paypal') === 'return';
    const token = params.get('token'); // PayPal order ID
    if (hasReturn && token) {
      // Capture order server-side
      fetch('/.netlify/functions/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: token })
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.capture && (data.capture.status === 'COMPLETED' || data.capture.purchase_units)) {
          markPaid();
        } else {
          console.error('Capture failed', data);
        }
      })
      .catch(err => console.error('Capture error', err));
    }
  })();

  if (paypalBtn) {
    paypalBtn.addEventListener('click', () => {
      // Create order server-side
      fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: '10.00', currency: 'USD' })
      })
      .then(r => r.json())
      .then(({ approval }) => {
        if (approval) {
          window.location.href = approval; // redirect to PayPal
        }
      })
      .catch(err => console.error('Create order error', err));
    });
  }

  // Guard form submission: require payment first
  if (formEl) {
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!paymentApproved) {
        if (window.Swal) {
          await Swal.fire({
            icon: 'info',
            title: 'Payment required',
            text: 'Please complete payment first.',
            confirmButtonColor: '#b25538'
          });
        }
        return;
      }
      const fd = new FormData(formEl);
      const formData = Object.fromEntries(fd.entries());

      // Write to Firebase Firestore
      try {
        if (window.db) {
          await window.db.collection('registrations').add({
            ...formData,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Firestore write failed', err);
      }

      // Send to Formspree
      try {
        const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgvnvzzr';
        const submitText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });
        if (!res.ok) {
          console.error('Formspree response error', await res.text());
        }
        submitBtn.textContent = submitText;
      } catch (err) {
        console.error('Formspree failed', err);
      }

      if (window.Swal) {
        await Swal.fire({
          icon: 'success',
          title: 'Registration submitted',
          text: 'Thank you! We have received your details.',
          confirmButtonColor: '#b25538'
        });
      }
      sessionStorage.removeItem('aaas_payment');
      formEl.reset();
      if (submitBtn) submitBtn.disabled = true;
      paymentApproved = false;
      // Close modal
      if (modal) modal.style.display = 'none';
    });
  }