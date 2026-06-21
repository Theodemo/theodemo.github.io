// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://theodemo.github.io',
  base: '/',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },

  output: "static",
});
