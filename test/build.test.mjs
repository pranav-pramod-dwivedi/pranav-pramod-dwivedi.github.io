import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, htmlToMarkdown, minifyCss, minifyJs, BASE_URL } from '../scripts/build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Portfolio Site - Build System & Helpers', () => {
  describe('esc (HTML Entity Escaping)', () => {
    it('escapes &, <, >, ", and single quote', () => {
      assert.equal(esc('Tom & Jerry <cartoon> "fun" \'times\''), 'Tom &amp; Jerry &lt;cartoon&gt; &quot;fun&quot; &#39;times&#39;');
    });

    it('handles empty or non-string inputs safely', () => {
      assert.equal(esc(''), '');
      assert.equal(esc(null), '');
      assert.equal(esc(undefined), '');
      assert.equal(esc(123), '123');
    });
  });

  describe('htmlToMarkdown Converter', () => {
    it('converts basic tags to markdown equivalents', () => {
      const html = '<main><h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em> with <code>code</code>.</p></main>';
      const md = htmlToMarkdown(html, { title: 'Test Page', url: 'https://example.com/test' });
      assert.match(md, /# Test Page/);
      assert.match(md, /Source: https:\/\/example\.com\/test/);
      assert.match(md, /# Title/);
      assert.match(md, /\*\*bold\*\*/);
      assert.match(md, /_italic_/);
      assert.match(md, /`code`/);
    });

    it('converts unordered and ordered lists', () => {
      const html = '<main><ul><li>Item A</li><li>Item B</li></ul><ol><li>First</li><li>Second</li></ol></main>';
      const md = htmlToMarkdown(html);
      assert.match(md, /- Item A/);
      assert.match(md, /- Item B/);
      assert.match(md, /1\. First/);
      assert.match(md, /1\. Second/);
    });

    it('strips script, style, and svg tags completely', () => {
      const html = '<main><script>alert("xss")</script><style>.bad{}</style><svg><path/></svg><p>Clean content</p></main>';
      const md = htmlToMarkdown(html);
      assert.equal(md.includes('alert'), false);
      assert.equal(md.includes('.bad'), false);
      assert.equal(md.includes('path'), false);
      assert.match(md, /Clean content/);
    });

    it('converts links to markdown link syntax', () => {
      const html = '<main><p>Visit <a href="https://github.com">GitHub</a> for code.</p></main>';
      const md = htmlToMarkdown(html);
      assert.match(md, /\[GitHub\]\(https:\/\/github\.com\)/);
    });
  });

  describe('minifyCss and minifyJs', () => {
    it('removes comments and excess whitespace in CSS', () => {
      const css = '/* comment */ body { color: red ;   margin : 0px ; }';
      const min = minifyCss(css);
      assert.equal(min, 'body{color:red;margin:0px}');
    });

    it('removes line and block comments in JS', () => {
      const js = '/* banner */ function test() {\n  // line comment\n  return 42;\n}';
      const min = minifyJs(js);
      assert.equal(min.includes('banner'), false);
      assert.equal(min.includes('line comment'), false);
      assert.match(min, /function test\(\)\s*\{\s*return 42;\s*\}/);
    });
  });

  describe('Generated Artifacts Integrity', () => {
    it('profile.json is valid and contains expected personal schema', () => {
      const profilePath = path.join(rootDir, 'profile.json');
      assert.equal(fs.existsSync(profilePath), true);
      const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      assert.equal(profile.name, 'Pranav Dwivedi');
      assert.equal(typeof profile.email, 'string');
      assert.equal(Array.isArray(profile.roles), true);
    });

    it('sitemap.xml is valid XML and contains essential routes', () => {
      const sitemapPath = path.join(rootDir, 'sitemap.xml');
      assert.equal(fs.existsSync(sitemapPath), true);
      const xml = fs.readFileSync(sitemapPath, 'utf8');
      assert.match(xml, /<urlset\b/);
      assert.match(xml, new RegExp(`<loc>${BASE_URL}/</loc>`));
      assert.match(xml, new RegExp(`<loc>${BASE_URL}/engineering/</loc>`));
      assert.match(xml, new RegExp(`<loc>${BASE_URL}/cricket/</loc>`));
      assert.match(xml, new RegExp(`<loc>${BASE_URL}/about/</loc>`));
    });

    it('llms.txt exists and describes the engineering surfaces', () => {
      const llmsPath = path.join(rootDir, 'llms.txt');
      assert.equal(fs.existsSync(llmsPath), true);
      const content = fs.readFileSync(llmsPath, 'utf8');
      assert.match(content, /Pranav Dwivedi/);
      assert.match(content, /engineering/);
    });
  });
});
