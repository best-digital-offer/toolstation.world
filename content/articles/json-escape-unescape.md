---
title: "How to Escape and Unescape JSON Strings"
description: "Understand JSON string escaping, parse and serialize safely, and avoid common Unicode, quote, and backslash errors."
primaryKeyword: "JSON escape and unescape"
secondaryKeywords: ["escape JSON string", "unescape JSON", "JSON backslash"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["escape", "unescape", "parser"]
relatedArticles: ["json-stringify", "json-parser-guide", "json-comments"]
---

Escaping is the process of representing characters that have special meaning inside a JSON string. A quote ends a string, a backslash begins an escape sequence, and control characters cannot appear literally. Use a JSON serializer for a value and a JSON parser for serialized text; do not add or remove backslashes by guessing. The [JSON Escape tool](../../../tools/json/escape/) and [JSON Unescape tool](../../../tools/json/unescape/) work in the browser, but the output still needs context-aware handling.

## What the backslash means in JSON

JSON strings are delimited by double quotation marks. If a value itself contains a quote, that quote must be represented as `\"` in the JSON text. A literal backslash is encoded as `\\`. The required escapes also include backspace, form feed, newline, carriage return, and tab. Other control characters are written with a Unicode escape such as `\u0001`.

The text representation can look different from the value it represents. In the JSON text `{"message":"Line one\\nLine two"}`, the characters backslash and n inside the JSON string represent a newline in the decoded value. If you inspect the text in an editor, you see two characters. After parsing, the resulting string contains a line break. This distinction explains many apparent double-escaping problems.

Not every non-ASCII character must be escaped. Unicode characters can appear directly in JSON text when the transport and file encoding support them. A serializer may choose to emit `é` directly or represent it with a Unicode escape. Both forms can decode to the same value. Escaping is a syntax requirement for certain characters, not a command to convert all readable text into numeric codes.

## Serialize values instead of concatenating strings

In JavaScript, `JSON.stringify` takes responsibility for quoting and escaping a string value. For example:

    const value = 'She said "hello"\\world';
    const jsonText = JSON.stringify(value);
    // "She said \\"hello\\"\\\\world"

The result is valid JSON text representing a string. If the intended output is an object, serialize the object rather than wrapping the already serialized string in another pair of quotes. `JSON.stringify({ message: value })` produces an object whose `message` property holds the original value.

Concatenation is fragile because it makes the programmer reproduce every syntax rule. A quote within a name, a newline in user input, or a backslash from a Windows path can break the output. The failure may not happen in a short test value, which makes manual concatenation especially hard to trust. Use a serializer provided by the language and parse the finished text in tests.

Serialization is not the same as HTML escaping, URL encoding, or shell escaping. A JSON string embedded in an HTML page still has to be placed in an HTML-safe context. A JSON string passed in a URL needs URL encoding. A string passed to a shell may need shell-specific quoting. Escaping for one grammar does not automatically make data safe for another grammar.

## Parse exactly one layer

`JSON.parse` decodes one JSON document. If the document contains a JSON string, the first parse returns a JavaScript string. A second parse is only correct if that string itself contains another complete JSON document. For example, a web API may return a JSON-encoded string by mistake or by design; in that case inspect the first result and decide whether another parse matches the documented data shape.

Repeatedly parsing until the value stops being a string is dangerous. Legitimate data may intentionally be a string, such as a product code that happens to contain braces. Automatic repeated parsing can change its type unexpectedly. Instead, define the expected number of encoding layers at the boundary and reject values that do not match that contract.

When debugging, inspect both the raw text and the parsed value. Log a short, sanitized representation during development, and avoid logging secrets in production. If a value appears with extra backslashes, determine whether you are looking at the source code literal, JSON text, a debugger's display format, or the decoded runtime string. Those views have different escaping rules.

## Common failure patterns

An “unexpected token” error near a quote often means an embedded quote was not escaped or a string ended too early. An “unterminated string” error can result from a trailing backslash because it escapes the closing quote. A value containing a literal newline pasted between its quotation marks is invalid JSON; represent the line break as `\\n` in the JSON text or serialize it.

Windows paths are a classic example. The JSON text `{"path":"C:\\temp\\report.json"}` represents a path with backslashes. Writing `C:\temp` carelessly may create a tab because `\t` is a JSON escape. A serializer avoids this issue. When a language has its own string literal syntax, remember there can be two parsing stages: the programming language first interprets the source literal, then a JSON parser interprets the resulting characters.

Do not blindly replace every backslash with two backslashes. That can fix a path in one context, but corrupt a value that already contains an intentional escape sequence. Likewise, replacing every quote with a backslash-quote can create invalid outer JSON. The correct transformation depends on whether you have a runtime value, JSON document, or JSON document embedded inside another syntax.

## Unicode and surrogate pairs

Unicode escapes use four hexadecimal digits after `\\u`. Characters outside the Basic Multilingual Plane may be represented by a pair of UTF-16 surrogate escapes in JSON text. A correct JSON parser combines that pair into one Unicode code point in the runtime string. Most modern serializers handle this automatically; hand-built escapes can accidentally create an unpaired surrogate that other systems reject or display inconsistently.

For user-facing text, preserve the original Unicode unless a downstream protocol specifically requires another representation. Test emoji, accented letters, non-Latin scripts, and combining marks when converting data between tools. Two strings that look identical may have different Unicode normalization forms. JSON parsing does not generally normalize them, so normalization should be an explicit application decision rather than a surprise side effect of escaping.

## Safe workflow for escaping and unescaping

First identify the input type: raw value, JSON text, or a string containing JSON text. Parse JSON text once to check syntax. If you need JSON output, serialize the runtime value. Then parse the generated output in a test and compare the parsed value with the original. This round-trip verifies meaning, not merely visual appearance.

The tool can help inspect an encoding layer, but it cannot know whether a downstream consumer expects HTML, a URL, a JavaScript source literal, or plain JSON. Keep the destination format explicit. Never evaluate untrusted text as code to “unescape” it. A parser should produce data, and a renderer should display that data as text rather than executable markup.

## Conclusion

Use `JSON.stringify` to encode values and `JSON.parse` to decode JSON text. Count encoding layers, keep JSON escaping separate from other output contexts, and test round trips with quotes, backslashes, control characters, and Unicode. When an output looks over-escaped, inspect the actual value before removing characters; a displayed representation can contain extra notation that is not part of the data itself.

