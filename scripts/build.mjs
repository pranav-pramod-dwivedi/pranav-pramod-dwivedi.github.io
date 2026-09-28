import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = 'https://pranav-dwivedi.pages.dev';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// HTML to Markdown converter for agentic content negotiation
function htmlToMarkdown(html, { title = '', url = '' } = {}) {
  let text = String(html || '');
  const mainMatch = text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) text = mainMatch[1];

  // Convert tables
  text = text.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (m, inner) => {
    const rows = [...inner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(r =>
      [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c =>
        c[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|')
      )
    );
    if (!rows.length) return '';
    const width = Math.max(...rows.map(r => r.length));
    const norm = rows.map(r => { const c = r.slice(); while (c.length < width) c.push(''); return c; });
    const out = [];
    out.push('| ' + norm[0].join(' | ') + ' |');
    out.push('| ' + Array(width).fill('---').join(' | ') + ' |');
    for (let i = 1; i < norm.length; i++) out.push('| ' + norm[i].join(' | ') + ' |');
    return '\n' + out.join('\n') + '\n';
  });

  // Convert lists
  text = text.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (m, inner) =>
    inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (mm, li) => `\n1. ${li.replace(/<[^>]+>/g, '').trim()}\n`)
  );
  text = text.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (m, inner) =>
    inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (mm, li) => `\n- ${li.replace(/<[^>]+>/g, '').trim()}\n`)
  );

  // Convert headings
  text = text.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, lvl, inner) =>
    '\n\n' + '#'.repeat(Number(lvl)) + ' ' + inner.replace(/<[^>]+>/g, '').trim() + '\n'
  );

  // Remove scripts, styles, SVGs
  text = text.replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert links
  text = text.replace(/<a\b[^>]*href="([^"#]*)"[^>]*>\s*([\s\S]*?)<\/a>/gi, (m, href, inner) => {
    const linkText = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!linkText) return '';
    return `[${linkText}](${href})`;
  });

  // Basic formatting
  text = text.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  text = text.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '_$2_');
  text = text.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  text = text.replace(/<[^>]+>/g, '');

  let clean = text
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const header = [];
  if (title) header.push('# ' + title, '');
  if (url) header.push('Source: ' + url, '');
  return (header.length ? header.join('\n') + '\n' : '') + clean + '\n';
}

function writePageWithMd(relHtmlPath, html, title, canonicalUrl) {
  const fullHtmlPath = path.join(rootDir, relHtmlPath);
  ensureDir(path.dirname(fullHtmlPath));
  fs.writeFileSync(fullHtmlPath, html, 'utf-8');

  // Generate .md sibling
  let mdPath;
  if (relHtmlPath === 'index.html') mdPath = 'index.md';
  else if (relHtmlPath === '404.html') mdPath = '404.md';
  else mdPath = relHtmlPath.replace(/\/index\.html$/, '.md');

  const fullMdPath = path.join(rootDir, mdPath);
  ensureDir(path.dirname(fullMdPath));
  fs.writeFileSync(fullMdPath, htmlToMarkdown(html, { title, url: canonicalUrl }), 'utf-8');
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
    .replace(/\;(?=\})/g, '')
    .trim();
}

function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ------------------------------------------------------------
// DATA REPOSITORIES
// ------------------------------------------------------------
const engineeringProjects = [
  {
    id: 'jarvis',
    title: 'JARVIS — Autonomous Android & Linux Personal AI',
    category: 'AI & Systems',
    status: 'Active / Core',
    description: 'Autonomous personal AI assistant running on rooted Android (Termux) and Linux. Features persistent long-term memory, dynamic tool calling, Android system automation, file access, local/cloud model routing, and OpenCode integration.',
    tags: ['Python', 'Android', 'Termux', 'Tool Calling', 'Local LLMs', 'FastAPI'],
    github: 'https://github.com/pranav-pramod-dwivedi/jarvis',
    featured: true,
    highlights: ['Device automation beyond chatboxes', 'Zero-slop system integration', 'Persistent memory architecture']
  },
  {
    id: 'cricket-motion-analysis',
    title: 'Cricket Batting Biomechanics & Motion Analysis',
    category: 'Computer Vision',
    status: 'Production Ready',
    description: 'Webcam-based real-time cricket batting analysis pipeline. Leverages MediaPipe 33-point pose landmark estimation + bat velocity tracking, swing trajectory scoring, and phone-as-camera wireless streaming.',
    tags: ['Python', 'OpenCV', 'MediaPipe', 'NumPy', 'Computer Vision'],
    github: 'https://github.com/pranav-pramod-dwivedi/cricket-motion-analysis',
    featured: true,
    highlights: ['Real-time swing vector tracking', 'Biomechanics kinematic scoring', 'Low-latency mobile camera mode']
  },
  {
    id: 'axiom',
    title: 'Axiom & Axiom Brain — Local Agent UI',
    category: 'AI & Systems',
    status: 'Private / Active',
    description: 'Local and private agent UI with continuous voice pipeline, embedded console, services daemon, and cross-device brain synchronization between Mac and Android via Git.',
    tags: ['TypeScript', 'Python', 'Node.js', 'Voice AI', 'Agentic UX'],
    github: 'https://github.com/pranav-pramod-dwivedi/axiom',
    featured: true,
    highlights: ['Dual-node brain sync (Mac + Android)', 'Low-latency Jarvis voice', 'Embedded agent terminal']
  },
  {
    id: 'visa-pay',
    title: 'VISA-PAY 2.0 — Fluid Fintech Interface',
    category: 'Frontend & UI',
    status: 'Shipped',
    description: 'Handcrafted digital banking interface exploring modern fintech design, buttery 60fps micro-interactions, liquid-glass aesthetic, and zero-dependency precision frontend architecture.',
    tags: ['JavaScript', 'CSS3', 'SVG', 'Micro-interactions', 'Performance'],
    github: 'https://github.com/pranav-pramod-dwivedi/VISA-PAY-2.0',
    featured: false,
    highlights: ['Award-winning craft & layout', 'Zero external heavy libraries', 'Fluid responsive scaling']
  },
  {
    id: 'pixel-arena',
    title: 'PiXel Arena — Competitive Tournament Engine',
    category: 'Esports & Web',
    status: 'Shipped',
    description: 'Competitive Free Fire tournament engine built on Firebase. Powers bracket management, match registration, real-time leaderboards, automated scoring, and hardened Firestore security rules.',
    tags: ['JavaScript', 'Firebase', 'Firestore Rules', 'Esports'],
    github: 'https://github.com/pranav-pramod-dwivedi/PiXel-Arena',
    featured: false,
    highlights: ['Automated bracket progression', 'Hardened security rules', 'Live squad leaderboards']
  },
  {
    id: 'mtproto-zig',
    title: 'MTProto.zig — Obfuscated TLS Proxy',
    category: 'Networking',
    status: 'Open Source',
    description: 'High-efficiency, tiny self-hosted Telegram MTProto proxy implemented in Zig that masks network traffic within plain HTTPS TLS connections to bypass aggressive DPI firewalls.',
    tags: ['Zig', 'Networking', 'TLS Cryptography', 'Low-Level'],
    github: 'https://github.com/pranav-pramod-dwivedi/mtproto.zig',
    featured: false,
    highlights: ['Zero memory leaks in Zig', 'DPI evasion', 'Minimal CPU footprint']
  }
];

const cricketStats = {
  jersey: 7,
  team: 'Destroyers Cricket Club (DES)',
  role: 'Captain & Premier All-Rounder',
  battingStyle: 'Right-Hand Bat (Aggressive Top/Middle Order)',
  bowlingStyle: 'Right-Arm Fast-Medium & Strike Off-Spin',
  origin: 'Rewa, Madhya Pradesh, India',
  association: 'Rewa Division Cricket Association (RDCA) • MPCA Circuit',
  tournament: 'Atal Bihari Vajpayee Memorial Tournament (Rewa)',
  matches: 34,
  derbyWins: 19,
  runs: 1435,
  battingAvg: 57.40,
  strikeRate: 146.43,
  highestScore: '102*',
  fifties: 14,
  hundreds: 1,
  wickets: 66,
  bowlingAvg: 16.30,
  economy: 5.48,
  bestBowling: '8/39',
  titles: [
    { year: '2026', desc: 'Atal Bihari Vajpayee Memorial Trophy Champions (3-2 vs Dread Eleven) & Final MVP (82 runs off 44 balls & 3/28)' },
    { year: '2025', desc: 'Atal Bihari Vajpayee Memorial Trophy Champions (5-0 Clean Sweep) & Rewa Derby Player of the Year' },
    { year: '2024', desc: 'Atal Bihari Vajpayee Memorial Trophy Champions (4-1 Series Victory) & Aggregate Leader' }
  ]
};

const PRANAV_SAME_AS = [
  'https://pranav-dwivedi.pages.dev/',
  'https://pranav-pramod-dwivedi.github.io/',
  'https://github.com/pranav-pramod-dwivedi',
  'https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/',
  'https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi',
  'https://abv-rewacricket.pages.dev/',
  'https://cricheroes.com/association/79/rewa-divisional-cricket-association/home',
  'https://cricheroes.com/tournament/2168281/atal-bihari-vajpayee-cricket-tournament-season-3/matches/live-matches',
  'https://www.instagram.com/destroyers_rewa',
  'https://www.facebook.com/rewa.cricket.association'
];

const entityAnchors = [
  {
    name: 'Official GitHub Pages Deployment',
    url: 'https://pranav-pramod-dwivedi.github.io/',
    badge: 'Root Host Mirror',
    desc: 'Primary GitHub Pages production host mirror serving the certified portfolio and machine-readable endpoints.'
  },
  {
    name: 'RDCA Central Official Registry',
    url: 'https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/',
    badge: 'State Division Archive',
    desc: 'Certified career scorecard telemetry, team registrations, and player registry maintained by the Rewa Division Cricket Association.'
  },
  {
    name: 'Destroyers CC Franchise Portal',
    url: 'https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi',
    badge: 'Club Headquarters',
    desc: 'Official club dossier, match-by-match leaderboards, and captaincy telemetry for Destroyers Cricket Club.'
  },
  {
    name: 'Atal Bihari Vajpayee Memorial Tournament',
    url: 'https://abv-rewacricket.pages.dev/',
    badge: 'Tournament Hub',
    desc: 'Official tournament governing portal, certified multi-season scorecards, and roll of honour.'
  },
  {
    name: 'CricHeroes Association 79 (RDCA)',
    url: 'https://cricheroes.com/association/79/rewa-divisional-cricket-association/home',
    badge: 'Grassroots Scoring',
    desc: 'Digital cricket platform tracking regional divisional cricket in Rewa.'
  },
  {
    name: 'GitHub Profile & Code Repositories',
    url: 'https://github.com/pranav-pramod-dwivedi',
    badge: 'Open Source Code',
    desc: 'Primary code repository for autonomous AI agents, Android systems experimentation, and computer vision.'
  },
  {
    name: 'Official Instagram Handle',
    url: 'https://www.instagram.com/destroyers_rewa',
    badge: 'Media Footprint',
    desc: 'Verified public social channel tracking live match updates and team announcements.'
  }
];

