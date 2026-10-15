---
title: "JSON Validator Guide: How to Find and Fix Syntax Errors"
description: "A practical method for locating JSON syntax errors, understanding parser messages, and correcting malformed data without losing content."
primaryKeyword: "json validator"
secondaryKeywords: ["json checker", "json syntax", "json fixer", "json formatter and validator"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["validator", "formatter-validator", "fixer", "parser"]
relatedArticles: ["json-formatter-guide", "json-parser-guide", "json-comments"]
---

A JSON validator answers a narrow but useful question: can a standards-compliant parser read this text as a JSON value? It does not decide whether the value matches your application's schema, whether a URL is reachable, or whether a quantity makes business sense. If the parser rejects the text, use its first error as a starting point, check the surrounding punctuation, make a deliberate edit, and validate again. Avoid replacing the entire document when a small syntax correction is enough.

## What valid JSON looks like

JSON accepts an object, an array, a string, a number, true, false, or null as a top-level value. Objects contain quoted property names, colons, and values separated by commas. Arrays contain values separated by commas. Strings and property names use double quotes. A simple object is:

    {
      "name": "Ada Lovelace",
      "active": true,
      "roles": ["author", "mathematician"],
      "manager": null
    }

JSON is not exactly the same as JavaScript syntax. JavaScript allows conveniences such as unquoted property names, single-quoted strings, comments, and trailing commas in object literals. JSON does not. These features must be removed or transformed before a standard JSON parser will accept the document.

The [JSON Validator](../../../tools/json/validator/) on this site uses the browser's parser, so it checks syntax without uploading the input to a conversion service. The [JSON Formatter and Validator](../../../tools/json/formatter-validator/) displays a formatted result only after parsing succeeds. Validation does not run code from the input; JSON is parsed as data.

## Read the first error carefully

Parser messages vary by browser and programming language. Some include a character position; others describe an unexpected token or end of input. A position usually points to the character where the parser could no longer continue, not necessarily to the first incorrect character. For example, if a comma is missing between two properties, the parser may complain when it reaches the second property name.

Use a small inspection window:

1. Go to the reported line and column if the tool provides them.
2. Look at the current character and the few characters before it.
3. Check whether the previous value ended correctly and whether a comma or closing delimiter is missing.
4. Count the matching braces or brackets around the nearby structure.
5. Fix one likely cause, then validate again.

A trailing quote or a missing closing quote can cause an error much farther down than the actual mistake. When a parser says unexpected end, check for an unclosed string, object, array, or escape sequence near the end. When it reports an unexpected comma, inspect whether a preceding value is missing or whether the comma is trailing.

## Frequent syntax problems

### Single quotes or unquoted keys

This is JavaScript-like syntax, not JSON: { name: 'Ada' }. Write both the property and its string value with double quotes: { "name": "Ada" }.

### Trailing commas

A trailing comma after the last item is rejected by standard JSON parsers. The array ["red", "green",] should be written as ["red", "green"]. Remove only the trailing punctuation; do not remove separators between actual items.

### Comments

JSON has no comment syntax. A line comment or block comment is not a standard JSON token. If you need human notes, put them in a documented property such as "_comment" only when the receiving application allows it, or keep commentary in a separate README. The [Comments Helper](../../../tools/json/comments-helper/) can preview a comment-free suggestion while preserving line breaks, but you must review the result.

### Missing commas and colons

Every object property needs a colon between its name and value. Adjacent properties need a comma. Every adjacent array item also needs a comma. Do not put commas between a property name and its colon or after the final item. Inspect the value immediately before an error because the parser often notices a missing separator when it reaches the next token.

### Invalid values

Undefined, NaN, and Infinity are JavaScript values, not JSON values. Decide how the consumer should represent them. A missing property is different from a property set to null; a string such as "NaN" is different from a number. Do not convert these mechanically without checking the receiving contract.

### Escapes and control characters

Inside a JSON string, a quote must be escaped, a backslash must be escaped, and a newline is represented with the two-character escape sequence backslash-n. Literal control characters cannot appear unescaped inside a string. A copied string may contain smart quotation marks that look similar to ASCII quotes but are different Unicode characters. If the parser's token does not match the visible punctuation, inspect the source code points or paste the value into a plain-text editor.

## Repair without discarding information

Do not use a regular expression to fix any JSON. JSON strings can contain braces, commas, colons, and words that resemble syntax. A broad search-and-replace can change a legitimate string or remove data. Make narrow changes and preserve the original until the repaired value passes both syntax validation and a comparison with the source.

This site's [JSON Fixer](../../../tools/json/fixer/) offers one conservative suggestion: remove a trailing comma before a closing brace or bracket, then confirm that the result parses. It leaves the original input visible and reports what changed. It does not attempt to guess missing quotes, create values, recover truncated text, or repair every dialect of JSON-like data. When a suggested result fails to parse, stop and use the error to edit the source manually.

For high-value documents, save a copy first. After a repair, inspect a diff or compare the parsed values. In particular, check large arrays, repeated fields, Unicode strings, and numeric identifiers. A successful parse means the syntax is acceptable; it does not prove that every original field remains correct.

## Syntax validation versus schema validation

The document {"age":"old"} is valid JSON. If the application requires age to be a nonnegative integer, syntax validation alone cannot catch that mismatch. A JSON Schema can describe types, required fields, and other constraints. Use the [JSON Schema Validator](../../../tools/json/schema-validator/) for its documented subset, and check its limitations before relying on it for production data.

Application-level rules may go further. A schema might permit a date-shaped string that does not exist on a calendar, or a schema can describe a field as text while the business process requires a known customer identifier. Domain validation belongs in the application that owns the rules. Treat the checks as layers: parsing establishes valid JSON syntax, schema validation checks a declared shape, and application validation checks business meaning.

## Validate a file or API response

When a local JSON file fails validation, confirm that the file is complete and that you opened the intended export. Some applications wrap JSON in a log prefix or code fence; remove that surrounding text only if it is not part of the data. A JSON Lines file is different: it contains one JSON value per line rather than one top-level JSON array. Use a JSONL-aware tool for that format.

For an API response, copy the response body rather than the whole HTTP transcript. A status line, header block, or proxy error page is not JSON. Also inspect the Content-Type header when available. application/json indicates JSON content, but a header alone does not prove the body is valid. Test the exact bytes after any decompression or character decoding performed by your client.

Large files can take substantial memory in a browser because parsing creates an in-memory object and formatted output requires another string. If a file is too large for a tab, use a streaming parser or process records incrementally in a trusted local environment. The [large JSON guide](large-json-files/) covers chunking and format choices.

## A repeatable debugging example

Suppose this payload fails: {"name":"Ada" "active":true}. The parser reaches the second property without seeing a separator. Insert the missing comma after the Ada value, then validate: {"name":"Ada", "active":true}.

If the parser next reports a missing closing brace, add one only after verifying the object structure. A parser is useful as an iterative guide, but each edit should have a reason. Do not add punctuation until the output parses and the structure matches what the producer intended.

## Conclusion

Validate early and use parser locations to narrow the search, while remembering that the first reported character may be where the parser noticed a problem rather than where it began. Correct strict JSON syntax deliberately, review repairs against the original, and use schema or application checks for rules beyond syntax. A green parse result is the start of correctness, not the end.

