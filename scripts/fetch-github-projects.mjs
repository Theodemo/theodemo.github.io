#!/usr/bin/env node
/**
 * Fetches public repos from GitHub and generates markdown files
 * for the Astro content collection.
 *
 * - All project files are regenerated on each run (GitHub is the source of truth).
 * - README content is fetched and used as project detail page content.
 * - Supports GitHub token for higher rate limits.
 * - Paginates through all repos.
 * - Fails gracefully so the build is never blocked.
 *
 * Usage: node scripts/fetch-github-projects.mjs
 *
 * Env:
 *   GITHUB_USER  - GitHub username (default: "Theodemo")
 *   GITHUB_TOKEN - GitHub token (optional, auto-provided in Actions)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Config ──────────────────────────────────────────────

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(ROOT, "../src/content/projects");
const ASSETS_DIR = path.resolve(ROOT, "../src/assets/projects");

const USER = process.env.GITHUB_USER || "Theodemo";
const TOKEN = process.env.GITHUB_TOKEN || "";

const AUTO_MARKER = "# auto-generated: true";
const IMAGE_EXT = /\.(png|jpe?g|webp|svg|gif)$/i;

const IGNORED_REPOS = [
  "theodemo.github.io",
  "Theodemo",
  ".github",
];

// ── Helpers ─────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleize(name) {
  return name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractSkills(repo) {
  const skills = [];
  if (repo.language) skills.push(repo.language);
  if (repo.topics) {
    for (const topic of repo.topics) {
      skills.push(titleize(topic));
    }
  }
  if (skills.length === 0) skills.push("Programming");
  return [...new Set(skills)];
}

// ── GitHub API ──────────────────────────────────────────

function buildHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function fetchAllRepos() {
  const repos = [];
  const headers = buildHeaders();
  let page = 1;

  while (true) {
    const url = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);

    const batch = await res.json();
    if (batch.length === 0) break;
    repos.push(...batch);

    const link = res.headers.get("link") || "";
    if (!link.includes('rel="next"')) break;
    page++;
  }

  return repos;
}

// ── README fetch ───────────────────────────────────────

async function fetchReadme(repo) {
  const headers = buildHeaders();
  const url = `https://api.github.com/repos/${repo.full_name}/readme`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

// ── README cleanup ─────────────────────────────────────

function fixReadmeImagePaths(readmeContent, repo) {
  const rawBase = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch || "main"}`;
  // Convert relative image paths to absolute GitHub raw URLs
  // Handles: ![alt](path) and <img src="path">
  return readmeContent
    .replace(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g, `![$1](${rawBase}/$2)`)
    .replace(/<img\s([^>]*?)src="(?!https?:\/\/)([^"]+)"/g, `<img $1src="${rawBase}/$2"`);
}

// ── Image lookup ────────────────────────────────────────

function findImage(slug) {
  const dir = path.join(ASSETS_DIR, slug);
  if (!fs.existsSync(dir)) return null;

const files = fs.readdirSync(dir);
const main = files.find((f) => /^main\./i.test(f) && IMAGE_EXT.test(f));
const fallback = files.find((f) => IMAGE_EXT.test(f));
return main || fallback || null;
}

// ── Markdown generation ─────────────────────────────────

async function buildMarkdown(repo) {
  const slug = slugify(repo.name);
  const title = titleize(repo.name);
  const description = repo.description || `${title} project.`;
  const skills = extractSkills(repo);
  const startDate = repo.created_at.slice(0, 10);
  const demoUrl = repo.homepage || repo.html_url;
  const image = findImage(slug);

  const lines = [
    "---",
    AUTO_MARKER,
    `title: "${title}"`,
    `description: >-`,
    `  ${description}`,
  ];

  if (image) {
    lines.push(`image: '@assets/projects/${slug}/${image}'`);
  }

  lines.push(
    `startDate: ${startDate}`,
    `skills:`,
    ...skills.map((s) => `  - ${s}`),
    `demoLink: ${demoUrl}`,
    `sourceLink: ${repo.html_url}`,
    `---`,
    ""
  );

  // Fetch README content from GitHub
  const readme = await fetchReadme(repo);
  if (readme) {
    lines.push(fixReadmeImagePaths(readme, repo));
  } else {
    lines.push(description, "");
  }

  return { slug, content: lines.join("\n") };
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log(`Fetching repos for ${USER}...`);
  if (TOKEN) {
    console.log("  Authenticated (higher rate limit).");
  } else {
    console.log("  No GITHUB_TOKEN — unauthenticated (60 req/h).");
  }

  const repos = await fetchAllRepos();
  console.log(`  Found ${repos.length} repos.`);

  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const repo of repos) {
    if (repo.fork || IGNORED_REPOS.includes(repo.name)) {
      skipped++;
      continue;
    }

    const { slug, content } = await buildMarkdown(repo);
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);

    const exists = fs.existsSync(filePath);
    fs.writeFileSync(filePath, content, "utf-8");

    if (exists) {
      console.log(`  UPDATED: ${slug}.md`);
      updated++;
    } else {
      console.log(`  CREATED: ${slug}.md`);
      created++;
    }
  }

  console.log(`\nDone — created: ${created}, updated: ${updated}, skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Warning: failed to fetch GitHub projects:", err.message);
  console.error("Build continues with existing project files.");
  process.exit(0);
});