// ------------------------------------------------------------
// HEAD & LAYOUT TEMPLATES
// ------------------------------------------------------------
function renderHead({ title, description, canonicalUrl = '/', jsonLd = [] }) {
  const fullUrl = `${BASE_URL}${canonicalUrl === '/' ? '' : canonicalUrl}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="Pranav Dwivedi, Pranav Pramod Dwivedi, software engineer, AI systems, autonomous agents, cricket captain, Destroyers Cricket Club, Rewa cricket, RDCA, Atal Bihari Vajpayee Memorial Tournament">
  <meta name="author" content="Pranav Pramod Dwivedi">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${fullUrl}">

  <!-- Google Search Console Verification -->
  <meta name="google-site-verification" content="google23e3ba68f31a1fe8">

  <!-- PWA & Theme -->
  <meta name="theme-color" content="#06080a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/logo-192.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <!-- AI Crawler & Machine-Readable Discovery -->
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full LLM Context & Dossier">
  <link rel="alternate" type="application/json" href="/profile.json" title="Structured Profile API">

  <!-- OpenGraph / Facebook -->
  <meta property="og:site_name" content="Pranav Dwivedi">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${BASE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="profile:first_name" content="Pranav">
  <meta property="profile:last_name" content="Dwivedi">
  <meta property="profile:username" content="pranav-pramod-dwivedi">
  <meta property="profile:gender" content="male">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${BASE_URL}/og-image.png">

  <!-- Typography: Syne (Display), Barlow Condensed (Athletic), Plus Jakarta Sans (Body), JetBrains Mono (Telemetry) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,700;1,900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800;900&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/src/css/styles.min.css">

  ${(Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : [])).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n  ')}
</head>
<body>
  <!-- Ambient High-Performance 60fps Micro-Canvas FX -->
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <div class="site-wrapper">
`;
}

function renderHeader(activeNav = '') {
  const links = [
    { label: 'Overview', href: '/', key: 'home' },
    { label: 'Engineering', href: '/engineering', key: 'engineering' },
    { label: 'Cricket (#7)', href: '/cricket', key: 'cricket' },
    { label: 'About', href: '/about', key: 'about' },
    { label: 'Contact', href: '/contact', key: 'contact' }
  ];

  return `
  <!-- SITE HEADER NAVIGATION -->
  <header class="site-header">
    <div class="container nav-container">
      <a href="/" class="brand-monogram" aria-label="Pranav Dwivedi — Home">
        <img class="brand-logo" src="/logo.png" alt="Official insignia of Pranav Dwivedi" width="44" height="44" />
        <div class="brand-title">
          <span class="brand-name">PRANAV DWIVEDI</span>
          <span class="brand-sub">Systems Software &bull; Autonomous AI &bull; Athletics</span>
        </div>
      </a>

      <nav class="primary-nav" aria-label="Main Navigation">
        ${links.map(l => `
          <a href="${l.href}" class="nav-link ${activeNav === l.key ? 'active' : ''}">
            ${esc(l.label)}
          </a>
        `).join('')}
      </nav>

      <div class="header-actions">
        <a href="https://github.com/pranav-pramod-dwivedi" target="_blank" rel="noopener" class="btn-sm btn-outline" aria-label="GitHub Profile">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          <span>GitHub</span>
        </a>
        <a href="/contact" class="btn-sm btn-cyan">
          <span>Connect</span>
        </a>
        <button type="button" class="mobile-toggle" id="mobile-toggle-btn" aria-label="Toggle Navigation">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div class="mobile-drawer" id="mobile-drawer">
      <div class="mobile-drawer-links">
        ${links.map(l => `
          <a href="${l.href}" class="mobile-link ${activeNav === l.key ? 'active' : ''}">
            ${esc(l.label)}
          </a>
        `).join('')}
        <a href="https://github.com/pranav-pramod-dwivedi" target="_blank" rel="noopener" class="mobile-link">
          GitHub Profile ↗
        </a>
        <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener" class="mobile-link">
          RDCA Central Registry ↗
        </a>
      </div>
    </div>
  </header>
  `;
}

function renderFooter() {
  return `
  <!-- SITE FOOTER -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top-grid">
        <div>
          <div class="brand-monogram" style="margin-bottom:1rem;">
            <img class="brand-logo" src="/logo.png" alt="Official insignia of Pranav Dwivedi" width="44" height="44" />
            <div class="brand-title">
              <span class="brand-name" style="color:var(--c-white); font-size:1.2rem;">PRANAV DWIVEDI</span>
              <span class="brand-sub">Independent Systems Software Engineer &bull; Autonomous AI &bull; 3x Champion</span>
            </div>
          </div>
          <p style="color:var(--c-muted); max-width:44ch; font-size:0.9rem; line-height:1.6; margin-bottom:1.25rem;">
            Building real autonomous AI systems, hacking Android &amp; device toolchains, and captaining Destroyers Cricket Club to consecutive championships in Rewa, Madhya Pradesh.
          </p>
          <div class="footer-badges-row">
            <span class="badge-tech">Python</span>
            <span class="badge-tech">Android / Linux</span>
            <span class="badge-tech">FastAPI</span>
            <span class="badge-tech">MediaPipe</span>
            <span class="badge-tech">Destroyers CC #7</span>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">Entity Authority Anchors</h3>
          <ul class="footer-list">
            <li><a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener">RDCA Central Registry ↗</a></li>
            <li><a href="https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi" target="_blank" rel="noopener">Destroyers CC Profile ↗</a></li>
            <li><a href="https://abv-rewacricket.pages.dev/" target="_blank" rel="noopener">ABV Memorial Tournament Hub ↗</a></li>
            <li><a href="https://cricheroes.com/association/79/rewa-divisional-cricket-association/home" target="_blank" rel="noopener">CricHeroes Association 79 ↗</a></li>
            <li><a href="https://github.com/pranav-pramod-dwivedi" target="_blank" rel="noopener">GitHub Profile ↗</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer-heading">Navigation &amp; Machine Data</h3>
          <ul class="footer-list">
            <li><a href="/engineering">Software &amp; AI Systems</a></li>
            <li><a href="/cricket">Athletic Career &amp; Honors</a></li>
            <li><a href="/about">Background &amp; Philosophy</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/contact">Get in Touch</a></li>
            <li><a href="/llms.txt">LLM Discovery (llms.txt)</a></li>
            <li><a href="/resume.md">Raw Markdown Resume (.md)</a></li>
            <li><a href="/profile.json">Structured Entity Profile (.json)</a></li>
            <li><a href="/sitemap.xml">XML Sitemap</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-row">
        <p>&copy; ${new Date().getFullYear()} Pranav Pramod Dwivedi. All rights reserved. Rewa, Madhya Pradesh, India.</p>
        <p style="font-family:var(--f-mono); font-size:0.8rem; color:var(--c-subtle);">Canonical Entity URI: <span style="color:var(--c-gold);">${BASE_URL}/</span></p>
      </div>
    </div>
  </footer>
  </div><!-- .site-wrapper -->

  <script src="/src/js/app.min.js"></script>
</body>
</html>
  `;
}

