---
title: "JSON Parser Explained: Common Errors and Practical Examples"
description: "Learn what a JSON parser does, how it interprets values, how to debug parse errors, and where parser round trips can lose information."
primaryKeyword: "json parser"
secondaryKeywords: ["json syntax", "json loads", "json dumps", "convert string to json", "json parser to csv"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["parser", "validator", "string-to-object", "formatter"]
relatedArticles: ["json-validator-guide", "json-stringify", "json-arrays-objects"]
---

A JSON parser reads JSON text and turns it into values that a program can inspect, such as objects, arrays, strings, numbers, booleans, and null. Parsing checks whether the text follows JSON syntax. It does not automatically verify that a field is useful, that a date is real, or that a value fits an application's schema. A parser error is a syntax signal; use schema and business checks for the other questions.

## From text to a value

JSON is a language-independent data format. A parser recognizes punctuation and values, then builds an in-memory representation. For example, the text:

    {"name":"Mira","scores":[7,9],"active":true}

becomes an object with three properties: name is a string, scores is an array of two numbers, and active is a boolean. The braces, quotes, commas, and whitespace are part of the source syntax. After parsing, a program works with the represented values rather than those exact characters.

This distinction matters because different text can parse to equivalent values. Indentation can change without changing the value. Object property order may not matter for an application's logic, while array order usually does. A parser can discard presentation details, so retain the original text if exact bytes or a signature matter.

The [JSON Parser](../../../tools/json/parser/) page parses a pasted value and shows the result. Use the [JSON Validator](../../../tools/json/validator/) when you only need to check syntax. The [String to Object Parser](../../../tools/json/string-to-object/) first parses a JSON string and then attempts to parse the string's contents as JSON; that extra step is needed only when JSON text has been encoded inside another JSON string.

## Syntax errors and error positions

Parsers stop when the next token cannot continue a valid JSON document. Common causes include an unquoted property name, a single-quoted string, a missing comma, a missing closing delimiter, an invalid escape, a comment, or a trailing comma. JavaScript object literal syntax resembles JSON, but the two are not interchangeable.

A location in an error message usually points to where the parser recognized that something was impossible. If a separator is missing between two properties, the parser may report the second property rather than the missing comma. If a string never closes, the reported position may be at the end of the file. Inspect the surrounding few characters and the previous token, then correct one likely problem at a time.

Copying can introduce unexpected characters. A word processor may replace straight quotation marks with curly ones. A newline pasted inside a quoted string may be a literal control character rather than the escape sequence backslash-n. When the visible character looks valid but the parse still fails, inspect the plain text or code points.

Comments and trailing commas deserve special treatment. Some languages or libraries accept JSON-like extensions, but strict JSON parsers reject them. If a producer emits comments, learn its exact dialect and convert intentionally. Do not assume that data accepted in one runtime is portable JSON.

## Parsing versus validation

Syntax validation asks if the parser can read the document. A schema can add constraints such as required fields, allowed types, numeric bounds, and enumerated values. Application validation can check rules that are outside the schema, such as whether an account exists or whether two fields are consistent.

For example, {"age":"old"} parses as valid JSON because a string is allowed as a value. It may fail an application schema that requires age to be an integer. A payload can pass a schema and still contain a postal code that does not exist. Use the layer appropriate to the question and report its result accurately.

This site's [Schema Validator](../../../tools/json/schema-validator/) supports a documented subset of common assertions. It does not implement every vocabulary or resolve arbitrary references. A generic parser is not a full JSON Schema validator; do not use “valid JSON” and “valid against this schema” as synonyms.

## Parsing JSON from an API or file

When a response is expected to contain JSON, parse the response body, not the request line, status, headers, or a command-line prompt. An HTTP 200 status does not guarantee valid JSON. An error page may be returned with an HTML body, and a proxy can prepend diagnostic text. Check the content type and inspect the actual response bytes.

File extensions are hints, not proof of format. A .json file usually contains one top-level JSON value. JSON Lines (often .jsonl or .ndjson) is a sequence of separate values, one per line. It is not one JSON array unless someone wraps it. A normal parser will reject multiple top-level values concatenated together. Use a JSONL parser or a conversion step that preserves record boundaries.

A UTF-8 byte-order mark or invalid character encoding can also affect parsing depending on the host API. Decode file bytes according to their encoding before parsing. If data comes from a network, handle decompression and character decoding before passing text to a JSON parser.

## Values can be lost in a round trip

Parsing and then serializing a value is convenient, but it may not preserve every source detail. Duplicate property names are risky because parsers can keep only one occurrence or behave differently. Avoid duplicates and validate with the consumer that will actually read the data.

Numbers also have implementation limits. JavaScript uses a binary floating-point Number type, which cannot exactly represent every very large integer or decimal fraction. A large identifier can be rounded even though the input text was valid. If digits must remain exact, use a parser that preserves numeric tokens or represent the identifier as a string. For exact decimal arithmetic, use an appropriate decimal type in the application.

The parse result generally does not preserve whitespace, comments, or the original number spelling. If a system needs a lossless edit, use a concrete syntax tree or a text-preserving tool instead of rebuilding the whole document from generic objects. If the task is just formatting ordinary data, a parse/serialize cycle is usually practical after reviewing known edge cases.

## Avoid treating parsed values as executable code

JSON is data, not a programming language. Do not evaluate its text as JavaScript. Use a JSON parser and render user-provided strings as text. When showing values in a web interface, assign them through textContent or another safe text API instead of injecting untrusted text as HTML.

Parsing can still consume memory and time. A deeply nested or huge document may be expensive for a browser tab. Untrusted large inputs may require size limits and robust processing. If a file is very large, use a streaming or incremental parser in a trusted environment. Do not treat a successful parse as proof that the data is safe for every downstream use.

## A practical parser workflow

1. Confirm that the source is meant to be one JSON document and not JSON Lines or a code snippet.
2. Isolate the actual response body or file content.
3. Parse and read the first error location with surrounding context.
4. Correct strict syntax deliberately and keep a copy of the original.
5. Validate the parsed structure against the expected schema.
6. Check numeric precision, duplicate keys, file size, and downstream assumptions.

For production code, catch parser exceptions and report useful context without logging sensitive input. A line and column can help, but avoid storing full user data in telemetry. For command-line tasks, use a standard library parser and test how it handles duplicate keys, large numbers, and multiple values.

## Conclusion

A JSON parser translates strict text syntax into program values. It is the first step for formatters, validators, converters, and applications, but it cannot judge domain meaning. Understand its error locations, distinguish JSON from JSON-like dialects, and account for precision or duplicate-key behavior when parsing and serializing data.

