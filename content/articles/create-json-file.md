---
title: "How to Create a JSON File From Scratch"
description: "Create a valid JSON file step by step, choose an appropriate structure, validate it, and avoid mistakes when saving or sharing data."
primaryKeyword: "create JSON file"
secondaryKeywords: ["make a JSON file", "JSON file format", "valid JSON example"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["editor", "formatter", "validator"]
relatedArticles: ["json-arrays-objects", "json-validator-guide", "json-formatter-guide"]
---

To create a JSON file, decide what information it represents, write it using JSON's objects, arrays, strings, numbers, booleans, and null, then parse it with a real JSON parser before saving. Start with a small, representative example and expand it only after the structure is clear. The [JSON Editor](../../../tools/json/editor/) provides a browser-side place to draft data, and the [JSON Validator](../../../tools/json/validator/) checks syntax before you download or use the file.

## Plan the shape before typing

First identify whether the file represents one record or a collection. One record often uses an object at the top level; a collection often uses an array. Configuration files commonly use an object with named settings. A set of repeated records may use an array of objects, each with the same documented fields. Select a structure based on the consuming program's expected format rather than on visual preference.

Write down which values are required, which are optional, and what types they have. A field such as `enabled` should usually be a boolean rather than the text string `"true"`. A quantity is usually a number, while an identifier with leading zeroes may need to be a string. Dates are strings in JSON, so document the format and timezone if another system depends on them.

Consider how to represent empty or unavailable values. Use null only when it has a defined meaning. Leave a property out when it is optional and absent. An empty string, empty object, and empty array are distinct values. Before creating a file for an API, check its contract to see how those states are interpreted.

## Write strict JSON syntax

JSON object keys and string values use double quotes. A colon separates a key from its value; commas separate properties or array elements. The final member does not have a trailing comma. JSON has no comments, single-quoted strings, `undefined`, `NaN`, functions, or unquoted keys. These rules are stricter than JavaScript object literal syntax.

A small settings file could look like this:

    {
      "version": 1,
      "language": "en",
      "features": {
        "search": true,
        "experimental": false
      },
      "allowedHosts": ["example.org", "docs.example.org"]
    }

The example uses an object for named settings, a nested object for related feature flags, and an array for a list. Indentation is optional to the JSON parser, but whitespace and line breaks make manual review easier. A formatter can standardize indentation after the syntax is valid.

## Validate in layers

Syntax validation asks whether the text follows the JSON grammar. Schema validation asks whether the parsed value matches a defined structure and constraints. These are separate checks. A syntactically valid configuration may still omit a required key, use an unsupported version, or contain a value outside an allowed range.

For a critical file, use the parser that the target application uses, or a validator implementing the same relevant specification. A generic web tool can catch basic syntax errors but cannot establish that your application will accept every field. The [JSON Schema guide](/blog/json/json-schema-validation/) explains how a schema adds constraints. If the target program documents comments or a JSON-like variant, validate with that program's parser; do not assume every JSON tool accepts the extension.

After parsing, inspect the resulting values and test realistic cases. Include empty lists, nulls, Unicode text, a string containing a quote, and boundary numbers if those can occur. For a configuration file, test the actual application startup or configuration-load path. A successful parse only proves that the text is grammatical.

## Save the file carefully

Save using UTF-8 unless the consumer specifies another encoding. Use the `.json` extension as a convention for JSON data. The extension does not validate the content; a text file named `settings.json` can still contain invalid syntax. Avoid editors that silently change quotes or insert formatting characters that the parser does not expect.

If a tool creates a downloadable file, verify both its name and contents. Keep a source copy when the file is important, and avoid overwriting an existing production configuration until the new file has been reviewed. For generated output, use a temporary filename or version control so you can compare changes and recover the prior version.

Be careful when copying JSON into another format. A JSON document inside a programming-language string must also obey that language's string rules. JSON embedded in HTML, a shell command, or a URL has additional encoding concerns. Prefer reading a file or using a serializer over manually layering escape characters.

## Common beginner mistakes

Using single quotes is a frequent error because many programming languages accept them for strings. JSON does not. Another common issue is a comma after the last property, which strict parsers reject. A key without quotes might work in JavaScript source but is invalid in a `.json` file. Comments added for human notes also break strict JSON.

Type mismatches can be harder to notice than syntax errors. `"12"` is a string; `12` is a number. `"false"` is text; `false` is a boolean. Quoting every value may make a file parse while causing the application to reject or misinterpret it. Match the documented type for each field.

Duplicate keys can parse inconsistently across tools. Avoid them even if the local parser accepts the document. Large numbers may also lose precision when parsed in runtimes using binary floating point. If a value is an identifier rather than something to calculate, represent it as a string unless the receiving contract says otherwise.

## Creating JSON programmatically

For repeated or user-supplied values, create a native object or array in your programming language and serialize it with that language's JSON library. A serializer escapes quotes and control characters, emits valid syntax, and handles nesting. Hand-building a JSON string with concatenation can fail when input contains a newline or quote.

Test programmatic output by parsing it back and asserting the important values. Round-trip tests help catch accidental type conversions, missing fields, and formatting assumptions. They do not guarantee every consumer agrees with the schema, so include integration tests against the target application when possible.

## Conclusion

Define the data shape, use strict JSON grammar, save as UTF-8, and validate both syntax and application-specific constraints. Keep types and missing-value rules intentional. For generated files, serialize native data instead of assembling text manually, then parse and inspect the result before using it.

When creating files by hand, make one edit at a time and parse after meaningful changes. A parser error often points near the first place the grammar becomes impossible, not necessarily the original typo. Compare the reported character offset with nearby quotes and commas. If a formatter can parse the file, formatting it afterward provides a consistent baseline for later reviews.


