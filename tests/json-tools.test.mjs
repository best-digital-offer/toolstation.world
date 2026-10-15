import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadHelpers() {
  const elements = new Map();
  const make = () => ({ value: '', textContent: '', innerHTML: '', dataset: {}, hidden: false, addEventListener() {}, replaceChildren() {}, append() {}, setAttribute() {}, classList: { toggle() {}, add() {}, remove() {} } });
  const source = make(), output = make(), message = make();
  const doc = {
    body: { dataset: { tool: 'editor' }, append() {}, addEventListener() {} },
    documentElement: { dataset: {} },
    querySelector(selector) { if (selector === '#json-input') return source; if (selector === '#json-output') return output; if (selector === '#tool-message') return message; return elements.get(selector) || null; },
    querySelectorAll() { return []; }, addEventListener() {}, createElement: make,
  };
  let helpers;
  const context = { document: doc, navigator: {}, URL, Blob, setTimeout, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, console };
  context.globalThis = context;
  context.__JSON_TOOLS_TEST_HOOK__ = value => { helpers = value; };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/json-tools.js'), 'utf8'), context);
  return helpers;
}
const h = loadHelpers();

test('parser distinguishes valid, invalid, and empty text', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(h.parse('{"x":1}'))), { ok: true, value: { x: 1 } });
  assert.equal(h.parse('{"x":').ok, false);
  assert.equal(h.parse('').ok, false);
});

test('string escaping and unescaping preserve quotes, slashes, newlines, and Unicode', () => {
  const original = 'quote " slash \\ newline\nहिंदी';
  assert.equal(h.unescapeText(h.escapeText(original)), original);
  assert.throws(() => h.unescapeText('not json'), /Unexpected|valid JSON/);
  assert.throws(() => h.unescapeText('42'), /JSON string value/);
});

test('JSON fixer removes only trailing commas outside strings', () => {
  const source = '{"text":"comma, } stays", "items":[1,2,],}';
  const result = h.trailingCommaSuggestion(source);
  assert.equal(result.removed, 2);
  assert.equal(result.candidate, '{"text":"comma, } stays", "items":[1,2]}');
  assert.deepEqual(JSON.parse(result.candidate), { text: 'comma, } stays', items: [1, 2] });
});

test('parser handles a large valid JSON input without changing its value', () => {
  const text = JSON.stringify({ values: Array.from({ length: 12000 }, (_, i) => ({ id: i, label: `item-${i}` })) });
  const result = h.parse(text);
  assert.equal(result.ok, true);
  assert.equal(result.value.values.length, 12000);
  assert.equal(result.value.values.at(-1).id, 11999);
});

test('CSV conversion quotes commas, quotes, newlines, Unicode, and missing fields', () => {
  const csv = h.jsonToCsv([{ name: 'A, B', note: 'line 1\nline 2', mark: '"ok"', text: 'हिंदी' }, { name: 'Mira', extra: null }]);
  assert.match(csv, /"A, B"/);
  assert.match(csv, /"line 1\nline 2"/);
  assert.match(csv, /"""ok"""/);
  assert.match(csv, /हिंदी/);
  assert.match(csv, /name,note,mark,text,extra/);
  assert.throws(() => h.jsonToCsv({ name: 'not an array' }), /top-level array/);
});

test('CSV parser handles BOM, escaped quotes, commas, and embedded newlines', () => {
  const rows = h.csvParse('\uFEFFname,note\r\n"A, B","said ""hello""\nand left"\r\n');
  assert.deepEqual(JSON.parse(JSON.stringify(rows)), [{ name: 'A, B', note: 'said "hello"\nand left' }]);
  assert.throws(() => h.csvParse('a,b\n"broken,x'), /ends inside a quoted field/);
});

test('nested comparison reports additions, removals, and changed values', () => {
  const diff = h.deepDiff({ user: { name: 'A', old: true }, list: [1] }, { user: { name: 'B' }, list: [1, 2] });
  assert.deepEqual(JSON.parse(JSON.stringify(diff.map(x => x.change).sort())), ['added', 'changed', 'removed']);
  assert.equal(h.deepDiff({ a: 1, b: 2 }, { b: 2, a: 1 }).length, 0);
});

test('schema subset checks common types and constraints', () => {
  const errors = h.schemaErrors({ age: 14, name: '' }, { type: 'object', required: ['id'], properties: { age: { type: 'integer', minimum: 18 }, name: { type: 'string', minLength: 1 } } });
  assert.equal(errors.length, 3);
  assert.match(errors.join(' '), /required|minimum|minLength/);
});

test('schema inference, YAML quoting, and TypeScript output are deterministic', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(h.inferSchema({ id: 1, list: [true] }))).required, ['id', 'list']);
  assert.match(h.toYaml({ word: 'true', title: 'hello' }), /word: "true"/);
  assert.match(h.toType({ id: 1, 'display name': 'Ada' }), /"display name": string/);
});

test('keyword mapping retains all 149 source rows and no source metrics are published', () => {
  const sourcePath = path.join(root, 'planning/keyword-research.csv');
  const mapPath = path.join(root, 'planning/keyword-map.json');
  if (fs.existsSync(sourcePath)) {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const mapping = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    assert.equal(mapping.sourceRows, 149);
    assert.equal(source.split(/\r?\n/).filter(Boolean).length - 1, 149);
  } else {
    assert.equal(fs.existsSync(mapPath), false, 'private mapping is absent when research source is omitted');
  }
  assert.equal(fs.existsSync(path.join(root, '_site/planning/keyword-map.json')), false);
});

test('production build has 25 static article routes and valid canonical metadata', () => {
  const files = fs.readdirSync(path.join(root, '_site/blog/json'), { withFileTypes: true }).filter(entry => entry.isDirectory());
  assert.equal(files.length, 25);
  for (const entry of files) {
    const html = fs.readFileSync(path.join(root, '_site/blog/json', entry.name, 'index.html'), 'utf8');
    assert.match(html, /<h1>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/toolstation\.world\/blog\/json\//);
  }
  const sitemap = fs.readFileSync(path.join(root, '_site/sitemap.xml'), 'utf8');
  assert.match(sitemap, /https:\/\/toolstation\.world\/blog\/json\/json-formatter-guide\//);
});

test('each article has at least 1,000 non-boilerplate editorial words', () => {
  const sources = fs.readdirSync(path.join(root, 'content/articles')).filter(name => name.endsWith('.md'));
  assert.equal(sources.length, 25);
  for (const filename of sources) {
    const raw = fs.readFileSync(path.join(root, 'content/articles', filename), 'utf8');
    const body = raw.split(/^---\s*$/m).slice(2).join('---');
    const editorial = body.split(/\r?\n/).filter(line => !/^\s{4,}/.test(line) && !/^#{1,3}\s/.test(line)).join(' ');
    const words = editorial.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu) || [];
    assert.ok(words.length >= 1000, `${filename} has ${words.length} editorial words`);
  }
});

test('all same-site links in generated guides resolve to public files', () => {
  for (const entry of fs.readdirSync(path.join(root, '_site/blog/json'), { withFileTypes: true }).filter(item => item.isDirectory())) {
    const html = fs.readFileSync(path.join(root, '_site/blog/json', entry.name, 'index.html'), 'utf8');
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#)/i.test(href)) continue;
      const url = new URL(href, `https://toolstation.world/blog/json/${entry.name}/`);
      let file = path.join(root, '_site', decodeURIComponent(url.pathname).replace(/^\//, ''));
      if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
      assert.ok(fs.existsSync(file), `${entry.name} has a broken internal link: ${href}`);
    }
  }
});
