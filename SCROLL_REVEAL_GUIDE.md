# Scroll Reveal Animation Guide

## Overview
A premium scroll-triggered animation system has been added to all sections of the website. Elements animate into view as users scroll down the page, creating a polished, professional experience.

## How It Works

The system uses the Intersection Observer API to detect when elements enter the viewport, then applies smooth CSS animations.

## Usage

### Basic Usage
Add the `data-scroll-reveal` attribute to any element you want to animate:

```html
<section data-scroll-reveal="fade-up">
  <!-- Content -->
</section>
```

### Available Animation Types

1. **`fade-up`** - Fades in while sliding up (most common)
2. **`fade-down`** - Fades in while sliding down
3. **`fade-left`** - Fades in while sliding from right
4. **`fade-right`** - Fades in while sliding from left
5. **`fade`** - Simple fade in (no movement)
6. **`scale`** - Scales up from 80% to 100%
7. **`scale-fade`** - Scales up with fade
8. **`rotate`** - Rotates in with scale
9. **`card`** - Card-specific animation (slight scale + fade)
10. **`image`** - Image-specific animation (scale + brightness)
11. **`blur`** - Blurs in while fading

### Staggered Animations

For elements in a grid or list, use the `data-stagger` attribute to create a cascading effect:

```html
<div class="speakers-grid">
  <div class="speaker-card" data-scroll-reveal="card" data-stagger="100">
    <!-- First card -->
  </div>
  <div class="speaker-card" data-scroll-reveal="card" data-stagger="100">
    <!-- Second card (100ms delay) -->
  </div>
  <div class="speaker-card" data-scroll-reveal="card" data-stagger="100">
    <!-- Third card (200ms delay) -->
  </div>
</div>
```

The `data-stagger` value is in milliseconds and is multiplied by the element's position in its sibling group.

## Current Implementation

All major sections now have scroll reveal animations:

- ✅ **What to Expect Section** - Fade up with staggered features
- ✅ **About Section** - Fade up with image animations
- ✅ **Venue Section** - Fade up with directional animations
- ✅ **About Gallery** - Scale fade animation
- ✅ **Speakers Section** - Card animations with stagger
- ✅ **Schedule Section** - Card animations with stagger
- ✅ **Sermons Section** - Scale fade for form card

## Customization

### Adjust Animation Speed
Edit `scroll-reveal.js`:

```javascript
scrollRevealInstance = new ScrollReveal({
  duration: 800, // Animation duration in ms
  // ...
});
```

### Adjust Trigger Point
Change when animations trigger:

```javascript
scrollRevealInstance = new ScrollReveal({
  threshold: 0.1, // Trigger when 10% visible
  rootMargin: '0px 0px -80px 0px', // Trigger 80px before element enters
  // ...
});
```

### Customize CSS Animations
Edit `styles.css` - look for the "SCROLL REVEAL ANIMATIONS" section.

## Performance

- ✅ Uses `will-change` for GPU acceleration
- ✅ Respects `prefers-reduced-motion` for accessibility
- ✅ Optimized for mobile (shorter animations)
- ✅ Elements only animate once (unless reset is enabled)
- ✅ Uses Intersection Observer (efficient, no scroll listeners)

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Falls back gracefully on older browsers (elements show immediately)
- ✅ Mobile-friendly

## Accessibility

The system automatically respects user preferences:
- If `prefers-reduced-motion` is enabled, animations are disabled
- All content remains accessible without JavaScript

## Adding Animations to New Elements

1. Add `data-scroll-reveal="animation-type"` to the element
2. Choose an appropriate animation type
3. For grids/lists, add `data-stagger="100"` (or desired delay)

Example:
```html
<div class="new-section" data-scroll-reveal="fade-up">
  <h2 data-scroll-reveal="fade-up">Title</h2>
  <div class="items">
    <div class="item" data-scroll-reveal="card" data-stagger="50">Item 1</div>
    <div class="item" data-scroll-reveal="card" data-stagger="50">Item 2</div>
    <div class="item" data-scroll-reveal="card" data-stagger="50">Item 3</div>
  </div>
</div>
```

## Troubleshooting

**Animations not working?**
- Check browser console for errors
- Ensure `scroll-reveal.js` is loaded before `index.js`
- Verify elements have `data-scroll-reveal` attribute

**Animations too fast/slow?**
- Adjust `duration` in scroll-reveal.js initialization
- Modify CSS transition duration in styles.css

**Stagger not working?**
- Ensure sibling elements have the same parent
- Check that `data-stagger` value is a number (in milliseconds)

---

*Last Updated: 2025-01-27*

