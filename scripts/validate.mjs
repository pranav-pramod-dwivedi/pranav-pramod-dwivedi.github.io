import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'index.html',
  '404.html',
  'engineering/index.html',
  'cricket/index.html',
  'about/index.html',
  'privacy/index.html',
  'contact/index.html',
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'llms-full.txt',
  'profile.json',
  'resume.md',
  'src/css/styles.min.css',
  'src/js/app.min.js'
];

let errors = [];

console.log('--- Validating Required Build Artifacts ---');
for (const relPath of REQUIRED_FILES) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required artifact: ${relPath}`);
  } else {
    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      errors.push(`Artifact is empty (0 bytes): ${relPath}`);
    }
  }
}

console.log('--- Validating Internal Links & Asset References ---');
const htmlFiles = REQUIRED_FILES.filter(f => f.endsWith('.html'));

for (const htmlRel of htmlFiles) {
  const htmlPath = path.join(rootDir, htmlRel);
  if (!fs.existsSync(htmlPath)) continue;
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Extract href="..." and src="..."
  const linkMatches = [...content.matchAll(/(?:href|src)=["']([^"'#?]+)["']/g)];
  for (const match of linkMatches) {
    let link = match[1];
    // Skip external links, mailto, tel
    if (/^(https?:|\/\/|mailto:|tel:)/i.test(link)) continue;

    // Normalize relative and root-relative paths
    let targetFile;
    if (link.startsWith('/')) {
      targetFile = path.join(rootDir, link);
    } else {
      targetFile = path.resolve(path.dirname(htmlPath), link);
    }

    // If it's a directory link, check for index.html
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
      targetFile = path.join(targetFile, 'index.html');
    } else if (!fs.existsSync(targetFile) && fs.existsSync(targetFile + '/index.html')) {
      targetFile = targetFile + '/index.html';
    }

    if (!fs.existsSync(targetFile)) {
      errors.push(`Broken local reference in ${htmlRel}: "${link}" -> not found at ${path.relative(rootDir, targetFile)}`);
    }
  }
}

console.log('--- Validating Sitemap Loc Entries ---');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

  for (const loc of locMatches) {
    try {
      const u = new URL(loc);
      let localRel = u.pathname;
      if (localRel.endsWith('/')) localRel += 'index.html';
      const targetFile = path.join(rootDir, localRel);
      if (!fs.existsSync(targetFile)) {
        errors.push(`Sitemap URL does not resolve on disk: ${loc} -> ${localRel}`);
      }
    } catch (e) {
      errors.push(`Invalid sitemap URL syntax: ${loc}`);
    }
  }
}

if (errors.length > 0) {
  console.error('\nValidation FAILED with the following errors:');
  errors.forEach(err => console.error(`  ✖ ${err}`));
  process.exit(1);
} else {
  console.log(`\n✔ Validation SUCCESS! All ${REQUIRED_FILES.length} artifacts verified and all local links resolve cleanly.`);
}
