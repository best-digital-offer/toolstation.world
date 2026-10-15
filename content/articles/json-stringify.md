---
title: "JSON Stringify Explained With Examples"
description: "Understand JSON serialization, escaping, indentation, unsupported JavaScript values, and the limitations of JSON.stringify round trips."
primaryKeyword: "json stringify"
secondaryKeywords: ["json stringify online", "json to string", "json dumps", "json loads"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["stringify", "escape", "unescape", "parser"]
relatedArticles: ["json-parser-guide", "json-escape-unescape", "json-arrays-objects"]
---

JSON stringification converts a program value into JSON text. In JavaScript, JSON.stringify serializes supported values such as objects, arrays, strings, numbers, booleans, and null. A parser performs the reverse operation for valid JSON text. The two operations are useful for data exchange, downloads, and debugging, but they do not preserve every JavaScript value or every detail of the original text.

## Serialize a value

Given a JavaScript object with a name property and a list of skills, JSON.stringify can produce compact JSON text. Supplying an indentation argument produces a readable version with line breaks. The [JSON Stringify](../../../tools/json/stringify/) tool parses JSON input and displays a serialized form; its compact option removes indentation from the output.

Stringification is not the same as calling a generic toString method. An object may stringify to "[object Object]" with ordinary coercion, which is not JSON. Use a JSON serializer when you need a structured representation that another JSON parser can read.

## Whitespace and indentation

A JSON serializer can output compact text or pretty text. The optional spacing argument controls indentation in JavaScript. Zero or no spacing produces compact output; a positive number of spaces or a string sets indentation. This affects presentation only for ordinary data. The output should still represent the same parsed value.

Do not compare serialized strings across implementations if property ordering or number spelling is not part of the contract. If you need semantic comparison, parse and compare values. If you need a canonical byte sequence for signatures or hashes, use a specified canonicalization algorithm rather than assuming one language's default serializer is canonical.

## Escaping strings

JSON strings use double quotes and escapes for special characters. A quote and backslash inside a string need escaping. Control characters such as a line break are represented with escape sequences. JSON.stringify handles these details for JavaScript strings, which is safer than manually concatenating quote marks.

If an application wants to embed a string value inside JSON, stringify the value as a string rather than inserting it between quotes yourself. For example, the JavaScript text value with a line break can be serialized so that the JSON output contains a backslash-n escape. When parsed, the original line break returns as part of the value. Use the [JSON Escape](../../../tools/json/escape/) and [JSON Unescape](../../../tools/json/unescape/) pages to inspect the distinction between raw text and JSON string syntax.

Escaping JSON is not the same as escaping HTML, a shell command, a URL, or SQL. Each context has its own encoding rules. A JSON string may still contain characters that require escaping before it is inserted into an HTML attribute or shell command. Apply the encoder for the final output context.

## Values JSON cannot represent directly

JavaScript includes values that JSON does not have. Undefined properties on objects are generally omitted by JSON.stringify. Undefined or function-like values inside arrays can become null. Functions and symbols are not serialized as JSON data. NaN and Infinity are serialized as null in JavaScript's standard JSON.stringify behavior. These transformations can surprise callers who expect a round trip to preserve every source property.

Dates are objects in JavaScript and may serialize through a toJSON method to a string. That string does not retain the original Date object type. A JSON parser will return a string unless the application separately interprets it as a date. If type reconstruction matters, define a documented schema or tagged representation.

Circular references cannot be represented by ordinary JSON. If an object refers back to itself, JSON.stringify throws. Remove the cycle or choose an explicit reference model rather than attempting to serialize the entire live object graph blindly.

## Number precision

JSON text can contain numeric tokens, but JavaScript parses them into its Number type. Large integers may lose exact digits, and decimal values can have binary floating-point representation differences. If the source is an exact numeric identifier, retain it as text. For financial calculations, use decimal-safe types and a format that specifies scale and rounding.

Even when a decimal is displayed with fewer digits after stringification, the numeric value may be equivalent for ordinary application use but not byte-identical. Do not rely on the serializer to preserve trailing zeros in decimal notation. If "4.50" carries presentation meaning, store a formatted string or retain the original lexical representation.

## Object ordering and round trips

JSON objects are conceptually collections of name/value pairs, while arrays are ordered. JavaScript property enumeration rules affect output order for some key classes, and other languages may serialize object members differently. Avoid using raw JSON.stringify output as a universal equality or signing format unless an explicit canonicalization standard is in use.

Duplicate property names are also hazardous. A parsed JavaScript object cannot retain multiple values under one property name in the ordinary way. Parsing then stringifying may discard duplicates from the source. If the original document contains duplicates, repair the producer or use a representation-preserving parser before rewriting it.

## Serialization boundaries and safety

JSON.stringify creates text; it does not transmit the text or make it confidential. If the output includes private values, protect the surrounding transport and access. Avoid exposing secrets in browser code, logs, URLs, or client downloads.

When JSON is displayed in a web page, show it as text in a code element rather than interpreting it as HTML. A string can contain markup-like text, but a JSON viewer should render that as inert text. When serializing for a script context, follow the embedding platform's rules and use a safe data-transfer mechanism rather than building script tags by concatenation.

## Practical workflow

1. Decide which value types are part of the data contract.
2. Serialize with a JSON serializer, not generic string coercion.
3. Choose compact output for transport only when the benefit is measured; use indentation for review.
4. Check undefined values, functions, dates, circular references, and large numbers.
5. Parse the output with the intended consumer and test the round trip.
6. Encode separately for any HTML, URL, or shell context where the JSON text will be used.

For Python, the standard library exposes json.dumps for serialization and json.loads for parsing. Other languages have their own serializers and options. Do not assume their date, number, or property-order behavior is identical to JavaScript.

## Conclusion

JSON stringification is a structured serialization operation, not a generic conversion of every runtime value. Use it to create valid JSON text, but account for omitted values, unsupported types, cycles, number precision, and output context. Test the serialized document with the parser and application that will consume it.

