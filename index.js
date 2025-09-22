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

//  MODAL SCRIPT  //

 // Get elements
  const openModal = document.getElementById('registerBtn');
  const closeModal = document.getElementById('closeModal');
  const modal = document.getElementById('paymentModal');
  const toggleBankBtn = document.getElementById('toggleBank');
  const bankDetails = document.getElementById('bankDetails');

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

  // Toggle bank details
  toggleBankBtn.addEventListener('click', () => {
    if (bankDetails.style.display === 'block') {
      bankDetails.style.display = 'none';
      toggleBankBtn.textContent = 'View Bank Details';
    } else {
      bankDetails.style.display = 'block';
      toggleBankBtn.textContent = 'Hide Bank Details';
    }
  });