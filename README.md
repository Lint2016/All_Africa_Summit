# All Africa Apostolic Summit Website

A static, multi-page website for the All Africa Apostolic Summit 2026. Includes event details, registration workflow, and protected access to sermon/teaching recordings.

## Project Structure

- **`index.html`**: Landing page with event info, schedule, speakers, and a gated form that links to sermon access.
- **`register.html`**: Registration and payment options (EFT, PayPal), Firestore persistence, and Formspree notification.
- **`sermon.html`**: Tabbed, multi-day sermon/teaching recordings with share/copy anchors per card.
- **`firebase-init.js`**: Modular Firebase initialization helper used by pages to access Firestore/Auth.
- **`sermon-auth.js`**: Client logic to validate access to `sermon.html` via registered email (gating).
- **`index.js`**: Shared front-end interactions (menus, UI enhancements, etc.).
- **`styles.css` / `register.css`**: Global and page-specific styles.
- **`images/`**: Site images and social preview assets (e.g., `images/2026sum.jpeg`).
- **`preachers/`**: Speaker photos.
- **`about-folder/`**: Gallery images used on the homepage.
- **`robots.txt` / `sitemap.xml`**: Basic SEO crawl configuration.

## Key Implementation Details

- **Canonical/OG/Twitter**: Each page sets canonical and social meta. Social preview image standardized to `images/2026sum.jpeg`.
- **Sermon card IDs**: Unique, predictable IDs used for anchor sharing.
  - Day 1: `sermon1`, `sermon1a`, `sermon1b`, `sermon1c`, `sermon1d`
  - Day 2: `sermon2`, `sermon2a`, `sermon2b`, `sermon2c`, `sermon2d`
  - Day 3: `sermon3`, `sermon3a`, `sermon3b`, `sermon3c`, `sermon3d`
- **Share/copy links**: In `sermon.html`, each card computes a share URL to `window.location.origin + window.location.pathname + #<card-id>`. Buttons update per card on DOMContentLoaded.
- **SweetAlert2**: Used for user feedback (copy link toasts and registration flow). Included via CDN in pages that call `Swal` (`register.html`, `sermon.html`, and `index.html` where needed).
- **Registration**:
  - `register.html` collects attendee info and payment preference.
  - Submits to Firestore (modular SDK via `firebase-init.js`) and Formspree for email notifications.
  - EFT flow displays bank details and records user-provided EFT reference for back-office verification.
- **Performance**:
  - Non-critical images on `index.html` use `loading="lazy"` and `decoding="async"`.
  - Hero/logo images are eager with `fetchpriority="high"`.
- **SEO**:
  - `robots.txt` permits crawling; `sitemap.xml` lists main pages.
  - OG/Twitter meta configured per page.

## Prerequisites

- Modern browser (no server required for basic browsing). For modules and fetch calls, serve over HTTP(S) locally.
- Optional: Node.js (for running a local static server or future tooling).

## Local Development

Use any static server. Examples:

- Python 3:
```bash
python -m http.server 8080
```
- Node (http-server):
```bash
npx http-server -p 8080
```
Then open `http://localhost:8080/`.

Ensure that Firebase calls and external script CDNs are reachable from your environment.

## Firebase Setup (modular)

- `firebase-init.js` should export a function that initializes Firebase and returns `{ db, auth }`.
- Pages using Firestore import functions from `https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js` or from your bundler.
- Do not expose secrets in client code. Security rules must restrict writes appropriately.

### Environment Notes

- `register.html` expects Firestore write access to `registrations` collection.
- Formspree endpoint is configured in `register.html` (`https://formspree.io/f/xgvnvzzr`). Replace with your own if needed.

## Deployment

- Host as static files (e.g., Netlify, Vercel, GitHub Pages, Firebase Hosting, or any web host).
- Ensure production URLs match canonical/OG `og:url` values:
  - `index.html`: `https://www.aaasummit.co.za/`
  - `register.html`: `https://www.aaasummit.co.za/register.html`
  - `sermon.html`: `https://www.aaasummit.co.za/sermon.html`
- Upload `robots.txt` and `sitemap.xml` at the domain root.

## Hosting Guide

### Netlify

1. Create a new site from your repository or drag-and-drop the folder in the Netlify UI.
2. Build settings: none required (static site). Leave build command empty and publish directory as the repo root.
3. After deploy, set a custom domain and add your DNS A/CNAME records per Netlify instructions.
4. Confirm `robots.txt` and `sitemap.xml` resolve under your domain root.

### Vercel

1. Import the project in Vercel (static site, no build step required).
2. Set output directory to the repo root.
3. Assign custom domain and update DNS as instructed by Vercel.
4. Verify canonical and OG URLs point to production domain.

### Firebase Hosting

1. Install CLI and initialize hosting in the project folder:
```bash
npm i -g firebase-tools
firebase login
firebase init hosting
```
2. For questions during init:
   - Use existing project or create a new one.
   - Public directory: `.` (dot) to serve from repository root, or create `/public` and move files there.
   - Single-page app: `No`.
3. Deploy:
```bash
firebase deploy
```
4. Set up custom domain in Firebase Hosting and add DNS records. Ensure `robots.txt`/`sitemap.xml` appear at domain root.

### cPanel or Generic Shared Hosting

1. Upload all files and folders to your document root (often `public_html/`).
2. Ensure `robots.txt` and `sitemap.xml` are in the document root.
3. If moving files into a subfolder, update canonical/OG `og:url` values accordingly.

### DNS Notes

- Point your apex/root domain and `www` to the hosting provider per their instructions.
- After DNS propagation, verify:
  - Canonical links and OG `og:url` match the live domain.
  - OG/Twitter images render correctly when testing links (use Facebook Sharing Debugger / Twitter Card Validator).

## Content Editing Guide

- **Social preview image**: Replace `images/2026sum.jpeg` with any 1200×630 (or larger) image and update meta in `index.html`, `register.html`, and `sermon.html` if you want a different file.
- **Speakers**: Add new entries under the speakers grid in `index.html` and drop photos in `preachers/`. Provide descriptive `alt` text.
- **Sermons**: In `sermon.html`, duplicate a card, give it a unique ID per the naming scheme, and update `source` paths and speaker text.
- **Bank details**: Edit the EFT panel in `register.html` if banking info changes.

## Accessibility & UX

- Descriptive `alt` text added to images.
- Clear button labels and aria attributes on interactive elements.
- Toasts for feedback (copy/share, registration actions).

## Known/Optional Improvements

- **Remove compat SDKs**: `index.html` includes Firebase compat scripts; consider removing if all pages use modular only.
- **CSP/SRI**: Add Subresource Integrity for CDNs and configure a basic CSP on the host for enhanced security.
- **Image dimensions**: Add explicit `width`/`height` to reduce layout shift where practical.
- **Analytics**: If GA4 is desired, wire `window.safeLogEvent` to your analytics provider.

## License

Proprietary content © All Africa Apostolic Summit. Do not redistribute without permission.
