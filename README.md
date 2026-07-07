# Yash Pandit — Portfolio

A single-page portfolio website built with vanilla HTML, CSS, and JavaScript. Features a Medium-inspired dark/light theme, scroll animations, a subtle Three.js particle background, and a downloadable resume PDF.

## Local Development

No build step required. Open `index.html` directly in a browser, or serve locally:

```bash
# Python
python -m http.server 8080

# Node (if npx is available)
npx serve .
```

Then visit `http://localhost:8080`.

## Deploy to GitHub Pages (Free)

1. Create a new repository on GitHub (e.g. `Portfolio` or `yashpandit97.github.io` for a user site).

2. Push this project:

```bash
git init
git add .
git commit -m "Add portfolio website"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

3. On GitHub, go to **Settings → Pages**.

4. Under **Build and deployment**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)

5. Save. Your site will be live at:
   - `https://<username>.github.io/<repo-name>/` (project site)
   - `https://<username>.github.io/` (if repo is named `<username>.github.io`)

## Custom Domain (Optional)

Add a `CNAME` file with your domain name, then configure DNS with your registrar.

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Tailwind CSS (CDN utilities)
- Three.js (CDN) — subtle hero particle field
- Google Fonts — Source Serif 4 & Inter

## Structure

```
├── index.html
├── css/styles.css
├── js/main.js
├── js/particles.js
├── assets/favicon.svg
└── assets/YASH_PANDIT_2026.pdf
```

## Notes

- Three.js works fine on GitHub Pages — it runs entirely client-side via CDN.
- Update GitHub and LinkedIn URLs in `index.html` if your profiles differ.
- Particle animation respects `prefers-reduced-motion` and pauses when the hero scrolls out of view.
