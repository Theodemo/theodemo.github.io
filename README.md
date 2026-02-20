# theodemo.github.io

Personal portfolio website built with [Astro](https://astro.build), [Tailwind CSS 4](https://tailwindcss.com), and [DaisyUI 5](https://daisyui.com).

## About

I'm Theo de Morais, a Master's student in Engineering specializing in Electronics, Computer Science, and Mechatronics. This portfolio showcases my projects in embedded systems, analog electronics, software development, and more.

**Live site:** [theodemo.github.io](https://theodemo.github.io)

## Features

- Static site generation with Astro 5
- Responsive design with multiple themes
- Projects auto-fetched from GitHub on build
- GitHub Pages deployment via GitHub Actions

## Development

```bash
npm install
npm run dev        # localhost:4321
npm run build      # production build
npm run preview    # preview build
```

## Project Structure

```
src/
├── assets/        # Images (hero, projects)
├── components/    # Astro components
├── content/       # Content collections (projects, hero, contact, etc.)
├── layouts/       # Page layouts
├── pages/         # Routes
└── styles/        # Global CSS
```

## Deployment

Automatically deployed to GitHub Pages on push to `main` via the workflow in `.github/workflows/deploy.yml`. Projects are fetched from the GitHub API during build.

## Credits

Based on [Bloomfolio](https://github.com/lauroguedes/bloomfolio) by Lauro Guedes.