# Solar Pong — Claude Notes

## Project overview
A single-page browser game: Pong with a solar system theme. Built with plain HTML + p5.js (loaded from CDN). No build step, no bundler, no dependencies to install.

## File layout
- `index.html` — shell; loads p5.js from CDN and `sketch.js`
- `sketch.js` — all game logic (p5.js global mode)

## Deployment
Deploys directly to **Cloudflare Pages** as a static site:
- Build command: _(none)_
- Output directory: `/` (repo root)

## Tech constraints
- No build step, no Node.js toolchain. Keep everything vanilla JS.
- p5.js global mode (not instance mode) — `setup()`, `draw()`, etc. live at the top level.
- Target canvas size: 800 × 600. Centered in a black full-viewport body.
