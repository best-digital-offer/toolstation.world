import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');
const config = JSON.parse(fs.readFileSync(path.join(root, 'site-config.json'), 'utf8'));
const run = (script) => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', script)], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${script} failed`);
  process.stdout.write(result.stdout);
};
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
if (fs.existsSync(path.join(root, 'planning/keyword-research.csv'))) run('map-keywords.mjs');
else console.log('Keyword source CSV is not present; skipped private keyword-map regeneration.');
run('build-json-pages.mjs');

const excluded = new Set(['.git','.github','planning','content','scripts','data','tests','node_modules','_site','outputs','work']);
function copyTree(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.name.startsWith('.DS_Store')) continue;
    const from = path.join(src, entry.name), to = path.join(dest, entry.name);
    if (entry.isDirectory()) { fs.mkdirSync(to, { recursive: true }); copyTree(from, to); }
    else if (!['package-lock.json'].includes(entry.name)) fs.copyFileSync(from, to);
  }
}
copyTree(root, out);

const articlesDir = path.join(root, 'content/articles');
const articles = fs.readdirSync(articlesDir).filter(name => name.endsWith('.md')).map(file => {
  const text = fs.readFileSync(path.join(articlesDir, file), 'utf8');
  const chunks = text.split(/^---\s*$/m);
  if (chunks.length < 3) throw new Error(`Missing article frontmatter: ${file}`);
  const meta = {};
  for (const line of chunks[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (match) { try { meta[match[1]] = JSON.parse(match[2]); } catch { meta[match[1]] = match[2].replace(/^"|"$/g, ''); } }
  }
  const body = chunks.slice(2).join('---').trim();
  if (!meta.title || !meta.description) throw new Error(`Missing title/description: ${file}`);
  return { slug: file.slice(0, -3), ...meta, body };
});

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(s) {
  return esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const slug = href.replace(/^\.\//, '').replace(/\/$/, '');
    const target = !href.startsWith('/') && articles.some(article => article.slug === slug) ? `/blog/json/${slug}/` : href;
    return `<a href="${esc(target)}">${label}</a>`;
  })
    .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function markdown(src) {
  const lines = src.split(/\r?\n/); let html = '', para = [], list = '', listType = '', code = [];
  const conclusion = lines.findIndex(line => /^##\s+Conclusion\s*$/i.test(line));
  if (conclusion >= 0) {
    const nextHeading = lines.findIndex((line, index) => index > conclusion && /^#{1,3}\s+/.test(line));
    if (nextHeading >= 0) lines.push(...lines.splice(conclusion, nextHeading - conclusion));
  }
  const flushP = () => { if (para.length) html += `<p>${inline(para.join(' '))}</p>`; para = []; };
  const flushL = () => { if (list) { html += `${list}</${listType}>`; list = ''; listType = ''; } };
  const flushC = () => { if (code.length) { html += `<pre><code>${esc(code.join('\n'))}</code></pre>`; code = []; } };
  for (const line of lines) {
    if (/^\s*$/.test(line)) { flushP(); flushL(); flushC(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (heading) { flushP(); flushL(); flushC(); const n = heading[1].length; html += `<h${n}>${inline(heading[2])}</h${n}>`; }
    else if (item || ordered) { flushP(); flushC(); const nextType = ordered ? 'ol' : 'ul'; if (list && listType !== nextType) flushL(); if (!list) { list = `<${nextType}>`; listType = nextType; } list += `<li>${inline((ordered || item)[1])}</li>`; }
    else if (/^    /.test(line)) { flushP(); flushL(); code.push(line.slice(4)); }
    else { flushC(); flushL(); para.push(line.trim()); }
  }
  flushP(); flushL(); flushC(); return html;
}
const sharedCss = '/assets/json-tools.css';
function articleShell(a, content) {
  const canonical = `${config.siteUrl}/blog/json/${a.slug}/`;
  const related = (a.relatedArticles || []).map(slug => {
    const found = articles.find(item => item.slug === slug);
    return found ? `<li><a href="../${esc(slug)}/">${esc(found.title)}</a></li>` : '';
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(a.title)} | ToolStation</title><meta name="description" content="${esc(a.description)}"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="${sharedCss}"></head><body class="json-site"><header class="jl-header"><div class="jl-container jl-header-inner"><a class="jl-brand" href="/">ToolStation</a><nav class="jl-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/json/">JSON Tools</a><a href="/blog/" aria-current="page">Guides</a><a href="/about.html">About</a><a href="/contact.html">Contact</a></nav></div></header><main class="jl-container jl-article"><nav class="jl-breadcrumb"><a href="/">Home</a> / <a href="/blog/">Guides</a> / ${esc(a.title)}</nav><article><header class="jl-tool-intro"><h1>${esc(a.title)}</h1><p>${esc(a.description)}</p></header><div class="jl-content">${content}</div></article><aside class="jl-content"><h2>Related guides</h2><ul>${related}</ul><p><a href="/json/">Explore all JSON tools</a></p></aside></main><footer class="jl-footer"><div class="jl-container"><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="/disclaimer.html">Disclaimer</a> · <a href="/sitemap.xml">Sitemap</a></div></footer></body></html>`;
}
for (const article of articles) {
  const target = path.join(out, 'blog/json', article.slug, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, articleShell(article, markdown(article.body)));
}
const blogBase = '/blog/';
const blogHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JSON Guides and Tutorials | ToolStation</title><meta name="description" content="Practical JSON tutorials for formatting, validation, conversion, schemas, and safe data handling."><link rel="canonical" href="${config.siteUrl}/blog/"><link rel="stylesheet" href="${sharedCss}"></head><body class="json-site"><header class="jl-header"><div class="jl-container jl-header-inner"><a class="jl-brand" href="/">ToolStation</a><nav class="jl-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/json/">JSON Tools</a><a href="/blog/" aria-current="page">Guides</a></nav></div></header><main class="jl-container jl-section"><h1>JSON Guides and Tutorials</h1><p>Clear explanations, practical examples, and limitations for common JSON tasks.</p><div class="jl-tool-grid">${articles.map(a => `<a class="jl-tool-card" href="json/${esc(a.slug)}/"><span><h2>${esc(a.title)}</h2><p>${esc(a.description)}</p></span></a>`).join('')}</div></main><footer class="jl-footer"><div class="jl-container"><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="/disclaimer.html">Disclaimer</a></div></footer></body></html>`;
fs.mkdirSync(path.join(out, 'blog'), { recursive: true });
fs.writeFileSync(path.join(out, 'blog/index.html'), blogHtml);

const urls = [];
function collect(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name), next = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) collect(abs, next);
    else if (e.name === 'index.html') urls.push(`${config.siteUrl}/${rel ? `${rel}/` : ''}`);
    else if (/^(about|contact|privacy|terms|disclaimer)\.html$/.test(e.name)) urls.push(`${config.siteUrl}/${next}`);
  }
}
collect(out);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].sort().map(url => `  <url><loc>${esc(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemap);
console.log(`Built static site: ${articles.length} guide routes; ${urls.length} indexed URLs.`);
