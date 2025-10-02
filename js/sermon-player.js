document.addEventListener('DOMContentLoaded', function() {
    // Initialize all videos
    document.querySelectorAll('video').forEach(video => {
        // Ensure video is ready to play
        video.addEventListener('loadedmetadata', function() {
            // Set volume to 100% when metadata is loaded
            video.volume = 1.0;
        });
        
        // Handle video errors
        video.addEventListener('error', function(e) {
            console.error('Video error:', video.error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'video-error';
            errorMessage.style.color = 'red';
            errorMessage.style.padding = '20px';
            errorMessage.style.textAlign = 'center';
            errorMessage.textContent = 'Error loading video. Please try again later.';
            video.parentNode.insertBefore(errorMessage, video.nextSibling);
        });
    });
    // Video play button functionality
    document.querySelectorAll('.play-video-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const videoId = this.getAttribute('data-video');
            const video = document.querySelector(`#sermon-${videoId}`);
            const card = this.closest('.sermon-card');
            const icon = this.querySelector('i');
            
            if (!video) {
                console.error('Video element not found for ID:', videoId);
                return;
            }
            
            if (video.paused) {
                // Pause all other videos first
                document.querySelectorAll('video').forEach(v => {
                    if (v !== video && !v.paused) {
                        v.pause();
                        const otherIcon = v.closest('.sermon-card')?.querySelector('.play-video-btn i');
                        if (otherIcon) {
                            otherIcon.classList.remove('fa-pause');
                            otherIcon.classList.add('fa-play');
                        }
                        v.closest('.sermon-card')?.classList.remove('playing');
                    }
                });
                
                video.play().then(() => {
                    card.classList.add('playing');
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                }).catch(error => {
                    console.error('Error playing video:', error);
                });
            } else {
                video.pause();
                card.classList.remove('playing');
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    });
    
    // Pause video when clicking on the video
    document.querySelectorAll('.video-container video').forEach(video => {
        video.addEventListener('click', function(e) {
            e.stopPropagation();
            const playBtn = this.closest('.sermon-card').querySelector('.play-video-btn');
            const icon = playBtn.querySelector('i');
            const card = this.closest('.sermon-card');
            
            if (this.paused) {
                this.play().then(() => {
                    card.classList.add('playing');
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                }).catch(error => {
                    console.error('Error playing video:', error);
                });
            } else {
                this.pause();
                card.classList.remove('playing');
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    });
    
    // Pause video when switching tabs
    document.querySelectorAll('.media-tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (!tabId.startsWith('video')) {
                const video = this.closest('.sermon-card').querySelector('video');
                if (video && !video.paused) {
                    video.pause();
                    const playBtn = this.closest('.sermon-card').querySelector('.play-video-btn i');
                    if (playBtn) {
                        playBtn.classList.remove('fa-pause');
                        playBtn.classList.add('fa-play');
                    }
                    this.closest('.sermon-card').classList.remove('playing');
                }
            }
        });
    });
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Media tabs functionality
    document.querySelectorAll('.media-tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            const tabContainer = button.closest('.media-tabs');
            
            // Remove active class from all buttons and contents in this tab container
            tabContainer.querySelectorAll('.media-tab-btn').forEach(btn => btn.classList.remove('active'));
            tabContainer.querySelectorAll('.media-tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            tabContainer.querySelector(`#${tabId}`).classList.add('active');
        });
    });

    // Audio player functionality
    document.querySelectorAll('.audio-player').forEach(player => {
        const audio = player.querySelector('audio');
        const playBtn = player.querySelector('.play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const progressContainer = player.querySelector('.progress-container');
        const timeEl = player.querySelector('.time');
        const volumeBtn = player.querySelector('.volume-btn');
        const volumeSlider = player.querySelector('.volume-slider');
        
        // Format time in seconds to MM:SS format
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update progress bar
        function updateProgress() {
            const { currentTime, duration } = audio;
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            // Update time display
            timeEl.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }
        
        // Set progress when clicking on progress bar
        function setProgress(e) {
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            audio.currentTime = (clickX / width) * duration;
        }
        
        // Toggle play/pause
        function togglePlay() {
            if (audio.paused) {
                audio.play();
                playBtn.classList.add('playing');
            } else {
                audio.pause();
                playBtn.classList.remove('playing');
            }
        }
        
        // Update volume
        function setVolume() {
            audio.volume = this.value;
            // Update volume icon
            if (this.value == 0) {
                volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (this.value < 0.5) {
                volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
        
        // Toggle mute
        function toggleMute() {
            audio.muted = !audio.muted;
            if (audio.muted) {
                volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                volumeSlider.value = 0;
            } else {
                audio.volume = volumeSlider.value;
                setVolume.call(volumeSlider);
            }
        }
        
        // Event listeners
        playBtn.addEventListener('click', togglePlay);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', () => {
            playBtn.classList.remove('playing');
            audio.currentTime = 0;
            updateProgress();
        });
        progressContainer.addEventListener('click', setProgress);
        volumeBtn.addEventListener('click', toggleMute);
        volumeSlider.addEventListener('input', setVolume);
        
        // Initialize volume
        audio.volume = 1;
        volumeSlider.value = 1;
    });
    
    // Play video button
    document.querySelectorAll('.play-video-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const videoId = btn.getAttribute('data-video');
            const videoTab = document.querySelector(`#${videoId}`);
            const videoTabBtn = videoTab.closest('.media-tabs').querySelector(`[data-tab="${videoId}"]`);
            
            // Switch to video tab
            videoTabBtn.click();
            
            // Scroll to video
            videoTab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });
    
    // Download dropdown functionality
    document.querySelectorAll('.download-options').forEach(downloadOptions => {
        downloadOptions.addEventListener('mouseenter', () => {
            downloadOptions.classList.add('active');
        });
        
        downloadOptions.addEventListener('mouseleave', () => {
            downloadOptions.classList.remove('active');
        });
    });
});