// ------------------------------------------------------------
// 1. GENERATE HOMEPAGE (index.html)
// ------------------------------------------------------------
function generateHomePage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${BASE_URL}/#profilepage`,
      url: `${BASE_URL}/`,
      name: 'Pranav Dwivedi — Official Profile & Canonical Entity Home',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: 'Pranav Dwivedi Official Hub',
        url: `${BASE_URL}/`
      },
      mainEntity: {
        '@id': `${BASE_URL}/#person`
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      name: 'Pranav Dwivedi Official Hub',
      url: `${BASE_URL}/`,
      author: { '@id': `${BASE_URL}/#person` },
      description: 'Official portfolio and entity hub for Pranav Dwivedi: AI systems engineer and 3x champion cricket captain in Rewa, MP.'
    },
    {
      '@context': 'https://schema.org',
      '@type': ['Person', 'Athlete'],
      '@id': `${BASE_URL}/#person`,
      name: 'Pranav Dwivedi',
      alternateName: [
        'Pranav Pramod Dwivedi',
        'Capt. Pranav Dwivedi',
        'Pranav Dwivedi Rewa',
        'P. Dwivedi'
      ],
      jobTitle: 'Software Engineer & 3x Champion Cricket Captain',
      description: 'Official personal website and Google Knowledge Graph canonical entity home for Pranav Dwivedi (Pranav Pramod Dwivedi). AI systems builder, autonomous agent developer, and 3-time consecutive champion captain (#7) of Destroyers Cricket Club in the Atal Bihari Vajpayee Memorial Tournament, Rewa. All-time tournament leading run scorer (1,435 runs) and leading wicket taker (66 wickets).',
      url: `${BASE_URL}/`,
      identifier: 'DES-7',
      gender: 'https://schema.org/Male',
      nationality: {
        '@type': 'Country',
        name: 'India'
      },
      birthPlace: {
        '@type': 'Place',
        name: 'Rewa, Madhya Pradesh, India'
      },
      memberOf: [
        {
          '@type': 'SportsTeam',
          name: 'Destroyers Cricket Club (DES)',
          url: 'https://destroyers-rewacricket.pages.dev',
          sport: 'Cricket'
        },
        {
          '@type': 'SportsOrganization',
          name: 'Rewa Division Cricket Association (RDCA)',
          url: 'https://rewa-cricket-division.vercel.app',
          sport: 'Cricket'
        }
      ],
      knowsAbout: [
        'Artificial Intelligence',
        'Autonomous Agents',
        'Tool Calling',
        'Android Internals',
        'Computer Vision',
        'MediaPipe',
        'Cricket',
        'All-Rounder',
        'Destroyers Cricket Club',
        'Atal Bihari Vajpayee Memorial Tournament',
        'Rewa Cricket',
        'Rewa Division Cricket Association'
      ],
      award: [
        '2026 Atal Bihari Vajpayee Memorial Trophy Champion Captain (3-2 vs Dread Eleven)',
        '2025 Atal Bihari Vajpayee Memorial Trophy Champion Captain (5-0 Clean Sweep)',
        '2024 Atal Bihari Vajpayee Memorial Trophy Champion Captain (4-1 Series Victory)',
        'Atal Bihari Vajpayee Memorial Tournament All-Time Leading Run Scorer (1,435 runs)',
        'Atal Bihari Vajpayee Memorial Tournament All-Time Leading Wicket Taker (66 wickets)',
        'Rewa Derby Player of the Year 2025',
        'Man of the Match - 2026 Championship Final (82 runs off 44 balls & 3/28)'
      ],
      sameAs: PRANAV_SAME_AS,
      mainEntityOfPage: `${BASE_URL}/`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who is Pranav Dwivedi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pranav Dwivedi (Pranav Pramod Dwivedi) is an Indian systems software engineer, AI builder, and competitive cricketer from Rewa, Madhya Pradesh. He builds autonomous agent architectures and Android automation systems, and captains Destroyers Cricket Club (DES) in the Atal Bihari Vajpayee Memorial Tournament under the Rewa Division Cricket Association.'
          }
        },
        {
          '@type': 'Question',
          name: 'What are Pranav Dwivedi\'s official cricket records and statistics?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In official tournament play, Pranav Dwivedi has captained Destroyers to three consecutive championships (2024, 2025, 2026). He is the tournament\'s all-time leading run scorer with 1,435 runs at a 57.4 average (146.4 strike rate, 14 fifties, 1 century) and the all-time leading wicket taker with 66 wickets at a 16.3 average (career best 8/39).'
          }
        },
        {
          '@type': 'Question',
          name: 'What software and AI projects has Pranav Dwivedi created?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'His key engineering projects include JARVIS (an autonomous personal AI assistant for Android and Linux), Cricket Motion Analysis (a computer vision pose estimation tool for batting biomechanics), Axiom (a private local agent framework), VISA-PAY 2.0 (a fluid fintech interface), and PiXel Arena (a competitive esports tournament platform).'
          }
        },
        {
          '@type': 'Question',
          name: 'Where can Pranav Dwivedi\'s records and code be verified?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'His code is on GitHub at https://github.com/pranav-pramod-dwivedi, his divisional cricket registry is maintained by the Rewa Division Cricket Association at https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/, and his club profile is at https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi.'
          }
        }
      ]
    }
  ];

  const html = `
${renderHead({
  title: 'Pranav Dwivedi — Systems Engineer, AI Builder & 3x Champion Cricket Captain',
  description: 'Official website of Pranav Dwivedi (Pranav Pramod Dwivedi). Building autonomous AI agents, Android systems, and captaining Destroyers Cricket Club (#7) to 3 consecutive championships in Rewa, MP.',
  canonicalUrl: '/',
  jsonLd
})}
${renderHeader('home')}

<!-- HERO SECTION: INDEPENDENT EDITORIAL SPOTLIGHT -->
<section class="hero-section">
  <div class="container">
    <div class="hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          <span>Official Independent Home &bull; Rewa, MP, India</span>
        </div>

        <h1 class="hero-title">
          PRANAV <span class="accent-cyan">DWIVEDI</span>
        </h1>

        <p class="hero-roles">
          Systems Software Engineer <span class="sep">&bull;</span> Autonomous AI Builder <span class="sep">&bull;</span> 3x Champion Cricket Captain
        </p>

        <p class="hero-lead">
          I build autonomous AI agents that operate directly on rooted Android and Linux devices, design computer vision kinematics pipelines, and captain <strong>Destroyers Cricket Club</strong> to championship victories in Rewa, Madhya Pradesh.
        </p>

        <div class="hero-cta-group">
          <a href="/engineering" class="btn btn-primary">
            Explore Systems &amp; AI &rarr;
          </a>
          <a href="/cricket" class="btn btn-secondary">
            Cricket Dossier &amp; Stats (#7) &rarr;
          </a>
          <a href="#backlinks-hub" class="btn btn-ghost">
            Network Backlinks ↗
          </a>
        </div>
      </div>

      <!-- Dual-Engine Interactive Telemetry Card -->
      <div class="hero-engine-card">
        <div class="engine-card-nav" role="tablist" aria-label="Hero telemetry engine tabs">
          <button type="button" class="engine-nav-tab active" data-engine="systems">
            <span class="pulse-dot"></span> Systems Telemetry
          </button>
          <button type="button" class="engine-nav-tab" data-engine="athletics">
            <span style="color:var(--c-gold)">🏆</span> Athletic Honors (#7)
          </button>
        </div>

        <!-- Panel 1: Systems Engineering Telemetry -->
        <div class="engine-panel" id="engine-panel-systems">
          <div class="terminal-console">
            <div class="console-line"><span class="console-prompt">$</span> jarvis --daemon --platform=rooted-android</div>
            <div class="console-line"><span class="console-tag-cyan">[INIT]</span> Persistent Memory (SAF + Vector Store): OK</div>
            <div class="console-line"><span class="console-tag-green">[TOOL]</span> Termux API (Phone / SMS / Cam / Sensors): ACTIVE</div>
            <div class="console-line"><span class="console-tag-cyan">[VISION]</span> MediaPipe 33-point Batting Pose Score: 94.2%</div>
            <div class="console-line"><span class="console-tag-green">[SYNC]</span> Axiom Brain: macOS &harr; Android Git Daemon</div>
          </div>

          <div class="engine-stat-grid">
            <div class="engine-mini-stat">
              <span class="engine-stat-lbl">Core Architecture</span>
              <span class="engine-stat-val" style="color:var(--c-cyan-bright); font-size:1.15rem;">Autonomous Agents</span>
              <span class="engine-stat-sub">Hardware Tool Calling</span>
            </div>
            <div class="engine-mini-stat">
              <span class="engine-stat-lbl">Systems Focus</span>
              <span class="engine-stat-val" style="color:var(--c-emerald); font-size:1.15rem;">Rooted Android</span>
              <span class="engine-stat-sub">Termux &bull; Linux &bull; Vision</span>
            </div>
          </div>
        </div>

        <!-- Panel 2: Athletics & Honours Telemetry -->
        <div class="engine-panel" id="engine-panel-athletics" style="display:none;">
          <div class="engine-stat-grid" style="margin-top:0;">
            <div class="engine-mini-stat">
              <span class="engine-stat-lbl">Tournament Runs</span>
              <span class="engine-stat-val accent-gold">1,435</span>
              <span class="engine-stat-sub">Avg 57.40 &bull; SR 146.43 (Record #1)</span>
            </div>
            <div class="engine-mini-stat">
              <span class="engine-stat-lbl">Tournament Wickets</span>
              <span class="engine-stat-val accent-emerald">66</span>
              <span class="engine-stat-sub">Avg 16.30 &bull; Best 8/39 (Record #1)</span>
            </div>
            <div class="engine-mini-stat">
              <span class="engine-stat-lbl">Franchise Captaincy</span>
              <span class="engine-stat-val">34 Clashes</span>
              <span class="engine-stat-sub">19 Derby Wins &bull; Jersey #7</span>
            </div>
            <div class="engine-mini-stat">
              <span class="engine-stat-lbl">Championship Dynasty</span>
              <span class="engine-stat-val accent-gold">3 Titles</span>
              <span class="engine-stat-sub">2024 &bull; 2025 &bull; 2026</span>
            </div>
          </div>
        </div>

        <div class="engine-card-footer">
          <span>Verified on RDCA Central Registry &amp; GitHub</span>
          <a href="#backlinks-hub" class="link-arrow">All Backlinks &rarr;</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- MAIN SECTION WITH DUAL DISCIPLINE TABS -->
<main class="container page-content">
  <!-- DUAL DISCIPLINE SWITCHER -->
  <div class="discipline-section">
    <div class="section-head-row">
      <div>
        <p class="section-tag">DUAL DISCIPLINE SHOWCASE</p>
        <h2 class="section-title">Engineering Systems &amp; Dominating the Pitch</h2>
      </div>
      <div class="tab-btn-group" role="tablist" aria-label="Discipline switcher">
        <button type="button" class="tab-btn active" data-tab="all">All Disciplines</button>
        <button type="button" class="tab-btn" data-tab="engineering">Software &amp; AI</button>
        <button type="button" class="tab-btn" data-tab="cricket">Cricket &bull; #7</button>
      </div>
    </div>

    <!-- 1. ENGINEERING SHOWCASE GRID -->
    <div class="discipline-block" id="block-engineering">
      <div class="discipline-header">
        <h3 class="discipline-subheading">Featured Software &amp; AI Systems</h3>
        <a href="/engineering" class="link-arrow">View All Projects &rarr;</a>
      </div>

      <div class="projects-grid">
        ${engineeringProjects.slice(0, 4).map(p => `
          <div class="project-card">
            <div class="project-card-head">
              <span class="badge-category">${esc(p.category)}</span>
              <span class="project-status">${esc(p.status)}</span>
            </div>
            <h4 class="project-title">${esc(p.title)}</h4>
            <p class="project-desc">${esc(p.description)}</p>
            <div class="project-tags">
              ${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            </div>
            <div class="project-footer">
              <a href="${p.github}" target="_blank" rel="noopener" class="btn-project-link">
                GitHub Repository ↗
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 2. CRICKET HONOURS & DYNASTY CABINET -->
    <div class="discipline-block" id="block-cricket" style="margin-top:3.5rem;">
      <div class="discipline-header">
        <h3 class="discipline-subheading">Championship Dynasty &amp; Athletic Honours</h3>
        <a href="/cricket" class="link-arrow">Complete Cricket Dossier &rarr;</a>
      </div>

      <div class="trophy-grid">
        ${cricketStats.titles.map(t => `
          <div class="trophy-card">
            <div class="trophy-badge">${esc(t.year)} CHAMPION</div>
            <h4 class="trophy-title">${esc(t.year)} Atal Bihari Vajpayee Memorial Trophy</h4>
            <p class="trophy-desc">${esc(t.desc)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- 3. COMPREHENSIVE AUTHORITATIVE NETWORK & ALL BACKLINKS MATRIX -->
  <section class="backlinks-hub" id="backlinks-hub">
    <div class="section-head-row" style="margin-bottom:1rem;">
      <div>
        <p class="section-tag">AUTHORITY NETWORK &bull; COMPLETE BACKLINKS MATRIX</p>
        <h2 class="section-title">Verified Knowledge Graph Endpoints &amp; All Backlinks</h2>
      </div>
    </div>
    <p class="section-intro" style="margin-bottom:2rem;">
      Authoritative reciprocal endpoints establishing Pranav Dwivedi's disambiguated entity across software systems code, regional sports governance, tournament archives, and machine-readable APIs:
    </p>

    <div class="backlinks-category-grid">
      <!-- 1. Code & Open Source Repositories -->
      <div class="backlink-group">
        <h3 class="backlink-group-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          Code &amp; Repositories
        </h3>
        <ul class="backlink-list">
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi" target="_blank" rel="noopener">GitHub Profile ↗</a>
            <span class="meta">Core developer profile &amp; repositories</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/jarvis" target="_blank" rel="noopener">JARVIS Assistant ↗</a>
            <span class="meta">Rooted Android &amp; Linux AI agent</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/cricket-motion-analysis" target="_blank" rel="noopener">Cricket Motion Analysis ↗</a>
            <span class="meta">MediaPipe batting kinematics pipeline</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/axiom" target="_blank" rel="noopener">Axiom Agent UI ↗</a>
            <span class="meta">Local agent framework &amp; brain sync</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/VISA-PAY-2.0" target="_blank" rel="noopener">VISA-PAY 2.0 ↗</a>
            <span class="meta">60fps micro-interaction fintech UI</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/PiXel-Arena" target="_blank" rel="noopener">PiXel Arena ↗</a>
            <span class="meta">Competitive esports tournament platform</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/mtproto.zig" target="_blank" rel="noopener">MTProto.zig ↗</a>
            <span class="meta">Obfuscated TLS proxy in Zig</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/pranav-dwivedi" target="_blank" rel="noopener">Portfolio Source Repo ↗</a>
            <span class="meta">Source repository on GitHub</span>
          </li>
          <li class="backlink-item">
            <a href="https://github.com/pranav-pramod-dwivedi/pranav-pramod-dwivedi.github.io" target="_blank" rel="noopener">GitHub Pages Host Repo ↗</a>
            <span class="meta">Root domain host repository</span>
          </li>
        </ul>
      </div>

      <!-- 2. Official Sports Governance & Tournament Hubs -->
      <div class="backlink-group">
        <h3 class="backlink-group-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          Governance &amp; Tournaments
        </h3>
        <ul class="backlink-list">
          <li class="backlink-item">
            <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener">RDCA Central Registry ↗</a>
            <span class="meta">Certified player career record &amp; scorecards</span>
          </li>
          <li class="backlink-item">
            <a href="https://rewa-cricket-division.vercel.app/" target="_blank" rel="noopener">RDCA Main Digital Archive ↗</a>
            <span class="meta">Rewa Division Cricket Association Portal</span>
          </li>
          <li class="backlink-item">
            <a href="https://abv-rewacricket.pages.dev/" target="_blank" rel="noopener">ABV Memorial Tournament ↗</a>
            <span class="meta">Official tournament governing portal</span>
          </li>
          <li class="backlink-item">
            <a href="https://abv-rewacricket.pages.dev/stats/" target="_blank" rel="noopener">ABV Leaderboards &amp; Records ↗</a>
            <span class="meta">Consolidated all-time career statistics</span>
          </li>
          <li class="backlink-item">
            <a href="https://abv-rewacricket.pages.dev/teams/" target="_blank" rel="noopener">ABV Teams &amp; Captains ↗</a>
            <span class="meta">Official franchise rosters and captains</span>
          </li>
          <li class="backlink-item">
            <a href="https://cricheroes.com/association/79/rewa-divisional-cricket-association/home" target="_blank" rel="noopener">CricHeroes Association 79 ↗</a>
            <span class="meta">Grassroots scoring and live matches</span>
          </li>
          <li class="backlink-item">
            <a href="https://cricheroes.com/tournament/2168281/atal-bihari-vajpayee-cricket-tournament-season-3/matches/live-matches" target="_blank" rel="noopener">CricHeroes Season 3 ↗</a>
            <span class="meta">Live match scorecard tracking</span>
          </li>
        </ul>
      </div>

      <!-- 3. Club Franchise Ecosystem -->
      <div class="backlink-group">
        <h3 class="backlink-group-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
          Franchise Ecosystem
        </h3>
        <ul class="backlink-list">
          <li class="backlink-item">
            <a href="https://destroyers-rewacricket.pages.dev/" target="_blank" rel="noopener">Destroyers Cricket Club ↗</a>
            <span class="meta">Official club portal &amp; match centre</span>
          </li>
          <li class="backlink-item">
            <a href="https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi" target="_blank" rel="noopener">Destroyers Captain Dossier ↗</a>
            <span class="meta">Club statistics and derby honors</span>
          </li>
          <li class="backlink-item">
            <a href="https://dread-eleven-rewacricket.pages.dev/" target="_blank" rel="noopener">Dread Eleven Digital Stadium ↗</a>
            <span class="meta">Rival club portal and derby history</span>
          </li>
          <li class="backlink-item">
            <a href="https://www.instagram.com/destroyers_rewa" target="_blank" rel="noopener">Instagram: @destroyers_rewa ↗</a>
            <span class="meta">Verified team media &amp; announcements</span>
          </li>
          <li class="backlink-item">
            <a href="https://www.facebook.com/rewa.cricket.association" target="_blank" rel="noopener">Rewa Cricket Facebook ↗</a>
            <span class="meta">Official regional community page</span>
          </li>
        </ul>
      </div>

      <!-- 4. Machine-Readable Endpoints & Mirrors -->
      <div class="backlink-group">
        <h3 class="backlink-group-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          Machine Endpoints &amp; Mirrors
        </h3>
        <ul class="backlink-list">
          <li class="backlink-item">
            <a href="https://pranav-pramod-dwivedi.github.io/" target="_blank" rel="noopener">GitHub Pages Mirror ↗</a>
            <span class="meta">Root deployment host mirror</span>
          </li>
          <li class="backlink-item">
            <a href="/llms.txt" target="_blank" rel="noopener">llms.txt Standard Index ↗</a>
            <span class="meta">Clean agentic context specification</span>
          </li>
          <li class="backlink-item">
            <a href="/llms-full.txt" target="_blank" rel="noopener">llms-full.txt Complete Dossier ↗</a>
            <span class="meta">Un-truncated AI context and telemetry</span>
          </li>
          <li class="backlink-item">
            <a href="/profile.json" target="_blank" rel="noopener">profile.json Structured API ↗</a>
            <span class="meta">Machine-readable JSON schema</span>
          </li>
          <li class="backlink-item">
            <a href="/resume.md" target="_blank" rel="noopener">resume.md Raw Markdown CV ↗</a>
            <span class="meta">Clean curriculum vitae in Markdown</span>
          </li>
          <li class="backlink-item">
            <a href="/sitemap.xml" target="_blank" rel="noopener">XML Sitemap Index ↗</a>
            <span class="meta">Crawler sitemap with freshness timestamps</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <!-- 4. FAQ / AI DIRECT ANSWER SECTION -->
  <section class="faq-section" style="margin-top:4rem;">
    <div class="section-head-row">
      <div>
        <p class="section-tag">GOOGLE &amp; GEMINI DIRECT ANSWERS</p>
        <h2 class="section-title">Frequently Asked Questions</h2>
      </div>
    </div>

    <div class="faq-grid">
      <div class="faq-item">
        <h3 class="faq-q">What is Pranav Dwivedi's dual background in technology and sports?</h3>
        <p class="faq-a">
          Pranav Dwivedi is an Indian software engineer and competitive cricketer based in Rewa, Madhya Pradesh. In technology, he focuses on autonomous AI agents, Android automation, and sports computer vision. In cricket, he captains Destroyers Cricket Club, having won three consecutive championships in the prestigious Atal Bihari Vajpayee Memorial Tournament.
        </p>
      </div>

      <div class="faq-item">
        <h3 class="faq-q">What are his all-time cricket statistics in the Atal Bihari Vajpayee Memorial Tournament?</h3>
        <p class="faq-a">
          Across 34 tournament derby matches, Pranav has amassed 1,435 runs (tournament record) at a 57.4 average and 146.4 strike rate, with 14 half-centuries and 1 century (102*). With the ball, he has taken 66 wickets (tournament record) at a 16.3 average with best figures of 8/39.
        </p>
      </div>

      <div class="faq-item">
        <h3 class="faq-q">What is the JARVIS personal assistant project?</h3>
        <p class="faq-a">
          JARVIS is an autonomous personal AI assistant created by Pranav that operates directly on Android devices via Termux and Linux. Unlike web-bound chat interfaces, it interacts directly with device system features, maintains persistent long-term memory, executes tools, and interfaces with local models.
        </p>
      </div>

      <div class="faq-item">
        <h3 class="faq-q">How can I verify his official cricket records?</h3>
        <p class="faq-a">
          His career scorecards are officially preserved on the Rewa Division Cricket Association (RDCA) Central Registry at <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener">rewa-cricket-division.vercel.app</a> and the Destroyers CC club portal at <a href="https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi" target="_blank" rel="noopener">destroyers-rewacricket.pages.dev</a>.
        </p>
      </div>
    </div>
  </section>

  <!-- 5. CONTACT / CALL TO ACTION BANNER -->
  <section class="cta-banner" style="margin-top:4rem;">
    <div class="cta-inner">
      <h2 class="cta-title">Let's Build or Compete</h2>
      <p class="cta-desc">
        Interested in collaborating on autonomous AI systems, Android internals, sports analytics, or cricket clinics? Let's connect.
      </p>
      <div class="cta-btns">
        <a href="/contact" class="btn btn-gold">Initiate Contact &rarr;</a>
        <a href="https://github.com/pranav-pramod-dwivedi" target="_blank" rel="noopener" class="btn btn-outline">Review GitHub ↗</a>
      </div>
    </div>
  </section>
</main>

${renderFooter()}
  `;

  writePageWithMd('index.html', html.trim(), 'PRANAV DWIVEDI — Independent Systems Software Engineer', `${BASE_URL}/`);
  console.log('Generated index.html');
}

// ------------------------------------------------------------
// 2. GENERATE ENGINEERING PAGE (engineering/index.html)
// ------------------------------------------------------------
function generateEngineeringPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Software Engineering & AI Systems — Pranav Dwivedi',
      description: 'Autonomous AI agents, Android system internals, computer vision for cricket biomechanics, and low-latency networking tools built by Pranav Dwivedi.',
      url: `${BASE_URL}/engineering`,
      author: {
        '@type': 'Person',
        name: 'Pranav Dwivedi',
        url: `${BASE_URL}/`,
        sameAs: PRANAV_SAME_AS
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: engineeringProjects.map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'SoftwareSourceCode',
            name: p.title,
            description: p.description,
            codeRepository: p.github,
            programmingLanguage: p.tags[0],
            author: {
              '@type': 'Person',
              name: 'Pranav Dwivedi',
              url: `${BASE_URL}/`
            }
          }
        }))
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Engineering',
          item: `${BASE_URL}/engineering`
        }
      ]
    }
  ];

  const html = `
${renderHead({
  title: 'Software Engineering & AI Systems | Pranav Dwivedi',
  description: 'Explore autonomous AI agents (JARVIS), cricket computer vision, Android toolchains, and open source projects built by Pranav Dwivedi.',
  canonicalUrl: '/engineering',
  jsonLd
})}
${renderHeader('engineering')}

<main class="container page-content" style="padding-top:3rem;">
  <div class="page-head">
    <p class="section-tag">CODE &bull; AGENTS &bull; SYSTEMS</p>
    <h1 class="page-big-title">Engineering &amp; AI Systems</h1>
    <p class="page-lead">
      Autonomous agents, device automation on rooted Android, low-latency computer vision, and building software that actually does things in the real world.
    </p>
  </div>

  <div class="projects-grid" style="margin-top:2.5rem;">
    ${engineeringProjects.map(p => `
      <div class="project-card detailed-card">
        <div class="project-card-head">
          <span class="badge-category">${esc(p.category)}</span>
          <span class="project-status">${esc(p.status)}</span>
        </div>
        <h3 class="project-title" style="font-size:1.4rem;">${esc(p.title)}</h3>
        <p class="project-desc">${esc(p.description)}</p>

        <div style="margin:1rem 0;">
          <h5 style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-muted); text-transform:uppercase; margin-bottom:0.5rem;">Key Architecture Highlights</h5>
          <ul style="color:var(--c-white); font-size:0.875rem; line-height:1.6; padding-left:1.25rem;">
            ${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}
          </ul>
        </div>

        <div class="project-tags">
          ${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
        <div class="project-footer" style="margin-top:1.5rem;">
          <a href="${p.github}" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:0.85rem;">
            Inspect GitHub Repository ↗
          </a>
        </div>
      </div>
    `).join('')}
  </div>

  <!-- Terminal Philosophy Box -->
  <div class="terminal-box" style="margin-top:3.5rem;">
    <div class="terminal-header">
      <span class="t-dot red"></span><span class="t-dot yellow"></span><span class="t-dot green"></span>
      <span class="terminal-title">pranav@axiom-brain:~/philosophy.sh</span>
    </div>
    <div class="terminal-body">
      <p class="t-prompt">$ cat core_tenets.txt</p>
      <p class="t-line">1. "I have a habit of turning a simple project into a systems engineering problem."</p>
      <p class="t-line">2. "Make AI touch grass — connect models to actual operating systems, files, and hardware instead of leaving them in text boxes."</p>
      <p class="t-line">3. "If something doesn't exist, I will build a fast, uncompromising version of it."</p>
      <p class="t-line">4. "Build more. Break less. Understand the metal underneath."</p>
    </div>
  </div>
</main>

${renderFooter()}
  `;

  writePageWithMd('engineering/index.html', html.trim(), 'Software Systems & AI Projects | Pranav Dwivedi', `${BASE_URL}/engineering`);
  console.log('Generated engineering/index.html');
}

