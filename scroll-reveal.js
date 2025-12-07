/**
 * Scroll Reveal Animation System
 * Adds premium scroll-triggered animations to elements
 */

class ScrollReveal {
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px 0px -50px 0px',
      delay: options.delay || 0,
      duration: options.duration || 600,
      distance: options.distance || 50,
      easing: options.easing || 'ease-out',
      reset: options.reset !== undefined ? options.reset : false,
      ...options
    };
    
    this.observer = null;
    this.animatedElements = new Set();
    this.init();
  }

  init() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, animations disabled');
      // Fallback: show all elements immediately
      document.querySelectorAll('[data-scroll-reveal]').forEach(el => {
        el.classList.add('revealed');
      });
      return;
    }

    // Create Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );

    // Observe all elements with data-scroll-reveal attribute
    this.observeElements();
  }

  observeElements() {
    const elements = document.querySelectorAll('[data-scroll-reveal]');
    
    elements.forEach((element) => {
      // Set initial state
      const animationType = element.dataset.scrollReveal || 'fade-up';
      element.classList.add('scroll-reveal', `reveal-${animationType}`);
      
      // Add stagger delay if specified
      const stagger = element.dataset.stagger;
      if (stagger) {
        // Find sibling elements with same parent that also have data-scroll-reveal
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            el => el.hasAttribute('data-scroll-reveal')
          );
          const index = siblings.indexOf(element);
          
          if (index > 0) {
            const delay = parseInt(stagger) * index;
            element.style.transitionDelay = `${delay}ms`;
          }
        }
      }
      
      this.observer.observe(element);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Only animate once unless reset is enabled
        if (!this.options.reset && this.animatedElements.has(element)) {
          return;
        }

        // Add revealed class to trigger animation
        element.classList.add('revealed');
        this.animatedElements.add(element);

        // Unobserve if reset is disabled
        if (!this.options.reset) {
          this.observer.unobserve(element);
        }
      } else if (this.options.reset) {
        // Reset animation when element leaves viewport
        const element = entry.target;
        element.classList.remove('revealed');
        this.animatedElements.delete(element);
      }
    });
  }

  // Method to manually reveal an element
  reveal(element) {
    if (element) {
      element.classList.add('revealed');
      this.animatedElements.add(element);
    }
  }

  // Method to reset an element
  reset(element) {
    if (element) {
      element.classList.remove('revealed');
      this.animatedElements.delete(element);
    }
  }
}

// Initialize scroll reveal on page load
let scrollRevealInstance = null;

function initScrollReveal() {
  if (scrollRevealInstance) return scrollRevealInstance;

  scrollRevealInstance = new ScrollReveal({
    threshold: 0.1,
    rootMargin: '0px 0px -80px 0px',
    delay: 0,
    duration: 800,
    distance: 50,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    reset: false
  });

  return scrollRevealInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollReveal, initScrollReveal };
}

