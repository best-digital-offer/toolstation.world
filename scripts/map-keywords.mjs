import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'planning', 'keyword-research.csv');
const outputPath = path.join(root, 'planning', 'keyword-map.json');

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); }
  const [headers, ...records] = rows;
  return records.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

const topics = [
  ['conversion-code', /\b(python|javascript|java script|powershell|convertfrom-json|c#|ruby|pandas|pandas|node js|golang|\br\b|curl|jq|aws glue|aws lambda|logic app|nifi|shell script|cli|newtonsoft|converter java|script to convert)\b/i, 'How to Convert JSON to CSV in Python, JavaScript and PowerShell', '/blog/json/convert-json-to-csv-code.html'],
  ['nested-csv', /nested|flatten|flat json|multiple files|large json|trello json|bulk convert/i, 'How to Convert Nested JSON to CSV Without Losing Important Data', '/blog/json/nested-json-to-csv.html'],
  ['csv-to-json', /csv to json|json from csv|csv file into json|parse csv to json|csv offline|csv converter download/i, 'How to Convert CSV to JSON Correctly', '/blog/json/csv-to-json.html'],
  ['json-to-csv', /json.*csv|csv.*json|import json to csv|store json data in csv/i, 'How to Convert JSON to CSV Online', '/blog/json/json-to-csv.html'],
  ['schema-generator', /schema generator|generate.*schema/i, 'How to Generate a JSON Schema From Sample Data', '/blog/json/generate-json-schema.html'],
  ['schema', /schema validator|json schema/i, 'JSON Schema Validation: A Practical Guide', '/blog/json/json-schema-validation.html'],
  ['jsonld', /json-ld|json ld/i, 'JSON-LD Explained: Structure, Validation and Common Errors', '/blog/json/json-ld-guide.html'],
  ['yaml', /yaml/i, 'JSON vs. YAML: Which Format Should You Use?', '/blog/json/json-vs-yaml.html'],
  ['xml', /xml to json/i, 'How to Convert XML to JSON', '/blog/json/xml-to-json.html'],
  ['typescript', /typescript/i, 'How to Convert JSON to TypeScript Interfaces', '/blog/json/json-to-typescript.html'],
  ['compare', /compare|comparison|diff/i, 'How to Compare Two JSON Files and Understand the Differences', '/blog/json/compare-json.html'],
  ['string', /stringify|string to json|json to string|escape|unescape|json loads|json dumps/i, 'JSON Stringify Explained With Examples', '/blog/json/json-stringify.html'],
  ['comments', /comments/i, 'How to Handle Comments in JSON Files', '/blog/json/json-comments.html'],
  ['visualize', /visualizer|tree viewer|structure explorer/i, 'How to Visualize Nested JSON With a Tree Viewer', '/blog/json/json-tree-viewer.html'],
  ['generator', /generator|dummy json|creator/i, 'How to Create a JSON File From Scratch', '/blog/json/create-json-file.html'],
  ['file', /file reader|file to csv|file handling|blob/i, 'How to Work With Large JSON Files Safely', '/blog/json/large-json-files.html'],
  ['formatter', /formatter|beautifier|pretty print|json pretty|best json formatter/i, 'JSON Formatter Online: How to Format and Beautify JSON Correctly', '/blog/json/json-formatter-guide.html'],
  ['validator', /validator|checker|syntax|fixer|json crack/i, 'JSON Validator Guide: How to Find and Fix Syntax Errors', '/blog/json/json-validator-guide.html'],
  ['parser', /parser|parse json|application\/json|json data|json format|json meaning|json full form|json boolean|json array|json structure|what is json/i, 'JSON Parser Explained: Common Errors and Practical Examples', '/blog/json/json-parser-guide.html'],
  ['json-basics', /\b(json|json api|json-rpc|return json)\b/i, 'JSON Arrays and Objects: Structure, Differences and Examples', '/blog/json/json-arrays-objects.html'],
];

const exclusions = [
  [/^npm$|^npm json$|^json server npm$/i, 'Generic package-manager query without a clear JSON tool destination.'],
  [/^newtonsoft json$/i, 'Navigational query for a specific third-party library.'],
  [/^json library$/i, 'Broad library query without a clear browser-tool intent.'],
];

const records = parseCsv(fs.readFileSync(sourcePath, 'utf8'));
const seen = new Map();
const mapped = records.map((record, index) => {
  const keyword = record.Keyword.trim();
  const duplicateOf = seen.get(keyword.toLowerCase()) ?? null;
  if (duplicateOf === null) seen.set(keyword.toLowerCase(), index + 1);
  const excluded = exclusions.find(([pattern]) => pattern.test(keyword));
  const topic = topics.find(([, pattern]) => pattern.test(keyword));
  return {
    sourceRow: index + 2,
    ...record,
    normalizedKeyword: keyword.toLowerCase(),
    duplicateOfSourceRow: duplicateOf,
    decision: excluded ? 'exclude' : topic ? 'map' : 'review',
    reason: excluded?.[1] ?? (topic ? 'Relevant informational or tool-intent query.' : 'Needs manual review before assigning a public destination.'),
    cluster: excluded ? 'deprioritized' : topic?.[0] ?? 'unmapped',
    destination: excluded ? null : topic?.[3] ?? null,
  };
});

if (records.length !== 149) throw new Error(`Expected 149 data rows; found ${records.length}.`);
if (records.some(row => row.Keyword == null)) throw new Error('Keyword column is missing from one or more CSV rows.');

const summary = Object.fromEntries([...new Set(mapped.map(row => row.cluster))].sort().map(cluster => [cluster, mapped.filter(row => row.cluster === cluster).length]));
fs.writeFileSync(outputPath, `${JSON.stringify({ source: 'keyword-research.csv', sourceRows: records.length, metricCaveat: 'Source geography, date, provider, Competition definition, and Score methodology are unknown. Metrics are preserved as supplied and are not published on the site.', summary, keywords: mapped }, null, 2)}\n`);
console.log(JSON.stringify({ rows: records.length, duplicates: mapped.filter(row => row.duplicateOfSourceRow !== null).length, summary, review: mapped.filter(row => row.decision === 'review').map(row => row.Keyword) }, null, 2));