// ------------------------------------------------------------
// 3. GENERATE CRICKET PAGE (cricket/index.html)
// ------------------------------------------------------------
function generateCricketPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: 'Capt. Pranav Dwivedi (#7) — Cricket Career & Statistics',
      description: 'Career telemetry, championship honors, and RDCA match records for Pranav Dwivedi, 3x champion captain of Destroyers Cricket Club.',
      url: `${BASE_URL}/cricket`,
      mainEntity: {
        '@type': ['Person', 'Athlete'],
        name: 'Pranav Dwivedi',
        identifier: 'DES-7',
        jobTitle: 'Captain & Premier All-Rounder',
        memberOf: {
          '@type': 'SportsTeam',
          name: 'Destroyers Cricket Club (DES)',
          url: 'https://destroyers-rewacricket.pages.dev'
        },
        award: [
          '2026 Atal Bihari Vajpayee Memorial Trophy Champion Captain (3-2 vs Dread Eleven)',
          '2025 Atal Bihari Vajpayee Memorial Trophy Champion Captain (5-0 Clean Sweep)',
          '2024 Atal Bihari Vajpayee Memorial Trophy Champion Captain (4-1 Series Victory)',
          'Rewa Derby All-Time Leading Run Scorer (1,435 runs)',
          'Rewa Derby All-Time Leading Wicket Taker (66 wickets)'
        ],
        sameAs: PRANAV_SAME_AS
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Cricket',
          item: `${BASE_URL}/cricket`
        }
      ]
    }
  ];

  const html = `
${renderHead({
  title: 'Capt. Pranav Dwivedi (#7) — Cricket Career & Dynasty Records',
  description: 'Official athletic dossier of Pranav Dwivedi (#7). 3x champion captain of Destroyers Cricket Club (2024, 2025, 2026), 1,435 tournament runs, 66 wickets in Rewa, MP.',
  canonicalUrl: '/cricket',
  jsonLd
})}
${renderHeader('cricket')}

<main class="container page-content" style="padding-top:3rem;">
  <div class="page-head">
    <p class="section-tag">DESTROYERS CC &bull; RDCA CIRCUIT &bull; #7</p>
    <h1 class="page-big-title">Cricket Career &amp; Dynasty Records</h1>
    <p class="page-lead">
      Captain &amp; premier all-rounder for Destroyers Cricket Club. All-time leading run scorer and leading wicket taker in the Atal Bihari Vajpayee Memorial Tournament.
    </p>
  </div>

  <!-- Quick Telemetry Strip -->
  <div class="stat-banner-grid" style="margin-top:2.5rem;">
    <div class="stat-box">
      <span class="stat-lbl">Matches Contested</span>
      <span class="stat-val">34</span>
      <span class="stat-meta">Rivalry Derbies vs Dread Eleven</span>
    </div>
    <div class="stat-box">
      <span class="stat-lbl">Tournament Runs</span>
      <span class="stat-val accent-gold">1,435</span>
      <span class="stat-meta">All-Time Tournament #1 &bull; Avg 57.4</span>
    </div>
    <div class="stat-box">
      <span class="stat-lbl">Tournament Wickets</span>
      <span class="stat-val accent-emerald">66</span>
      <span class="stat-meta">All-Time Tournament #1 &bull; Avg 16.3</span>
    </div>
    <div class="stat-box">
      <span class="stat-lbl">Championship Titles</span>
      <span class="stat-val accent-gold">3</span>
      <span class="stat-meta">2024 &bull; 2025 &bull; 2026</span>
    </div>
  </div>

  <!-- Player Dossier Table -->
  <div class="dossier-wrap" style="margin-top:3.5rem;">
    <h3 style="font-family:var(--f-display); font-size:1.6rem; color:var(--c-white); margin-bottom:1.25rem;">
      Athletic Dossier &bull; RDCA Central Registration
    </h3>
    <table class="dossier-table">
      <tbody>
        <tr>
          <th>Full Legal Name</th>
          <td><strong>Pranav Dwivedi (Pranav Pramod Dwivedi)</strong></td>
        </tr>
        <tr>
          <th>Jersey Number</th>
          <td><span class="badge-gold">#7 (Captain)</span></td>
        </tr>
        <tr>
          <th>Playing Role</th>
          <td>Captain &amp; Premier All-Rounder (Right-Hand Bat &bull; Right-Arm Fast-Medium / Off-Spin)</td>
        </tr>
        <tr>
          <th>Franchise Club</th>
          <td>Destroyers Cricket Club (DES)</td>
        </tr>
        <tr>
          <th>Governing Circuit</th>
          <td>Rewa Division Cricket Association (RDCA) &bull; MPCA Circuit</td>
        </tr>
        <tr>
          <th>Highest Score</th>
          <td><strong>102* Not Out</strong> (14 Fifties, 1 Century)</td>
        </tr>
        <tr>
          <th>Best Bowling in an Innings</th>
          <td><strong>8/39</strong> (Economy 5.48 across 34 derbies)</td>
        </tr>
        <tr>
          <th>Official Registry ID</th>
          <td><code>DES-7</code> &bull; <code>RDCA-P-PRANAV-DWIVEDI</code></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Dynasty Honours Grid -->
  <div style="margin-top:3.5rem;">
    <h3 style="font-family:var(--f-display); font-size:1.6rem; color:var(--c-white); margin-bottom:1.25rem;">
      Championship Honors &amp; Trophy Cabinet
    </h3>
    <div class="trophy-grid">
      ${cricketStats.titles.map(t => `
        <div class="trophy-card">
          <div class="trophy-badge">${esc(t.year)} CHAMPION</div>
          <h4 class="trophy-title">${esc(t.year)} Atal Bihari Vajpayee Memorial Trophy</h4>
          <p class="trophy-desc">${esc(t.desc)}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- External Registry Backlinks -->
  <div class="cta-banner" style="margin-top:3.5rem;">
    <div class="cta-inner">
      <h3 class="cta-title" style="font-size:1.8rem;">Explore Ball-by-Ball Match Archives</h3>
      <p class="cta-desc">
        Complete historical match scorecards, player wagon wheels, and bowling analysis are preserved across the RDCA Central Archive and tournament portals.
      </p>
      <div class="cta-btns">
        <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener" class="btn btn-primary">
          RDCA Official Central Registry ↗
        </a>
        <a href="https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi" target="_blank" rel="noopener" class="btn btn-secondary">
          Destroyers CC Profile ↗
        </a>
        <a href="https://abv-rewacricket.pages.dev/stats/" target="_blank" rel="noopener" class="btn btn-outline">
          Tournament Leaderboards ↗
        </a>
      </div>
    </div>
  </div>
