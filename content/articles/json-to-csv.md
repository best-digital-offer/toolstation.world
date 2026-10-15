---
title: "How to Convert JSON to CSV Online"
description: "Convert arrays of JSON records into CSV, understand headers and quoting, and decide how nested values should be represented."
primaryKeyword: "json to csv"
secondaryKeywords: ["json format to csv", "convert json to csv", "json to csv online", "online json to csv converter"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["to-csv", "array-to-csv", "nested-to-csv"]
relatedArticles: ["nested-json-to-csv", "csv-to-json", "json-to-csv-code"]
---

To convert JSON to CSV, start by deciding what one CSV row represents and what each column should contain. The most common input is an array of objects where every object is one record. The converter can use object properties as column headers, then write each value under its header. This works well for flat records. Nested objects, arrays, missing fields, and null values need explicit choices because CSV is a table of text cells, not a nested data format.

## Convert a flat array of objects

Consider an input where each object represents one product:

    [
      {"sku":"A-1","name":"Notebook","price":4.50},
      {"sku":"A-2","name":"Pen","price":1.25}
    ]

The properties become headers and each object becomes a data row:

    sku,name,price
    A-1,Notebook,4.5
    A-2,Pen,1.25

The [JSON to CSV](../../../tools/json/to-csv/) tool expects a top-level array. It collects columns from the input records, writes a header, and leaves missing properties as empty cells. It quotes fields when they contain commas, quotes, or line breaks. Use the [JSON Array to CSV](../../../tools/json/array-to-csv/) page for arrays of scalar values, which use a single value column.

## Headers and inconsistent objects

Real JSON arrays do not always have identical objects. One record might have a phone number while another has an email field. A flat export can build a union of the keys observed across all records:

    [
      {"id":1,"name":"Asha","email":"asha@example.test"},
      {"id":2,"name":"Mika","phone":"555-0100"}
    ]

Possible columns are id, name, email, and phone. The first row has an empty phone cell, and the second row has an empty email cell. Empty cells are convenient but ambiguous: they may stand for a missing key, a null, or an empty string. If that distinction matters, define a separate representation such as explicit sentinel text or additional presence columns.

Column order can follow first appearance, alphabetical order, or a supplied schema. A stable schema is better for repeatable exports because records with different key order should not unexpectedly reshuffle the CSV header. If consumers rely on a fixed column order, specify it and test it rather than assuming an object enumeration order will match another tool.

## Quote values correctly

CSV fields containing commas, quote marks, or embedded line breaks must be quoted. A quote inside a quoted field is represented by doubling it. For example, the value:

    She said "hello", then left

can be written as:

    "She said ""hello"", then left"

This is why splitting a CSV line on every comma is incorrect. A quoted comma is part of the value, not a column boundary. The [CSV to JSON](../../../tools/json/csv-to-json/) converter on this site uses a quote-aware parser for the common header-based format. When exchanging files with a particular spreadsheet or database, confirm its expected delimiter, line ending, character encoding, and null convention.

Unicode text should be preserved as text. Names and notes may include characters outside basic ASCII. Use UTF-8 when saving or importing if the receiving application supports it. Some spreadsheet programs infer types, trim zeros, or reinterpret a date-looking string, so inspect imported columns instead of assuming the text will remain unchanged.

## Nested values require a representation

CSV has rows and columns but no standard child object. Given a record like:

    {"id":1,"customer":{"name":"Asha","region":"South"}}

you could flatten nested object properties into columns customer.name and customer.region. Another option is to place the nested object as JSON text in one customer column. The first approach is easier to filter in a spreadsheet; the second preserves grouping but requires the reader to parse JSON within a cell.

Arrays need a similar choice. They can be joined into a delimited string, expanded into multiple rows, or kept as JSON text. Joining with a comma is ambiguous if an array item itself contains a comma. Expanding rows can multiply records and may repeat parent fields. Keeping a JSON string is explicit but less convenient for spreadsheet formulas. There is no universally correct conversion for every nested structure.

The default on this site's converter flattens nested objects using dotted column names and keeps nested arrays as JSON text. The [Nested JSON to CSV](../../../tools/json/nested-to-csv/) page explains the trade-offs. Review the resulting headers for collisions: a literal key named customer.name may conflict with the flattened path from customer then name.

## Null, missing, and empty values

JSON distinguishes null, absent properties, empty strings, zero, and false. CSV has no built-in typed null marker. Many exporters encode null as an empty cell, but an empty string becomes the same output. If the distinction matters, document a sentinel such as \N, while checking that the sentinel cannot appear as a real value, or add a companion column that indicates whether the original key existed.

Numbers also need care. JSON numbers can be parsed into a programming language's numeric type and reserialized with a different textual spelling. A value such as 4.50 may become 4.5. Those are numerically equivalent, but not byte-for-byte identical. If the formatting of decimal values matters for downstream accounting or display, keep the original numeric text or define a decimal conversion rule.

Large integer identifiers may exceed the exact numeric range of JavaScript. If an export passes through a browser parser, represent such identifiers as strings in the source or use a converter that preserves numeric tokens. Do not allow spreadsheet software to strip leading zeros from a code or turn long digits into scientific notation.

## Validate the shape before exporting

Check that the top-level value is an array and decide whether each item should become a row. A top-level object could be exported as a single row, but that is a different convention from arrays of records. Arrays of arrays might need the first row treated as headers, while arrays of scalars need one value column. A tool should make its chosen behavior visible.

Validate syntax before conversion. Then inspect the output header and at least a few rows, including records with missing keys, nulls, Unicode, embedded line breaks, and nested values. If the output will be imported into a database, define types separately; CSV alone does not preserve JSON types.

## A reliable workflow

1. Identify what each row should represent.
2. Choose headers and a stable column order.
3. Decide how to flatten objects and preserve arrays.
4. Choose how null and missing values will be represented.
5. Convert, then inspect quoting, line endings, and Unicode.
6. Test import into the actual spreadsheet, database, or downstream script.

For repeated data pipelines, encode these rules in a script and test them with representative fixtures rather than relying on manual export settings. The [language-specific conversion guide](json-to-csv-code/) compares browser use with Python, JavaScript, and PowerShell approaches.

## Conclusion

JSON-to-CSV conversion is straightforward for flat arrays of records and a modeling decision for nested data. Treat headers, arrays, nulls, numeric precision, and quoting as explicit parts of the export contract. Always verify the CSV with the system that will consume it; a successful download does not guarantee that the receiving spreadsheet will interpret every cell as intended.



