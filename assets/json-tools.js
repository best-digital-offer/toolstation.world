(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const el = (tag, attrs = {}, text = '') => { const node = document.createElement(tag); Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value)); if (text !== '') node.textContent = text; return node; };
  const source = $('#json-input');
  const output = $('#json-output');
  const message = $('#tool-message');
  const tree = $('#json-tree');
  const schemaBox = $('#schema-input');
  const mode = document.body.dataset.tool || 'editor';
  let fileTarget = source;
  if (!source || !output) return;

  const examples = {
    people: [{ name: 'Ada Lovelace', role: 'Engineer', address: { city: 'London', country: 'UK' }, skills: ['math', 'computing'] }, { name: 'Grace Hopper', role: 'Computer scientist', address: { city: 'New York', country: 'US' }, skills: ['compilers'] }],
    nested: [{ id: 1, customer: { name: 'Asha', region: 'South' }, items: [{ sku: 'P-1', qty: 2 }, { sku: 'P-2', qty: 1 }] }, { id: 2, customer: { name: 'Mika', region: 'West' }, items: [] }],
    simple: { project: 'sample', enabled: true, count: 3, tags: ['local', 'JSON'], details: { owner: 'ToolStation', note: null } },
    products: [{ id: 101, title: 'Notebook', price: 4.5, available: true }, { id: 102, title: 'Pen, blue', price: 1.25, available: false }],
  };

  function parse(text) {
    try { return { ok: true, value: JSON.parse(text) }; }
    catch (error) {
      const match = String(error.message).match(/(?:position|column)\s+(\d+)/i);
      const offset = match ? Number(match[1]) : null;
      if (offset == null) return { ok: false, error: error.message };
      const before = text.slice(0, offset);
      return { ok: false, error: `${error.message} (line ${before.split('\n').length}, column ${(before.split('\n').at(-1) || '').length + 1})` };
    }
  }

  function escapeText(value) { return JSON.stringify(value); }
  function unescapeText(text) {
    const result = parse(text);
    if (!result.ok) throw new Error(result.error);
    if (typeof result.value !== 'string') throw new Error('Input must be a JSON string value.');
    return result.value;
  }

  function trailingCommaSuggestion(text) {
    let result = '', inString = false, escaped = false, removed = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        result += ch;
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; result += ch; continue; }
      if (ch === ',') {
        let next = i + 1;
        while (next < text.length && /\s/.test(text[next])) next++;
        if (text[next] === '}' || text[next] === ']') { removed++; continue; }
      }
      result += ch;
    }
    return { candidate: result, removed };
  }

  function setMessage(text, kind = 'info') {
    if (!message) return;
    message.textContent = text;
    message.dataset.kind = kind;
    message.hidden = !text;
  }

  function highlight(text) {
    const safe = esc(text);
    return safe.replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token, stringToken, colon, literal) => {
      if (stringToken) return `<span class="tok-string">${stringToken}</span>${colon ? '<span class="tok-punct">:</span>' : ''}`;
      if (literal) return `<span class="tok-literal">${literal}</span>`;
      return `<span class="tok-number">${token}</span>`;
    });
  }

  function updateEditor() {
    const lineCount = Math.max(1, source.value.split('\n').length);
    const gutter = $('#input-lines');
    if (gutter) gutter.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    const inputCode = $('#input-highlight');
    if (inputCode) inputCode.innerHTML = `${highlight(source.value)}${source.value.endsWith('\n') ? ' ' : ''}`;
    if (output.dataset.highlight === 'true') output.innerHTML = highlight(output.textContent || '');
    if (output.dataset.gutter) $('#output-lines').textContent = Array.from({ length: Math.max(1, (output.textContent || '').split('\n').length) }, (_, i) => i + 1).join('\n');
  }

  function parsed() {
    if (!source.value.trim()) { setMessage('Enter JSON or load an example first.', 'error'); return null; }
    const result = parse(source.value);
    if (!result.ok) throw new Error(`Invalid JSON: ${result.error}`);
    return result.value;
  }

  function show(value, kind = 'success') {
    output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    output.dataset.highlight = 'true';
    output.dataset.gutter = 'true';
    updateEditor();
    setMessage('Output is ready. Processing stayed in this browser tab.', kind);
  }

  function scalarYaml(value, indent) {
    if (value === null) return 'null';
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (value === '') return "''";
    if (/^(?:true|false|null|~|[-?:,[\]{}#&*!|>'"%@`])|(?:^\s|\s$)|:\s|\s#/.test(value) || /[\r\n]/.test(value)) return JSON.stringify(value);
    return value;
  }

  function toYaml(value, depth = 0) {
    const pad = '  '.repeat(depth);
    if (Array.isArray(value)) {
      if (!value.length) return `${pad}[]`;
      return value.map(item => {
        if (item && typeof item === 'object') return `${pad}-\n${toYaml(item, depth + 1)}`;
        return `${pad}- ${scalarYaml(item, depth)}`;
      }).join('\n');
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      if (!entries.length) return `${pad}{}`;
      return entries.map(([key, item]) => {
        const safeKey = /^[A-Za-z_][\w.-]*$/.test(key) ? key : JSON.stringify(key);
        if (item && typeof item === 'object' && (Array.isArray(item) ? item.length : Object.keys(item).length)) return `${pad}${safeKey}:\n${toYaml(item, depth + 1)}`;
        if (item && typeof item === 'object' && !Array.isArray(item)) return `${pad}${safeKey}: {}`;
        if (Array.isArray(item) && item.length === 0) return `${pad}${safeKey}: []`;
        return `${pad}${safeKey}: ${scalarYaml(item, depth)}`;
      }).join('\n');
    }
    return `${pad}${scalarYaml(value, depth)}`;
  }

  function csvEscape(value) {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function jsonToCsv(value, flatten = true) {
    if (!Array.isArray(value)) throw new Error('JSON to CSV expects a top-level array.');
    if (value.length === 0) return '';
    const rows = value.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return { value: item };
      const row = {};
      const visit = (object, prefix = '') => {
        for (const [key, child] of Object.entries(object)) {
          const path = prefix ? `${prefix}.${key}` : key;
          if (flatten && child && typeof child === 'object' && !Array.isArray(child)) visit(child, path);
          else row[path] = child;
        }
      };
      visit(item);
      return row;
    });
    const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
    if (!headers.length) return '';
    return [headers, ...rows.map(row => headers.map(key => Object.hasOwn(row, key) ? row[key] : ''))].map(line => line.map(csvEscape).join(',')).join('\r\n');
  }

  function csvParse(input) {
    const text = input.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false, closedQuote = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { quoted = false; closedQuote = true; }
        else field += ch;
      } else if (ch === '"') {
        if (field.length || closedQuote) throw new Error(`Unexpected quote at character ${i + 1}.`);
        quoted = true;
      } else if (ch === ',' || ch === '\n' || ch === '\r') {
        row.push(field); field = ''; closedQuote = false;
        if (ch !== ',') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          if (row.some(cell => cell !== '')) rows.push(row);
          row = [];
        }
      } else {
        if (closedQuote) throw new Error(`Unexpected character after a closing quote at character ${i + 1}.`);
        field += ch;
      }
    }
    if (quoted) throw new Error('The CSV ends inside a quoted field.');
    if (field !== '' || row.length) { row.push(field); if (row.some(cell => cell !== '')) rows.push(row); }
    if (!rows.length) return [];
    const used = new Map();
    const headers = rows[0].map((header, index) => {
      const base = header.trim() || `column_${index + 1}`;
      const count = (used.get(base) || 0) + 1; used.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    });
    return rows.slice(1).map(cells => Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ''])));
  }

  function deepDiff(left, right, path = '$', results = []) {
    if (Object.is(left, right)) return results;
    const objects = left && right && typeof left === 'object' && typeof right === 'object' && Array.isArray(left) === Array.isArray(right);
    if (!objects) { results.push({ path, before: left, after: right, change: 'changed' }); return results; }
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    for (const key of keys) {
      const childPath = Array.isArray(left) ? `${path}[${key}]` : `${path}.${key}`;
      if (!Object.hasOwn(left, key)) results.push({ path: childPath, after: right[key], change: 'added' });
      else if (!Object.hasOwn(right, key)) results.push({ path: childPath, before: left[key], change: 'removed' });
      else deepDiff(left[key], right[key], childPath, results);
    }
    return results;
  }

  function schemaErrors(value, schema, path = '$') {
    const issues = [];
    const types = { object: v => v !== null && typeof v === 'object' && !Array.isArray(v), array: Array.isArray, string: v => typeof v === 'string', number: v => typeof v === 'number' && Number.isFinite(v), integer: v => Number.isInteger(v), boolean: v => typeof v === 'boolean', null: v => v === null };
    if (schema.type) {
      const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!allowed.some(type => types[type]?.(value))) return [`${path}: expected ${allowed.join(' or ')}.`];
    }
    if (schema.const !== undefined && deepDiff(value, schema.const).length) issues.push(`${path}: does not match const.`);
    if (schema.enum && !schema.enum.some(item => deepDiff(item, value).length === 0)) issues.push(`${path}: value is not in enum.`);
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) issues.push(`${path}: is below minimum ${schema.minimum}.`);
      if (schema.maximum !== undefined && value > schema.maximum) issues.push(`${path}: is above maximum ${schema.maximum}.`);
    }
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) issues.push(`${path}: is shorter than minLength ${schema.minLength}.`);
      if (schema.maxLength !== undefined && value.length > schema.maxLength) issues.push(`${path}: is longer than maxLength ${schema.maxLength}.`);
      if (schema.pattern) { try { if (!new RegExp(schema.pattern).test(value)) issues.push(`${path}: does not match pattern.`); } catch { issues.push(`${path}: schema pattern is not a valid regular expression.`); } }
    }
    if (Array.isArray(value) && schema.items) value.forEach((item, index) => issues.push(...schemaErrors(item, schema.items, `${path}[${index}]`)));
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of schema.required || []) if (!Object.hasOwn(value, key)) issues.push(`${path}.${key}: is required.`);
      for (const [key, child] of Object.entries(value)) if (schema.properties?.[key]) issues.push(...schemaErrors(child, schema.properties[key], `${path}.${key}`));
    }
    return issues;
  }

  function inferSchema(value) {
    if (value === null) return { type: 'null' };
    if (Array.isArray(value)) return { type: 'array', items: value.length ? inferSchema(value[0]) : {} };
    if (typeof value === 'object') return { type: 'object', properties: Object.fromEntries(Object.entries(value).map(([key, child]) => [key, inferSchema(child)])), required: Object.keys(value) };
    return { type: typeof value };
  }

  function toType(value, name = 'Root') {
    const interfaces = [];
    const safeName = (text) => text.replace(/[^A-Za-z0-9_$]/g, '_').replace(/^(\d)/, '_$1') || 'Property';
    const typeOf = (item, interfaceName) => {
      if (item === null) return 'null';
      if (Array.isArray(item)) return item.length ? `(${[...new Set(item.map(child => typeOf(child, `${interfaceName}Item`)))].join(' | ')})[]` : 'unknown[]';
      if (typeof item === 'object') {
        const props = Object.entries(item).map(([key, child]) => `  ${/^[$A-Z_a-z][$\w]*$/.test(key) ? key : JSON.stringify(key)}: ${typeOf(child, `${interfaceName}${safeName(key)}`)};`).join('\n');
        interfaces.push(`interface ${interfaceName} {\n${props}\n}`);
        return interfaceName;
      }
      return typeof item;
    };
    const root = typeOf(value, safeName(name));
    return `${interfaces.join('\n\n')}${interfaces.length ? '\n\n' : ''}type JsonValue = ${root};`;
  }

  function xmlToObject(node) {
    const result = {};
    if (node.attributes?.length) result['@attributes'] = Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]));
    const childNodes = [...node.childNodes].filter(child => child.nodeType === Node.ELEMENT_NODE);
    const text = [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE).map(child => child.nodeValue.trim()).filter(Boolean).join(' ');
    for (const child of childNodes) {
      const value = xmlToObject(child);
      if (Object.hasOwn(result, child.nodeName)) result[child.nodeName] = Array.isArray(result[child.nodeName]) ? [...result[child.nodeName], value] : [result[child.nodeName], value];
      else result[child.nodeName] = value;
    }
    if (text) result['#text'] = text;
    return Object.keys(result).length ? result : text;
  }

  function renderTree(value, parent = tree, key = 'root') {
    const item = el('li', { class: 'tree-node' });
    const isContainer = value !== null && typeof value === 'object';
    const type = Array.isArray(value) ? `array · ${value.length}` : value === null ? 'null' : isContainer ? `object · ${Object.keys(value).length}` : typeof value;
    const label = el(isContainer ? 'button' : 'span', { class: 'tree-label', ...(isContainer ? { type: 'button', 'aria-expanded': 'true' } : {}) });
    label.append(el('strong', {}, key), el('span', { class: 'tree-type' }, type));
    if (!isContainer) label.append(el('code', {}, value === null ? 'null' : String(value)));
    item.append(label);
    if (isContainer) {
      const children = el('ul');
      const pairs = Array.isArray(value) ? value.map((child, index) => [String(index), child]) : Object.entries(value);
      for (const [childKey, childValue] of pairs) renderTree(childValue, children, childKey);
      item.append(children);
      label.addEventListener('click', () => { const collapsed = children.hidden = !children.hidden; label.setAttribute('aria-expanded', String(!collapsed)); });
    }
    parent.append(item);
    return item;
  }

  function syncScroll() {
    const pair = [['#json-input', '#input-highlight'], ['#json-output', '#output-highlight'], ['#json-input', '#input-lines'], ['#json-output', '#output-lines']];
    pair.forEach(([main, target]) => { const pane = $(main), mirror = $(target); pane?.addEventListener('scroll', () => { if (mirror) { mirror.scrollTop = pane.scrollTop; mirror.scrollLeft = pane.scrollLeft; } }); });
  }
  syncScroll();
  source.addEventListener('input', updateEditor);
  updateEditor();

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    try {
      if (action === 'clear') { source.value = ''; if ($('#json-second')) $('#json-second').value = ''; if (schemaBox) schemaBox.value = ''; output.textContent = ''; output.dataset.highlight = ''; output.dataset.gutter = ''; if (tree) tree.replaceChildren(); setMessage(''); updateEditor(); return; }
      if (action === 'example' || action === 'example-select') { const name = action === 'example-select' ? ($('#example-select')?.value || 'simple') : (button.dataset.example || 'simple'); source.value = JSON.stringify(examples[name] ?? examples.simple, null, 2); if (tree) { tree.replaceChildren(); if (mode === 'examples') renderTree(examples[name] ?? examples.simple); } updateEditor(); setMessage('Example loaded into the editor.'); return; }
      if (action === 'copy') { await navigator.clipboard.writeText(output.textContent || ''); setMessage('Output copied to the clipboard.', 'success'); return; }
      if (action === 'download') { const blob = new Blob([output.textContent || ''], { type: button.dataset.mime || 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = el('a', { href: url, download: button.dataset.filename || 'json-output.txt' }); document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Download prepared in your browser.', 'success'); return; }
      if (action === 'load-file') { fileTarget = button.dataset.target === 'second' ? $('#json-second') : source; $('#json-file').click(); return; }
      if (['format', 'minify', 'validate'].includes(action)) {
        const value = parsed(); if (value === null && source.value.trim() === '') return;
        show(action === 'minify' ? JSON.stringify(value) : JSON.stringify(value, null, 2));
        if (action === 'validate') setMessage('Valid JSON. A formatted copy is shown in the output panel.', 'success');
        return;
      }

      if (action === 'repair') {
        const original = source.value;
        const suggestion = trailingCommaSuggestion(original);
        const candidate = suggestion.candidate;
        if (!suggestion.removed) throw new Error('No conservative trailing-comma repair was found. Review the parser message and edit the original input directly.');
        const checked = parse(candidate);
        if (!checked.ok) throw new Error(`A trailing-comma suggestion did not produce valid JSON. Original input is unchanged. ${checked.error}`);
        show(candidate); setMessage('Suggested change: removed trailing commas before } or ]. Review the before and after text; the original input remains unchanged.', 'warning'); return;
      }
      if (action === 'comments') {
        const original = source.value;
        let result = '', inString = false, escaped = false;
        for (let i = 0; i < original.length; i++) {
          const ch = original[i], next = original[i + 1];
          if (inString) { result += ch; if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; continue; }
          if (ch === '"') { inString = true; result += ch; continue; }
          if (ch === '/' && next === '/') { result += '  '; i += 2; while (i < original.length && original[i] !== '\n' && original[i] !== '\r') { result += ' '; i++; } i--; continue; }
          if (ch === '/' && next === '*') { result += '  '; i += 2; let closed = false; while (i < original.length) { if (original[i] === '*' && original[i + 1] === '/') { result += '  '; i++; closed = true; break; } result += original[i] === '\n' || original[i] === '\r' ? original[i] : ' '; i++; } if (!closed) throw new Error('Found an unclosed block comment. Nothing was changed.'); continue; }
          result += ch;
        }
        const checked = parse(result);
        if (!checked.ok) throw new Error(`Comments were masked with spaces in the suggestion, but the result is still not valid JSON. Original input is unchanged. ${checked.error}`);
        show(result); setMessage('Comment text was replaced with spaces, preserving line breaks. Review the suggestion; original input is unchanged.', 'warning'); return;
      }

      if (action === 'validate-schema') {
        const value = parsed(); if (value === null && source.value.trim() === '') return;
        const schemaResult = parse(schemaBox?.value || '');
        if (!schemaResult.ok || !schemaResult.value || typeof schemaResult.value !== 'object' || Array.isArray(schemaResult.value)) throw new Error(`Schema must be a JSON object. ${schemaResult.error || ''}`);
        const issues = schemaErrors(value, schemaResult.value);
        show(issues.length ? issues.map(issue => `• ${issue}`).join('\n') : 'Valid against the supported subset (types, properties, required, items, enum, const, numeric/string bounds, and pattern).', issues.length ? 'warning' : 'success');
        setMessage(issues.length ? `${issues.length} issue${issues.length === 1 ? '' : 's'} found. Unsupported keywords are ignored; this is not a full JSON Schema implementation.` : 'No issues found in the supported subset. Unsupported JSON Schema keywords are ignored.', issues.length ? 'warning' : 'success'); return;
      }

      if (action === 'generate-schema') { const value = parsed(); if (value === null && source.value.trim() === '') return; show({ $schema: 'https://json-schema.org/draft/2020-12/schema', ...inferSchema(value) }); setMessage('Inferred from this sample only. All observed object fields are marked required; review optional fields and array variants before using the schema.', 'warning'); return; }
      if (action === 'generate') {
        const count = Math.min(50, Math.max(1, Number($('#generate-count')?.value || 3)));
        if (mode === 'generate') {
          const fields = (source.value || 'name:string\nactive:boolean\ncount:number').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => { const [name, type = 'string'] = line.split(':'); const field = name.trim(); if (!field || !/^[A-Za-z_$][\w$]*$/.test(field)) throw new Error(`Invalid field name: ${field}`); const value = ({ string: '', number: 0, boolean: false, null: null, array: [], object: {} })[type.trim()]; if (value === undefined) throw new Error(`Unsupported field type: ${type}`); return [field, value]; });
          show(Object.fromEntries(fields)); setMessage('Generated from the field:type list. Edit the values to suit your example.', 'success'); return;
        }
        const samples = Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Sample ${index + 1}`, email: `person${index + 1}@example.test`, active: index % 2 === 0 }));
        show(samples); return;
      }

      if (action === 'jsonld') {
        const value = parsed(); if (value === null && source.value.trim() === '') return;
        const nodes = Array.isArray(value) ? value : [value];
        const issues = nodes.flatMap((node, index) => { const prefix = nodes.length > 1 ? `$[${index}]` : '$'; if (!node || typeof node !== 'object' || Array.isArray(node)) return [`${prefix}: expected an object.`]; const errors = []; if (!Object.hasOwn(node, '@context')) errors.push(`${prefix}.@context: missing context.`); if (!Object.hasOwn(node, '@type')) errors.push(`${prefix}.@type: missing type.`); if (node['@context'] && typeof node['@context'] !== 'string' && typeof node['@context'] !== 'object') errors.push(`${prefix}.@context: should be a string or object.`); return errors; });
        tree?.replaceChildren(); if (tree) renderTree(value);
        show(JSON.stringify({ items: nodes.length, issues, preview: nodes.map(node => node && typeof node === 'object' ? { '@type': node['@type'] ?? null, name: node.name ?? null, headline: node.headline ?? null, url: node.url ?? null } : node) }, null, 2), issues.length ? 'warning' : 'success');
        setMessage(issues.length ? `Found ${issues.length} common structural issue(s). This parser does not validate Google rich-result eligibility or every Schema.org property.` : 'JSON-LD parsed and common fields inspected. This does not validate Google rich-result eligibility or all Schema.org rules.', issues.length ? 'warning' : 'success'); return;
      }

      if (action === 'run') {
        if (['csv-json'].includes(mode)) { show(csvParse(source.value)); return; }
        if (mode === 'xml') { if (/<!DOCTYPE/i.test(source.value)) throw new Error('DOCTYPE declarations are not accepted by this browser-side converter.'); const doc = new DOMParser().parseFromString(source.value, 'application/xml'); const err = doc.querySelector('parsererror'); if (err) throw new Error(`XML parse error: ${err.textContent.trim()}`); show({ [doc.documentElement.nodeName]: xmlToObject(doc.documentElement) }); return; }
        if (mode === 'escape') { show(escapeText(source.value)); return; }
        if (mode === 'unescape') { show(unescapeText(source.value)); return; }
        if (mode === 'parse-string') { const outer = parse(source.value); if (!outer.ok) throw new Error(outer.error); if (typeof outer.value !== 'string') throw new Error('Input must first parse to a JSON string.'); const inner = parse(outer.value); if (!inner.ok) throw new Error(`The string was decoded, but its contents are not JSON: ${inner.error}`); show(inner.value); return; }
        if (mode === 'stringify') { const value = parsed(); if (value === null && source.value.trim() === '') return; show(JSON.stringify(value, null, $('#compact')?.checked ? 0 : 2)); return; }
        if (mode === 'json-csv' || mode === 'json-array-csv' || mode === 'nested-csv') { const value = parsed(); if (value === null && source.value.trim() === '') return; const csv = jsonToCsv(value, mode !== 'json-csv' || ($('#flatten-objects')?.checked ?? true)); show(csv); output.dataset.mime = 'text/csv;charset=utf-8'; return; }
        if (mode === 'yaml') { const value = parsed(); if (value === null && source.value.trim() === '') return; show(toYaml(value)); return; }
        if (mode === 'typescript') { const value = parsed(); if (value === null && source.value.trim() === '') return; show(toType(value)); output.dataset.mime = 'text/plain;charset=utf-8'; return; }
        if (mode === 'jsonl-json') { const lines = source.value.split(/\r?\n/).map((line, index) => ({ line, number: index + 1 })).filter(item => item.line.trim()); if (!lines.length) throw new Error('Enter one JSON value per line.'); const values = lines.map(item => { const result = parse(item.line); if (!result.ok) throw new Error(`Line ${item.number}: ${result.error}`); return result.value; }); show(values); return; }
        if (mode === 'json-jsonl') { const value = parsed(); if (value === null && source.value.trim() === '') return; if (!Array.isArray(value)) throw new Error('JSON to JSONL expects a top-level array.'); show(value.map(item => JSON.stringify(item)).join('\n')); output.dataset.mime = 'application/x-ndjson;charset=utf-8'; return; }
        if (mode === 'compare') {
          const left = parse($('#json-input')?.value || ''), right = parse($('#json-second')?.value || '');
          if (!left.ok) throw new Error(`Left JSON is invalid: ${left.error}`); if (!right.ok) throw new Error(`Right JSON is invalid: ${right.error}`);
          const differences = deepDiff(left.value, right.value);
          show(differences.length ? differences.map(item => `${item.change.toUpperCase()} ${item.path}: ${item.change === 'added' ? JSON.stringify(item.after) : item.change === 'removed' ? JSON.stringify(item.before) : `${JSON.stringify(item.before)} → ${JSON.stringify(item.after)}`}`).join('\n') : 'The JSON values are equal. Object key order is ignored.'); return;
        }
        if (mode === 'tree' || mode === 'examples') { const value = parsed(); if (value === null && source.value.trim() === '') return; tree?.replaceChildren(); if (tree) renderTree(value); show({ rootType: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value, topLevelKeys: value && typeof value === 'object' ? Object.keys(value).length : 0 }); return; }
        const value = parsed(); if (value === null && source.value.trim() === '') return;
        if (mode === 'minify') show(JSON.stringify(value));
        else show(value);
      }
    } catch (error) { setMessage(error.message || 'The input could not be processed.', 'error'); }
  });

  const file = $('#json-file');
  file?.addEventListener('change', async () => { const selected = file.files?.[0]; if (!selected) return; try { fileTarget.value = await selected.text(); if (fileTarget === source) updateEditor(); setMessage(`Loaded ${selected.name} locally.`, 'success'); } catch { setMessage('The selected file could not be read.', 'error'); } file.value = ''; });

  if (typeof globalThis.__JSON_TOOLS_TEST_HOOK__ === 'function') globalThis.__JSON_TOOLS_TEST_HOOK__({ parse, csvParse, jsonToCsv, deepDiff, schemaErrors, inferSchema, toYaml, toType, escapeText, unescapeText, trailingCommaSuggestion });

  const search = $('#tool-search');
  search?.addEventListener('input', () => { const term = search.value.trim().toLowerCase(); document.querySelectorAll('[data-searchable]').forEach(card => { card.hidden = Boolean(term) && !card.textContent.toLowerCase().includes(term); }); });
  const dropZone = $('.editor-wrap');
  dropZone?.addEventListener('dragover', event => { event.preventDefault(); dropZone.classList.add('is-dragging'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('is-dragging'));
  dropZone?.addEventListener('drop', async event => { event.preventDefault(); dropZone.classList.remove('is-dragging'); const dropped = event.dataTransfer?.files?.[0]; if (!dropped) return; try { source.value = await dropped.text(); updateEditor(); setMessage(`Loaded ${dropped.name} locally.`, 'success'); } catch { setMessage('The dropped file could not be read.', 'error'); } });
})();