</main>

${renderFooter()}
  `;

  writePageWithMd('cricket/index.html', html.trim(), 'Athletic Career & Championships (#7) | Pranav Dwivedi', `${BASE_URL}/cricket`);
  console.log('Generated cricket/index.html');
}

// ------------------------------------------------------------
// 4. GENERATE ABOUT PAGE (about/index.html)
// ------------------------------------------------------------
function generateAboutPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Pranav Dwivedi — Background, Philosophy & Vision',
      description: 'Background, systems philosophy, and athletic discipline of Pranav Dwivedi in Rewa, Madhya Pradesh.',
      url: `${BASE_URL}/about`,
      mainEntity: {
        '@type': 'Person',
        name: 'Pranav Dwivedi',
        url: `${BASE_URL}/`,
        sameAs: PRANAV_SAME_AS
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'About',
          item: `${BASE_URL}/about`
        }
      ]
    }
  ];

  const html = `
${renderHead({
  title: 'About Pranav Dwivedi — Background, Philosophy & Vision',
  description: 'Learn about Pranav Dwivedi: his journey in autonomous systems, Android architecture, and captaining Destroyers Cricket Club in Rewa, MP.',
  canonicalUrl: '/about',
  jsonLd
})}
${renderHeader('about')}

<main class="container page-content" style="padding-top:3rem;">
  <div class="page-head">
    <p class="section-tag">BACKGROUND &bull; ETHOS &bull; ORIGIN</p>
    <h1 class="page-big-title">About Pranav Dwivedi</h1>
    <p class="page-lead">
      Systems builder, student, and competitive athlete based in Rewa, Madhya Pradesh.
    </p>
  </div>

  <div class="about-grid" style="margin-top:2.5rem;">
    <div class="about-text-col">
      <h2 style="font-family:var(--f-display); font-size:1.8rem; color:var(--c-white); margin-bottom:1rem;">
        Engineering Things That Actually Touch The Real World
      </h2>
      <p style="color:var(--c-muted); line-height:1.7; margin-bottom:1.25rem;">
        I'm Pranav, a student and developer who likes building things that probably shouldn't be this complicated. My core focus spans autonomous AI agents, rooted Android environments (Termux/Linux), low-level device automation, and high-performance Web interfaces.
      </p>
      <p style="color:var(--c-muted); line-height:1.7; margin-bottom:1.25rem;">
        I don't believe in leaving artificial intelligence trapped inside a SaaS chat box. Through projects like <strong>JARVIS</strong> and <strong>Axiom</strong>, I focus on giving AI agents agency: the ability to execute terminal tools, interact with file systems, manage system permissions, and control hardware devices autonomously.
      </p>

      <h2 style="font-family:var(--f-display); font-size:1.8rem; color:var(--c-white); margin-top:2.5rem; margin-bottom:1rem;">
        Leading From The Front: Cricket &bull; #7
      </h2>
      <p style="color:var(--c-muted); line-height:1.7; margin-bottom:1.25rem;">
        Cricket is not a casual hobby for me; it is a serious athletic discipline. As captain and all-rounder for <strong>Destroyers Cricket Club</strong>, I have led our team through 34 intense bilateral rivalry matches against Dread Eleven in Rewa, clinching three consecutive championships in 2024, 2025, and 2026.
      </p>
      <p style="color:var(--c-muted); line-height:1.7;">
        Being an all-rounder requires aggressive composure: batting at high strike rates under scoreboard pressure, and breaking critical partnerships with the ball. That same mindset applies to software: diagnose problems under pressure, take calculated risks, and ship solutions that last.
      </p>
    </div>

    <div class="about-sidebar">
      <div class="sidebar-box">
        <h3 class="sidebar-title">Quick Facts</h3>
        <ul class="fact-list">
          <li><strong>Location:</strong> Rewa, Madhya Pradesh, India</li>
          <li><strong>Core Languages:</strong> Python, Kotlin, JavaScript, TypeScript, Zig, Bash, SQL</li>
          <li><strong>Cricket Role:</strong> Captain &bull; All-Rounder (#7)</li>
          <li><strong>Primary Franchise:</strong> Destroyers Cricket Club (DES)</li>
          <li><strong>Governing Circuit:</strong> Rewa Division Cricket Association</li>
          <li><strong>Email:</strong> <a href="mailto:hkdykk22@gmail.com">hkdykk22@gmail.com</a></li>
        </ul>
      </div>

      <div class="sidebar-box" style="margin-top:1.5rem;">
        <h3 class="sidebar-title">Skill Stack</h3>
        <div class="project-tags">
          <span class="tag">AI Agents</span>
          <span class="tag">Tool Calling</span>
          <span class="tag">Android / Termux</span>
          <span class="tag">Computer Vision</span>
          <span class="tag">MediaPipe</span>
          <span class="tag">FastAPI</span>
          <span class="tag">Firebase</span>
          <span class="tag">Cricket Captaincy</span>
          <span class="tag">All-Rounder</span>
        </div>
      </div>
    </div>
  </div>
</main>

${renderFooter()}
  `;

  writePageWithMd('about/index.html', html.trim(), 'Background & Philosophy | Pranav Dwivedi', `${BASE_URL}/about`);
  console.log('Generated about/index.html');
}

// ------------------------------------------------------------
// 5. GENERATE CONTACT PAGE (contact/index.html)
// ------------------------------------------------------------

// ------------------------------------------------------------
// 5B. PRIVACY POLICY PAGE GENERATOR (/privacy)
// ------------------------------------------------------------
function generatePrivacyPage() {
  const privacyDir = path.join(rootDir, 'privacy');
  ensureDir(privacyDir);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy & Transparency — Pranav Dwivedi',
    description: 'Privacy Policy, data stewardship, and public records disclosure for Pranav Dwivedi official website and systems portfolio.',
    url: `${BASE_URL}/privacy`
  };

  const bodyHtml = `
  <section class="page-hero">
    <div class="container">
      <p class="hero-tag">LEGAL &bull; TRANSPARENCY</p>
      <h1 class="hero-title" style="font-size:clamp(2.5rem, 5vw, 4rem);">Privacy Policy</h1>
      <p class="hero-subtitle">
        Privacy-preserving static architecture, zero tracking disclosure, and public athletic records stewardship.
      </p>
    </div>
  </section>

  <main class="page-content" id="main-content">
    <div class="container" style="max-width:800px; padding:3rem 1.5rem 6rem;">
      <article class="prose" style="color:var(--c-text); font-size:1.05rem; line-height:1.8;">
        <h2>1. Commitment to Personal Privacy &amp; Data Ethics</h2>
        <p>This personal portfolio and engineering hub (<code>https://pranav-dwivedi.pages.dev/</code>) is operated by <strong>Pranav Pramod Dwivedi</strong>. I believe that personal websites should respect visitor privacy by default without invasive surveillance or algorithmic monetization.</p>

        <h2>2. Zero-Tracking Architecture</h2>
        <p>This website operates as a high-performance, privacy-preserving static publication hosted on Cloudflare Pages:</p>
        <ul>
          <li><strong>No Tracking Cookies:</strong> No first-party or third-party cookies are set in your browser.</li>
          <li><strong>No Advertising Pixels:</strong> There are zero advertising trackers, behavioral profiling tags, or cross-site tracking beacons.</li>
          <li><strong>No User Analytics Profiling:</strong> We do not track keystrokes, mouse heatmaps, or fingerprint browser configurations.</li>
          <li><strong>Hosting Diagnostics:</strong> Edge CDN servers (Cloudflare) process standard ephemeral HTTP requests (IP address, user agent, requested path) strictly for network security, rate limiting, and DDoS defense.</li>
        </ul>

        <h2>3. Public Sporting Records and Software Attribution</h2>
        <p>The match scores, athletic milestones, tournament records, and captaincy statistics displayed on this site represent official public sports records verified by the Rewa Division Cricket Association (RDCA). Source code repositories and engineering demonstrations are open-source and subject to their respective software licenses.</p>

        <h2>4. AI Agent Access &amp; Content Negotiation</h2>
        <p>This website provides proactive content negotiation for research agents and LLMs via <code>Accept: text/markdown</code> and Model Context Protocol (MCP) endpoints. Agents are expected to respect robots.txt crawl rates and cache directives.</p>

        <h2>5. Direct Contact &amp; Inquiries</h2>
        <p>If you have questions regarding data privacy or wish to request corrections to any published record, you may reach out directly:</p>
        <ul>
          <li><strong>Entity:</strong> Pranav Dwivedi</li>
          <li><strong>Email:</strong> <a href="mailto:pranav.dwivedi.cricket@gmail.com">pranav.dwivedi.cricket@gmail.com</a></li>
          <li><strong>Location:</strong> Rewa, Madhya Pradesh, India</li>
        </ul>
        <p><em>Effective Date: September 2026.</em></p>
      </article>
    </div>
  </main>
  `;

  const html = `
${renderHead({
  title: 'Privacy Policy | Pranav Dwivedi',
  description: 'Official privacy policy, zero tracking declaration, and data ethics statement for Pranav Dwivedi.',
  canonicalUrl: `${BASE_URL}/privacy`,
  jsonLd
})}
${renderHeader('')}
${bodyHtml}
${renderFooter()}
  `;

  writePageWithMd('privacy/index.html', html.trim(), 'Privacy Policy | Pranav Dwivedi', `${BASE_URL}/privacy`);
  console.log('Generated privacy/index.html & privacy.md');
}

function generateContactPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact & Connect — Pranav Dwivedi',
      description: 'Direct communication channels for engineering collaborations, AI systems development, and cricket clinics.',
      url: `${BASE_URL}/contact`,
      mainEntity: {
        '@type': 'Person',
        name: 'Pranav Dwivedi',
        email: 'hkdykk22@gmail.com',
        url: `${BASE_URL}/`,
        sameAs: PRANAV_SAME_AS
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact',
          item: `${BASE_URL}/contact`
        }
      ]
    }
  ];

  const html = `
${renderHead({
  title: 'Contact & Connect — Pranav Dwivedi',
  description: 'Get in touch with Pranav Dwivedi for autonomous AI engineering, Android systems collaborations, sports analytics, or cricket clinics.',
  canonicalUrl: '/contact',
  jsonLd
})}
${renderHeader('contact')}

<main class="container page-content" style="padding-top:3rem;">
  <div class="page-head">
    <p class="section-tag">COMMUNICATIONS &bull; COLLABORATION</p>
    <h1 class="page-big-title">Initiate Contact</h1>
    <p class="page-lead">
      Direct channels for engineering collaboration, speaking, cricket clinics, or systems inquiries.
    </p>
  </div>

  <div class="contact-grid" style="margin-top:2.5rem;">
    <div class="contact-card">
      <h3 style="font-family:var(--f-display); font-size:1.4rem; color:var(--c-white); margin-bottom:0.5rem;">Direct Electronic Mail</h3>
      <p style="color:var(--c-muted); font-size:0.9rem; line-height:1.6; margin-bottom:1.25rem;">
        For technical inquiries, system architecture consults, or competitive inquiries:
      </p>
      <a href="mailto:hkdykk22@gmail.com" class="contact-highlight-link">
        hkdykk22@gmail.com &rarr;
      </a>
    </div>

    <div class="contact-card">
      <h3 style="font-family:var(--f-display); font-size:1.4rem; color:var(--c-white); margin-bottom:0.5rem;">Code &bull; GitHub</h3>
      <p style="color:var(--c-muted); font-size:0.9rem; line-height:1.6; margin-bottom:1.25rem;">
        Explore open-source repositories, agent experiments, and tools:
      </p>
      <a href="https://github.com/pranav-pramod-dwivedi" target="_blank" rel="noopener" class="contact-highlight-link">
        github.com/pranav-pramod-dwivedi &rarr;
      </a>
    </div>

    <div class="contact-card">
      <h3 style="font-family:var(--f-display); font-size:1.4rem; color:var(--c-white); margin-bottom:0.5rem;">Cricket &bull; RDCA Registry</h3>
      <p style="color:var(--c-muted); font-size:0.9rem; line-height:1.6; margin-bottom:1.25rem;">
        Official athlete registration and divisional tournament record:
      </p>
      <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener" class="contact-highlight-link">
        RDCA Central Player Archive &rarr;
      </a>
    </div>

    <div class="contact-card">
      <h3 style="font-family:var(--f-display); font-size:1.4rem; color:var(--c-white); margin-bottom:0.5rem;">Destroyers CC Media Desk</h3>
      <p style="color:var(--c-muted); font-size:0.9rem; line-height:1.6; margin-bottom:1.25rem;">
        Match schedules, franchise roster updates, and trials notifications:
      </p>
      <a href="https://destroyers-rewacricket.pages.dev/" target="_blank" rel="noopener" class="contact-highlight-link">
        destroyers-rewacricket.pages.dev &rarr;
      </a>
    </div>
  </div>
</main>

${renderFooter()}
  `;

  writePageWithMd('contact/index.html', html.trim(), 'Get in Touch | Pranav Dwivedi', `${BASE_URL}/contact`);
  console.log('Generated contact/index.html');
}

// ------------------------------------------------------------
// 6. GENERATE 404 PAGE (404.html)
// ------------------------------------------------------------
function generate404Page() {
  const html = `
${renderHead({
  title: '404 — Delivery Over The Boundary | Pranav Dwivedi',
  description: 'Page not found. Return to Pranav Dwivedi\'s official independent portfolio home.',
  canonicalUrl: '/404'
})}
${renderHeader('')}

<main class="container page-content" style="padding:6rem 1rem; text-align:center;">
  <div style="font-family:var(--f-display); font-size:clamp(4rem, 10vw, 8rem); color:var(--c-gold); line-height:1; margin-bottom:1rem;">
    404
  </div>
  <h1 style="font-family:var(--f-display); font-size:2rem; color:var(--c-white); margin-bottom:1rem;">
    Delivery Gone Into The Concourse
  </h1>
  <p style="color:var(--c-muted); max-width:55ch; margin:0 auto 2rem; font-size:1.1rem; line-height:1.7;">
    The page you attempted to reach doesn't exist on this domain. Use the pathways below to return to verified code or match archives.
  </p>
  <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
    <a href="/" class="btn btn-primary">Return Home</a>
    <a href="/engineering" class="btn btn-secondary">Engineering &amp; AI</a>
    <a href="/cricket" class="btn btn-secondary">Cricket Career (#7)</a>
    <a href="/contact" class="btn btn-outline">Contact</a>
  </div>
</main>

${renderFooter()}
  `;

  writePageWithMd('404.html', html.trim(), '404 Not Found | Pranav Dwivedi', `${BASE_URL}/404.html`);
  console.log('Generated 404.html');
}

// ------------------------------------------------------------
// 7. SITEMAP & ROBOTS & MACHINE-READABLE FILES
// ------------------------------------------------------------
function generateMachineFiles() {
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/engineering/', priority: '0.9', changefreq: 'weekly' },
    { loc: '/cricket/', priority: '0.9', changefreq: 'weekly' },
    { loc: '/about/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/privacy/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/contact/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/resume.md', priority: '0.7', changefreq: 'monthly' },
    { loc: '/profile.json', priority: '0.7', changefreq: 'monthly' },
    { loc: '/llms.txt', priority: '0.8', changefreq: 'weekly' },
    { loc: '/llms-full.txt', priority: '0.8', changefreq: 'weekly' }
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml.trim());

  const robotsTxt = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
LLM: ${BASE_URL}/llms.txt
LLM-Full: ${BASE_URL}/llms-full.txt
`;
  fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsTxt.trim());
  // Agent instructions
  const agentInstructions = `# Pranav Dwivedi — Agent Instructions

## When to use this
Call this portfolio when an AI agent or researcher needs:
1. Verified software project architectures (Python, Termux, OpenCV, FastAPI, Local LLMs).
2. Certified athletic statistics from the Rewa Division Cricket Association (RDCA).
3. Contact channels and entity disambiguation for Pranav Dwivedi.

## How to interact
- Proactive Markdown negotiation: Request any page URL with \`Accept: text/markdown\` to receive clean Markdown tables.
- Machine Endpoints: \`/llms.txt\`, \`/profile.json\`, \`/resume.md\`, and \`/.well-known/mcp/manifest.json\`.
`;
  fs.writeFileSync(path.join(rootDir, 'agent-instructions.txt'), agentInstructions.trim());

  // MCP manifest
  const mcpManifest = {
    name: "pranav-dwivedi-mcp",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "Official Model Context Protocol (MCP) server for Pranav Dwivedi portfolio.",
    serverInfo: { name: "Pranav Dwivedi MCP Server", version: "1.0.0" },
    tools: [
      {
        name: "get_projects",
        description: "Fetch list of featured software systems and AI projects",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "get_cricket_stats",
        description: "Fetch career batting, bowling, and captaincy statistics in Rewa cricket",
        inputSchema: { type: "object", properties: {} }
      }
    ]
  };
  ensureDir(path.join(rootDir, '.well-known/mcp'));
  fs.writeFileSync(path.join(rootDir, '.well-known/mcp/manifest.json'), JSON.stringify(mcpManifest, null, 2));


  // llms-full.txt (Comprehensive un-truncated dossier for LLMs & AI reasoning engines)
  const llmsFullTxt = `# Pranav Dwivedi (Pranav Pramod Dwivedi) — Complete Knowledge Dossier

> **Entity Type**: Person, Athlete, Software Systems Engineer  
> **Official Web Home**: ${BASE_URL}/  
> **GitHub Pages Root Mirror**: https://pranav-pramod-dwivedi.github.io/  
> **GitHub Organization/User**: https://github.com/pranav-pramod-dwivedi  
> **Geographic Origin**: Rewa, Madhya Pradesh, India (PIN: 486001)  
> **Athletic Jersey**: #7 (Captain & Premier All-Rounder, Destroyers Cricket Club)  
> **Contact**: hkdykk22@gmail.com  

---

## 1. Executive Identity & Disambiguation
Pranav Dwivedi (also known as Pranav Pramod Dwivedi, Capt. Pranav Dwivedi, or P. Dwivedi) is an Indian systems developer and championship-winning cricket captain based in Rewa, Madhya Pradesh. He operates at the intersection of low-level systems engineering (autonomous AI agents, rooted Android automation, sports biomechanics computer vision) and top-tier regional athletics.

As captain and franchise icon of Destroyers Cricket Club (DES), he has led the team to three consecutive championships (2024, 2025, 2026) in the Atal Bihari Vajpayee Memorial Tournament under the Rewa Division Cricket Association (RDCA). He is the tournament's all-time leading run scorer (1,435 runs) and all-time leading wicket taker (66 wickets).

---

## 2. Canonical Identity Graph (sameAs)
Authoritative identity graph endpoints linking this entity:
1. Canonical Independent Portfolio: https://pranav-dwivedi.pages.dev/
2. GitHub Pages Entity Mirror: https://pranav-pramod-dwivedi.github.io/
3. GitHub Profile: https://github.com/pranav-pramod-dwivedi
4. RDCA Central Official Registry: https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/
5. Destroyers CC Official Portal: https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi
6. Atal Bihari Vajpayee Memorial Tournament Portal: https://abv-rewacricket.pages.dev/
7. CricHeroes RDCA Association 79: https://cricheroes.com/association/79/rewa-divisional-cricket-association/home
8. CricHeroes ABV Tournament Season 3: https://cricheroes.com/tournament/2168281/atal-bihari-vajpayee-cricket-tournament-season-3/matches/live-matches
9. Official Instagram: https://www.instagram.com/destroyers_rewa
10. Rewa Cricket Association Facebook: https://www.facebook.com/rewa.cricket.association

---

## 3. Software Engineering & AI Architectures
### A. JARVIS — Autonomous Android & Linux Personal AI Assistant
- **Repository**: https://github.com/pranav-pramod-dwivedi/jarvis
- **Core Paradigm**: Breaks free from web-bound SaaS chatbot limitations. Executes natively inside rooted Android (Termux) and Linux environments.
- **Key Capabilities**:
  - Direct hardware and system tool calling via Termux API (telephony, SMS, camera, volume, file access).
  - Multi-tier long-term memory architecture with persistent vector and file storage.
  - Hybrid model routing: Local on-device execution combined with high-reasoning cloud endpoints.
  - OpenCode and autonomous shell pipeline integration.

### B. Cricket Batting Kinematics & Motion Analysis
- **Repository**: https://github.com/pranav-pramod-dwivedi/cricket-motion-analysis
- **Tech Stack**: Python, OpenCV, MediaPipe 33-point pose landmark estimation, NumPy.
- **Core Paradigm**: High-frequency real-time swing trajectory tracking, bat angle estimation, head-over-ball alignment scoring, and kinematic power transfer metrics.
- **Features**: Wireless phone-as-camera mode for live nets coaching, zero-latency feedback loops.

### C. Axiom & Axiom Brain — Local Agent UI
- **Repository**: https://github.com/pranav-pramod-dwivedi/axiom
- **Tech Stack**: TypeScript, Node.js, Python, Voice AI, Git.
- **Core Paradigm**: Local-first private agent workspace with continuous bi-directional voice streaming, terminal daemon, and cross-device brain sync between macOS and Android over automated Git sync.

### D. VISA-PAY 2.0 — Fluid Fintech Interface
- **Repository**: https://github.com/pranav-pramod-dwivedi/VISA-PAY-2.0
- **Core Paradigm**: Zero-dependency frontend craft featuring buttery 60fps micro-interactions, liquid-glass visual tokens, and precise typography scaling.

### E. PiXel Arena — Tournament Engine
- **Repository**: https://github.com/pranav-pramod-dwivedi/PiXel-Arena
- **Core Paradigm**: Full-stack competitive esports platform powered by Firebase Auth, hardened Firestore security rules, live squad leaderboards, and automated bracket progression.

### F. MTProto.zig — Obfuscated TLS Proxy
- **Repository**: https://github.com/pranav-pramod-dwivedi/mtproto.zig
- **Core Paradigm**: High-performance, lightweight Telegram MTProto proxy in Zig that disguises traffic within regular HTTPS TLS frames to evade deep packet inspection (DPI).

---

## 4. Cricket Career & Athletic Dossier
- **Player Registry ID**: DES-7 / RDCA-P-PRANAV-DWIVEDI
- **Franchise Club**: Destroyers Cricket Club (DES)
- **Role**: Captain & Premier All-Rounder (Aggressive Right-Hand Bat & Right-Arm Strike Bowler)
- **Jersey**: #7
- **Governing Body**: Rewa Division Cricket Association (RDCA) under Madhya Pradesh Cricket Association (MPCA)
- **Primary Venue**: Awadhesh Pratap Singh University (APSU) Stadium, Rewa

### Tournament Telemetry & Career Statistics:
- **Total Derby Matches Contested**: 34
- **Derby Wins as Captain**: 19
- **Tournament Runs**: 1,435 (All-Time Record #1)
- **Batting Average**: 57.40
- **Strike Rate**: 146.43
- **Highest Score**: 102* Not Out
- **Half-Centuries / Centuries**: 14 Fifties / 1 Century
- **Tournament Wickets**: 66 (All-Time Record #1)
- **Bowling Average**: 16.30
- **Economy Rate**: 5.48
- **Best Bowling in an Innings**: 8/39

### Championship Dynasty:
- **2026 Season**: Atal Bihari Vajpayee Memorial Trophy Champions (3–2 Series Victory vs Dread Eleven) & Championship Final Player of the Match (82 runs off 44 balls and 3/28).
- **2025 Season**: Atal Bihari Vajpayee Memorial Trophy Champions (5–0 Clean Sweep) & Rewa Derby Player of the Year.
- **2024 Season**: Atal Bihari Vajpayee Memorial Trophy Champions (4–1 Series Victory).

---

## 5. Machine-Readable Integration Endpoints
- **Compact Summary**: ${BASE_URL}/llms.txt
- **Complete Dossier**: ${BASE_URL}/llms-full.txt
- **Raw Markdown Resume**: ${BASE_URL}/resume.md
- **Structured JSON-LD Profile**: ${BASE_URL}/profile.json
- **XML Sitemap**: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(rootDir, 'llms-full.txt'), llmsFullTxt.trim());

  // llms.txt (llmstxt.org)
  const llmsTxt = `# Pranav Dwivedi
> Systems Engineer & AI Systems Builder • 3x Champion Cricket Captain (#7, Destroyers CC)
> Rewa Division Cricket Association (RDCA) • Madhya Pradesh, India

## Core Overview
Pranav Dwivedi (Pranav Pramod Dwivedi) is an Indian systems developer and competitive athlete. He creates autonomous AI agents that operate directly on Android and Linux devices with persistent memory and hardware tool calling, while captaining Destroyers Cricket Club (DES) to three consecutive championships in the Atal Bihari Vajpayee Memorial Tournament.

## Primary Sections
- [Overview](${BASE_URL}/): Main landing page with dual-discipline showcase and verified entity anchors.
- [Engineering Projects](${BASE_URL}/engineering): Detailed breakdown of JARVIS, Cricket Motion Analysis, Axiom, VISA-PAY 2.0, and PiXel Arena.
- [Cricket Dossier](${BASE_URL}/cricket): 34-match telemetry against Dread Eleven, 1,435 runs (all-time leader), 66 wickets (all-time leader), 3 championships.
- [About & Philosophy](${BASE_URL}/about): Personal background, technical principles, and dual pursuit ethos.
- [Contact Channels](${BASE_URL}/contact): Direct communication and collaboration channels.

## Verified Machine-Readable APIs
- [Full LLM Context Dossier](${BASE_URL}/llms-full.txt): Comprehensive, un-truncated context dossier for AI systems.
- [Profile JSON](${BASE_URL}/profile.json): Structured JSON schema for search engines and programmatic consumption.
- [Raw Markdown Resume](${BASE_URL}/resume.md): Clean markdown dossier formatted for LLM context windows.

## Verified Canonical Entity Graph (sameAs)
- GitHub Profile: https://github.com/pranav-pramod-dwivedi
- RDCA Central Registry: https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/
- Destroyers CC Franchise Portal: https://destroyers-rewacricket.pages.dev/players/pranav-dwivedi
- ABV Memorial Tournament Hub: https://abv-rewacricket.pages.dev/
- CricHeroes Association 79: https://cricheroes.com/association/79/rewa-divisional-cricket-association/home
- Official Instagram: https://www.instagram.com/destroyers_rewa
`;
  fs.writeFileSync(path.join(rootDir, 'llms.txt'), llmsTxt.trim());

  // resume.md
  const resumeMd = `# Pranav Pramod Dwivedi — Curriculum Vitae & Athletic Dossier
**Location**: Rewa, Madhya Pradesh, India  
**Email**: hkdykk22@gmail.com  
**Website**: ${BASE_URL}  
**GitHub**: https://github.com/pranav-pramod-dwivedi  
**RDCA Player Registry**: https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/  

---

## Executive Summary
Dual-discipline technologist and athlete. Creator of autonomous agent architectures, device automation workflows for rooted Android, and computer vision pipelines for sports kinematics. Three-time consecutive champion captain of Destroyers Cricket Club in the Atal Bihari Vajpayee Memorial Tournament, holding all-time records in both run aggregate (1,435 runs) and wicket aggregate (66 wickets).

---

## Technical Competencies
- **Languages**: Python, Kotlin, JavaScript, TypeScript, Zig, Bash, HTML5, CSS3, SQL
- **AI & Agents**: Tool calling, local LLM orchestration, persistent memory architectures, model routing, autonomous device control
- **Systems & Android**: Rooted Android environments, Termux/Linux integration, Storage Access Framework (SAF), reverse engineering, system daemons
- **Computer Vision**: OpenCV, MediaPipe 33-point pose landmark estimation, kinematic trajectory scoring
- **Web & Backend**: FastAPI, Node.js, Firebase (Auth & Firestore security rules), WebSockets, WebRTC

---

## Key Software Engineering Projects
### 1. JARVIS — Autonomous Android & Linux Personal AI Assistant
- Architected personal assistant operating natively on rooted Android devices via Termux.
- Built long-term memory engine with dynamic tool execution, file manipulation, and model routing.
- Integrated hardware triggers and Termux API for phone-level automation without cloud dependency.

### 2. Cricket Motion Analysis — Computer Vision Batting Kinematics
- Engineered real-time webcam batting swing analysis using MediaPipe pose tracking.
- Implemented bat velocity calculation, impact trajectory scoring, and wireless mobile streaming.

### 3. VISA-PAY 2.0 — High-Performance Fintech Interface
- Designed and built modern digital banking UI with 60fps micro-interactions and liquid-glass styling.
- Zero external runtime framework dependencies; built with pure vanilla JavaScript and CSS3.

### 4. PiXel Arena — Esports Tournament Automation Engine
- Full-stack tournament platform with Firebase Authentication and Firestore security rules.
- Automated bracket progression, squad team management, and real-time leaderboard updates.

---

## Athletic Achievements & Cricket Telemetry (Destroyers CC &bull; #7)
- **Franchise Captaincy**: Captain of Destroyers Cricket Club (DES) across 34 bilateral derby clashes.
- **Championship Titles**:
  - 2026 Atal Bihari Vajpayee Memorial Trophy: Champions (3–2 vs Dread Eleven) & Final MVP (82 runs & 3/28)
  - 2025 Atal Bihari Vajpayee Memorial Trophy: Champions (5–0 Clean Sweep) & Player of the Year
  - 2024 Atal Bihari Vajpayee Memorial Trophy: Champions (4–1 Series Victory)
- **Batting Career**: 1,435 runs at 57.40 average, 146.43 strike rate, 14 fifties, 1 century (102* highest).
- **Bowling Career**: 66 wickets at 16.30 average, 5.48 economy rate, career best figures of 8/39.
`;
  fs.writeFileSync(path.join(rootDir, 'resume.md'), resumeMd.trim());

  // profile.json
  const profileJson = {
    name: "Pranav Dwivedi",
    alternateName: ["Pranav Pramod Dwivedi", "Capt. Pranav Dwivedi", "P. Dwivedi"],
    email: "hkdykk22@gmail.com",
    url: BASE_URL,
    origin: "Rewa, Madhya Pradesh, India",
    roles: [
      "Systems Engineer",
      "AI Builder",
      "Cricket Captain (#7, Destroyers CC)"
    ],
    github: "https://github.com/pranav-pramod-dwivedi",
    cricket: cricketStats,
    projects: engineeringProjects,
    sameAs: PRANAV_SAME_AS
  };
  fs.writeFileSync(path.join(rootDir, 'profile.json'), JSON.stringify(profileJson, null, 2));

  console.log('Generated sitemap.xml, robots.txt, llms.txt, resume.md, and profile.json');
}

// ------------------------------------------------------------
// 8. MASTER BUILD EXECUTION
// ------------------------------------------------------------
export { esc, htmlToMarkdown, minifyCss, minifyJs, BASE_URL };

if (process.argv[1] && fileURLToPath(import.meta.url).endsWith(path.basename(process.argv[1]))) {
  console.log('=== BUILDING PRANAV DWIVEDI INDEPENDENT WEBSITE SUITE ===');

  // Minify CSS
  const cssSrc = fs.readFileSync(path.join(rootDir, 'src/css/styles.css'), 'utf8');
  const cssMin = minifyCss(cssSrc);
  fs.writeFileSync(path.join(rootDir, 'src/css/styles.min.css'), cssMin);
  console.log(`Minified styles.css: ${cssSrc.length} bytes -> ${cssMin.length} bytes`);

  // Minify JS
  const jsSrc = fs.readFileSync(path.join(rootDir, 'src/js/app.js'), 'utf8');
  const jsMin = minifyJs(jsSrc);
  fs.writeFileSync(path.join(rootDir, 'src/js/app.min.js'), jsMin);
  console.log(`Minified app.js: ${jsSrc.length} bytes -> ${jsMin.length} bytes`);

  generateHomePage();
  generateEngineeringPage();
  generateCricketPage();
  generateAboutPage();
  generatePrivacyPage();
  generateContactPage();
  generate404Page();
  generateMachineFiles();

  console.log('=== BUILD COMPLETE! ALL PAGES GENERATED WITH AWWWARDS-GRADE CRAFT ===');
}
