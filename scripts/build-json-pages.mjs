import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'data/json-tools.json'), 'utf8'));
const siteUrl = 'https://toolstation.world';

function esc(text) { return String(text).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }
function relLink(from, to) {
  const relative = path.relative(from, path.join(root, to)).replace(/\\/g, '/');
  return to === '' ? `${relative || '.'}/` : relative;
}
function groupTools() { return [...new Set(tools.map(tool => tool.group))]; }
function card(tool, prefix) {
  return `<a class="jl-tool-card" href="${prefix}tools/json/${esc(tool.slug)}/" data-searchable><span class="jl-tool-icon" aria-hidden="true">{ }</span><span><h3>${esc(tool.name)}</h3><p>${esc(tool.description)}</p></span></a>`;
}
function header(base, active = '') {
  return `<header class="jl-header"><div class="jl-container jl-header-inner"><a class="jl-brand" href="${base}index.html" aria-label="ToolStation home"><span class="jl-mark" aria-hidden="true">{ }</span>ToolStation</a><button class="jl-menu-button" type="button" aria-label="Open navigation" aria-expanded="false" id="menu-toggle">☰</button><nav class="jl-nav" id="main-nav" aria-label="Main navigation"><a href="${base}index.html">Home</a><a href="${base}json/" ${active === 'tools' ? 'aria-current="page"' : ''}>JSON Tools</a><a href="${base}blog/">Guides</a><a href="${base}about.html">About</a><a href="${base}contact.html">Contact</a></nav><div class="jl-header-actions"><button class="jl-icon-button" type="button" id="theme-toggle" aria-label="Toggle dark theme" aria-pressed="false">◐</button></div></div></header>`;
}
function footer(base) {
  return `<footer class="jl-footer"><div class="jl-container"><div class="jl-footer-links"><a href="${base}about.html">About</a><a href="${base}contact.html">Contact</a><a href="${base}privacy.html">Privacy Policy</a><a href="${base}terms.html">Terms</a><a href="${base}disclaimer.html">Disclaimer</a><a href="${base}sitemap.xml">Sitemap</a></div><p>JSON inputs are handled by this browser page. Avoid pasting secrets into any website, including this one.</p></div></footer>`;
}
function layout({ title, description, canonical, base, body, active }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${siteUrl}${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${siteUrl}${canonical}"><meta name="theme-color" content="#ffffff"><title>${esc(title)}</title><link rel="stylesheet" href="${base}assets/json-tools.css"></head><body class="json-site">${header(base, active)}<main class="jl-container">${body}</main>${footer(base)}<script src="${base}assets/json-tools.js" defer></script><script defer src="${base}assets/json-navigation.js"></script></body></html>`;
}

const defaults = {
  format: '{"name":"Ada Lovelace","active":true,"skills":["math","computing"]}',
  minify: '{\n  "name": "Ada Lovelace",\n  "active": true,\n  "skills": ["math", "computing"]\n}',
  'format-validate': '{"name":"Ada Lovelace","active":true}', editor: '{"name":"Ada Lovelace","active":true}', validate: '{"name":"Ada Lovelace","active":true}', parse: '{"name":"Ada Lovelace","active":true}',
  repair: '{"name":"Ada Lovelace",}', file: '{"name":"Ada Lovelace","active":true}', tree: '{"person":{"name":"Ada","skills":["math","computing"]},"active":true}',
  'schema-validate': '{"name":"Ada","age":36}', 'schema-generate': '{"name":"Ada","active":true,"roles":["author","mathematician"]}', compare: '{"name":"Ada","active":true,"location":{"city":"London"}}',
  stringify: '{"message":"Line one\\nLine two","ok":true}', escape: 'Line one\nA quote: "yes"', unescape: '"Line one\\nLine two"', comments: '{\n  // Replace this comment with nothing?\n  "ok": true\n}', 'parse-string': '"{\\"enabled\\":true}"',
  'json-csv': '[{"name":"Ada","address":{"city":"London"}},{"name":"Grace","address":{"city":"New York"}}]', 'json-array-csv': '["red","green","blue"]', 'nested-csv': '[{"id":1,"user":{"name":"Asha"},"items":[{"sku":"A1"}]}]',
  'csv-json': 'name,note\n"Ada","said ""hello"", then left"\n"Grace","line one\nline two"', yaml: '{"name":"Ada Lovelace","active":true,"tags":["math","computing"]}',
  xml: '<catalog><item id="1"><name>Notebook</name></item><item id="2"><name>Pen</name></item></catalog>', typescript: '{"id":1,"name":"Ada","skills":["math","computing"]}',
  'jsonl-json': '{"id":1}\n{"id":2,"note":"two"}', 'json-jsonl': '[{"id":1},{"id":2}]', generate: 'name:string\nactive:boolean\ncount:number', examples: '{"hello":"world"}', jsonld: '{"@context":"https://schema.org","@type":"Person","name":"Ada Lovelace"}'
};

function exampleButtons() {
  return `<div class="jl-controls" aria-label="Example data"><button type="button" class="jl-button" data-action="example" data-example="simple">Load simple example</button><button type="button" class="jl-button" data-action="example" data-example="people">Load nested example</button></div>`;
}

function inputEditor(value, second = false, inputLabel = 'Input JSON') {
  const id = second ? 'json-second' : 'json-input';
  const label = second ? 'Right JSON' : inputLabel;
  if (second) return `<section class="jl-panel"><div class="jl-panel-head"><span>${label}</span><button type="button" data-action="load-file" data-target="second" aria-label="Load a local file into the ${label.toLowerCase()}">Load file</button></div><textarea class="jl-plain-input" id="${id}" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${label}">${esc(value)}</textarea></section>`;
  return `<section class="jl-panel"><div class="jl-panel-head"><span>${label}</span><button type="button" data-action="load-file" aria-label="Load a local file into the ${label.toLowerCase()}">Load file</button></div><div class="jl-editor-wrap${second ? ' jl-secondary-editor' : ''}"><pre class="jl-gutter" aria-hidden="true" id="${second ? 'second-lines' : 'input-lines'}">1</pre><div class="jl-code-stack"><pre class="jl-code-visual" aria-hidden="true"><code id="${second ? 'second-highlight' : 'input-highlight'}">${esc(value)}</code></pre><textarea id="${id}" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${label}" aria-describedby="tool-message">${esc(value)}</textarea></div></div></section>`;
}

function inputLabel(tool) {
  return ({ xml: 'Input XML', 'csv-json': 'Input CSV', 'jsonl-json': 'Input JSONL', generate: 'Field definitions' })[tool.type] || 'Input JSON';
}

function extraControls(tool) {
  if (tool.slug === 'example-explorer') return `<div class="jl-extra"><label for="example-select">Choose a sample dataset</label><select id="example-select"><option value="simple">Simple configuration</option><option value="people">People and skills</option><option value="nested">Nested orders</option><option value="products">Product records</option></select><button type="button" class="jl-button" data-action="example-select">Load selected example</button><small>Examples are illustrative data generated with the page; no network request is needed.</small></div>`;
  if (tool.type === 'compare') return `<div class="jl-extra"><label for="json-second">Second JSON value</label><textarea id="json-second" spellcheck="false" aria-label="Second JSON value">{"name":"Ada","active":false,"location":{"city":"London"}}</textarea></div>`;
  if (tool.type === 'schema-validate') return `<div class="jl-extra"><label for="schema-input">JSON Schema subset</label><textarea id="schema-input" spellcheck="false">{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer","minimum":0}},"required":["name"]}</textarea><small>Supported here: core types, properties, required, items, enum, const, numeric and string bounds, and pattern. Other keywords are ignored.</small></div>`;
  if (tool.type === 'json-csv') return `<div class="jl-extra"><label><input id="flatten-objects" type="checkbox" checked> Flatten nested objects into dotted column names</label><small>Nested arrays are preserved as JSON text in a cell. Missing values become empty cells.</small></div>`;
  if (tool.slug === 'dummy-json') return `<div class="jl-extra"><label for="generate-count">Number of sample records (1–50)</label><input id="generate-count" type="number" min="1" max="50" value="3"><small>Samples are generic placeholders generated in this browser session.</small></div>`;
  if (tool.type === 'stringify') return `<div class="jl-extra"><label><input id="compact" type="checkbox"> Use compact output (no indentation)</label></div>`;
  return '';
}

function primaryAction(tool) {
  const map = {
    repair: ['repair','Suggest safe repair'], comments: ['comments','Prepare comment-free suggestion'],
    'schema-validate': ['validate-schema','Validate against supported subset'], 'schema-generate': ['generate-schema','Generate schema'],
    generate: ['generate','Generate JSON'], 'dummy-generate': ['generate','Generate sample data'], jsonld: ['jsonld','Inspect JSON-LD'],
    format: ['format','Format JSON'], editor: ['format','Format JSON'], 'format-validate': ['format','Validate and format'],
    parse: ['run','Parse JSON'], file: ['run','Read JSON'], tree: ['run','Build JSON tree'], stringify: ['run','Stringify JSON'],
    escape: ['run','Escape JSON string'], unescape: ['run','Unescape JSON string'], comments: ['comments','Prepare comment-free suggestion'],
    'parse-string': ['run','Parse JSON string'], 'csv-json': ['run','Convert CSV to JSON'], yaml: ['run','Convert JSON to YAML'],
    xml: ['run','Convert XML to JSON'], typescript: ['run','Generate TypeScript'], 'jsonl-json': ['run','Convert JSONL to JSON'],
    'json-jsonl': ['run','Convert JSON to JSONL'], examples: ['run','Inspect JSON example'],
  };
  const [action, label] = map[tool.type] || ['run', tool.type === 'validate' ? 'Validate JSON' : tool.type === 'minify' ? 'Minify JSON' : tool.type === 'compare' ? 'Compare values' : tool.type === 'json-csv' || tool.type === 'json-array-csv' || tool.type === 'nested-csv' ? 'Convert to CSV' : 'Process JSON'];
  return `<button type="button" class="jl-button jl-button-primary" data-action="${action}">${label}</button>`;
}

for (const tool of tools) {
  const pagePath = path.join(root, 'tools/json', tool.slug, 'index.html');
  const base = relLink(path.dirname(pagePath), '');
  fs.mkdirSync(path.dirname(pagePath), { recursive: true });
  const initial = defaults[tool.type] ?? defaults[tool.slug] ?? defaults.editor;
  const isCompare = tool.type === 'compare';
  const hasSchema = tool.type === 'schema-validate';
  const actionLabel = tool.type === 'repair' ? 'JSON Fixer' : tool.name;
  const csvOutput = ['json-csv','json-array-csv','nested-csv'].includes(tool.type);
  const extension = csvOutput ? 'csv' : tool.type === 'yaml' ? 'yaml' : tool.type === 'typescript' ? 'ts' : tool.type === 'json-jsonl' ? 'jsonl' : 'json';
  const interfaceHtml = `${extraControls(tool)}<div class="jl-editor-grid">${inputEditor(initial, false, inputLabel(tool))}${isCompare ? inputEditor('{"name":"Ada","active":false}', true) : `<section class="jl-panel"><div class="jl-panel-head"><span>Output</span><span><button type="button" data-action="copy">Copy</button><button type="button" data-action="download" data-filename="${tool.slug}-output.${extension}" data-mime="${csvOutput ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'}">Download</button></span></div><div class="jl-editor-wrap"><pre class="jl-gutter" aria-hidden="true" id="output-lines">1</pre><pre class="jl-output"><code id="json-output" aria-live="polite"></code></pre></div></section>`}</div>${isCompare ? `<div class="jl-panel" style="margin-top:12px"><div class="jl-panel-head"><span>Comparison result</span><span><button type="button" data-action="copy">Copy</button><button type="button" data-action="download" data-filename="json-diff.txt" data-mime="text/plain;charset=utf-8">Download</button></span></div><pre class="jl-output"><code id="json-output" aria-live="polite"></code></pre></div>` : ''}<div class="jl-controls">${primaryAction(tool)}<button type="button" class="jl-button" data-action="example" data-example="people">Load example</button><button type="button" class="jl-button" data-action="clear">Clear</button></div><p class="jl-message" id="tool-message" role="status" aria-live="polite" hidden></p>${treePanel(tool)}<input type="file" id="json-file" accept=".json,.jsonl,.ndjson,.csv,.xml,.txt,application/json,text/csv,application/xml,text/plain" hidden>`;
  const extraText = hasSchema ? 'The validator implements a documented subset of JSON Schema Draft 2020-12 core assertions. It does not resolve references or implement every vocabulary.' : tool.type === 'repair' ? 'The fixer only proposes removal of trailing commas when the proposed result parses successfully. It never edits the source automatically.' : tool.type.includes('csv') ? 'CSV has no native representation for nested values. This tool flattens nested objects by default, preserves arrays as JSON text, and leaves absent cells empty.' : tool.type === 'jsonld' ? 'This page parses JSON-LD and checks a few common structural fields. It is not a substitute for a complete Schema.org validator or search-engine rich-results testing.' : 'Input is processed locally in the page. This tool does not send your JSON to a conversion API.';
  const body = `<div class="jl-breadcrumb"><a href="${base}index.html">Home</a> / <a href="${base}json/">JSON Tools</a> / ${esc(actionLabel)}</div><section class="jl-tool-intro"><h1>${esc(tool.name)}</h1><p>${esc(tool.description)}</p></section><section aria-label="${esc(tool.name)}">${interfaceHtml}</section><aside class="jl-note"><strong>How this tool handles data:</strong> ${esc(extraText)}</aside><div class="jl-ad-slot" aria-hidden="true"></div><section class="jl-content"><h2>How to use this tool</h2><ol><li>Paste or type a value in the input panel, or load a local file.</li><li>Choose the action above. Errors appear here with details from the browser parser where available.</li><li>Review the generated result before copying or downloading it.</li></ol><h2>Examples and limitations</h2><p>Use the example button to see a representative input. JSON syntax is strict: property names and strings use double quotes, and comments and trailing commas are not part of standard JSON. ${esc(extraText)}</p><h2>Privacy note</h2><p>Processing runs in this page. The site does not upload the editor contents as part of this tool. Avoid entering credentials or other secrets into online services.</p><h2>Related JSON tools</h2><p><a href="${base}tools/json/formatter/">JSON Formatter</a> · <a href="${base}tools/json/validator/">JSON Validator</a> · <a href="${base}tools/json/compare/">JSON Compare</a> · <a href="${base}tools/json/to-csv/">JSON to CSV</a> · <a href="${base}json/">Browse all JSON tools</a></p></section>`;
  const title = `${tool.name} — Free Online JSON Tool | ToolStation`;
  const description = `${tool.description} Free browser-based utility from ToolStation.`;
  const page = layout({ title, description, canonical: `/tools/json/${tool.slug}/`, base, body, active: 'tools' }).replace(`</body>`, `<script>document.body.dataset.tool=${JSON.stringify(tool.type)};</script></body>`);
  fs.writeFileSync(pagePath, page);
}

function treePanel(tool) {
  return ['tree','jsonld'].includes(tool.type) || tool.slug === 'structure-explorer' || tool.slug === 'example-explorer' ? '<section class="jl-panel" style="margin-top:12px"><div class="jl-panel-head"><span>Structure view</span></div><ul class="jl-tree" id="json-tree" aria-label="JSON structure"></ul></section>' : '';
}

const hubPath = path.join(root, 'json/index.html');
const hubBase = relLink(path.dirname(hubPath), '');
const groups = groupTools().map(group => `<section class="jl-section"><h2>${esc(group)}</h2><div class="jl-tool-grid">${tools.filter(tool => tool.group === group).map(tool => card(tool, hubBase)).join('')}</div></section>`).join('');
function guideCard(slug) {
  const source = path.join(root, 'content/articles', `${slug}.md`);
  const markdown = fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '';
  const title = markdown.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? slug.replaceAll('-', ' ');
  const description = markdown.match(/^description:\s*"?(.+?)"?\s*$/m)?.[1] ?? 'Read a practical guide with examples and limitations.';
  return `<a class="jl-tool-card" data-searchable href="${hubBase}blog/json/${esc(slug)}/"><span class="jl-tool-icon" aria-hidden="true">Aa</span><span><h3>${esc(title)}</h3><p>${esc(description)}</p></span></a>`;
}
const hubBody = `<section class="jl-hero"><h1>Free online JSON tools for developers</h1><p>Format, validate, compare, and convert structured data in your browser. The tools below run locally in this page.</p></section><section aria-label="Quick JSON formatter"><div class="jl-editor-grid">${inputEditor('{"name":"Ada Lovelace","active":true,"skills":["math","computing"]}')}<section class="jl-panel"><div class="jl-panel-head"><span>Formatted JSON</span><button type="button" data-action="copy">Copy</button></div><div class="jl-editor-wrap"><pre class="jl-gutter" id="output-lines" aria-hidden="true">1</pre><pre class="jl-output"><code id="json-output" aria-live="polite"></code></pre></div></section></div><div class="jl-controls"><button type="button" class="jl-button jl-button-primary" data-action="run">Format</button><button type="button" class="jl-button" data-action="run">Validate</button><button type="button" class="jl-button" data-action="run" onclick="document.body.dataset.tool='minify'">Minify</button><button type="button" class="jl-button" data-action="clear">Clear</button><button type="button" class="jl-button" data-action="example" data-example="nested">Load nested example</button></div><p class="jl-message" id="tool-message" role="status" aria-live="polite" hidden></p></section><section class="jl-section"><h2>Popular JSON tools</h2><p class="jl-section-intro">Start with the common formatting, validation, and conversion tasks.</p><div class="jl-tool-grid">${['formatter','validator','minifier','compare','to-csv','csv-to-json'].map(slug => card(tools.find(tool => tool.slug === slug), hubBase)).join('')}</div></section><section class="jl-section"><h2>Search all JSON tools</h2><label for="tool-search" class="jl-sr-only">Search JSON tools</label><div class="jl-search-row"><input type="search" id="tool-search" placeholder="Search tools by name or task" autocomplete="off"></div>${groups}</section><section class="jl-section"><h2>JSON guides</h2><p class="jl-section-intro">Practical guides for formatting, validation, conversion, and working with JSON data.</p><div class="jl-tool-grid">${['json-formatter-guide','json-validator-guide','json-to-csv','nested-json-to-csv','csv-to-json','large-json-files'].map(guideCard).join('')}</div></section><div class="jl-ad-slot" aria-hidden="true"></div><section class="jl-content"><h2>Privacy and practical limits</h2><p>Inputs are handled by JavaScript in your current browser page. They are not placed in a URL or sent to a conversion service. Avoid pasting secrets into any online tool. Some conversions, especially from nested JSON to CSV, require choices because CSV is a flat table format.</p><p>JSON Schema and JSON-LD pages explain which checks are supported and which standards features they do not cover. Review output before using it in production.</p><input type="file" id="json-file" accept=".json,application/json" hidden></section>`;
const hubPage = layout({ title: 'Free Online JSON Tools | ToolStation', description: 'Format, validate, compare, and convert JSON with free browser-based tools. Explore the full JSON tool directory and practical guides.', canonical: '/json/', base: hubBase, body: hubBody, active: 'tools' }).replace('<body class="json-site">','<body class="json-site" data-tool="editor">').replace('data-action="run">Format</button><button type="button" class="jl-button" data-action="run">Validate</button><button type="button" class="jl-button" data-action="run" onclick="document.body.dataset.tool=\'minify\'">Minify','data-action="format">Format</button><button type="button" class="jl-button" data-action="validate">Validate</button><button type="button" class="jl-button" data-action="minify">Minify');
fs.mkdirSync(path.dirname(hubPath), { recursive: true });
fs.writeFileSync(hubPath, hubPage);
console.log(`Generated ${tools.length} static JSON tool pages and the JSON tools hub.`);

