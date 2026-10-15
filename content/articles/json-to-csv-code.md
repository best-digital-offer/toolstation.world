---
title: "How to Convert JSON to CSV in Python, JavaScript and PowerShell"
description: "Convert arrays of JSON objects to CSV using standard libraries, while accounting for headers, quoting, missing values, nested data, and file encoding."
primaryKeyword: "JSON to CSV Python JavaScript PowerShell"
secondaryKeywords: ["Python JSON to CSV", "JavaScript JSON to CSV", "PowerShell JSON to CSV"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["to-csv", "nested-csv", "formatter"]
relatedArticles: ["json-to-csv", "nested-json-to-csv", "csv-to-json"]
---

To convert JSON to CSV in Python, JavaScript, or PowerShell, first choose a row model, then use a CSV writer that quotes commas, quotes, and line breaks correctly. The simplest input is an array of objects with scalar values. Nested objects and arrays require a policy such as flattening paths or preserving their JSON text. Review the output because CSV cannot represent every JSON structure without a convention. For a quick browser task, the [JSON to CSV tool](../../../tools/json/to-csv/) explains its flattening behavior.

## Define rows and columns

CSV represents a table: each record has fields arranged under a header row. An array of similar JSON objects is a natural starting point. If objects have different keys, create a stable union of headers or enforce a schema. Decide whether columns follow first-seen order or a declared order; reproducible exports should use a deterministic rule.

Missing values need a convention. A blank cell might mean a missing property, null, or an empty string. CSV alone does not distinguish those states. If the distinction matters, use explicit sentinel values with escaping rules, include a companion schema, or retain the original JSON. Null values should not be silently converted to text `null` unless that is what the receiving system expects.

Nested objects can be flattened to names such as `address.city`, but a literal key containing a dot can collide with a nested path. Escape path separators or map paths explicitly for durable interchange. Arrays may be written as JSON text in one cell or expanded into multiple rows. Expanding arrays can duplicate parent data and change record counts, so document the transformation.

## Python with the standard library

Python can parse JSON using the `json` module and write CSV with `csv.DictWriter`:

    import csv, json
    with open("input.json", encoding="utf-8") as source:
        rows = json.load(source)
    if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
        raise ValueError("Expected an array of objects")
    headers = list(dict.fromkeys(key for row in rows for key in row))
    with open("output.csv", "w", newline="", encoding="utf-8-sig") as target:
        writer = csv.DictWriter(target, fieldnames=headers, extrasaction="raise")
        writer.writeheader()
        writer.writerows(rows)

The `csv` module handles delimiter quoting and embedded newlines. Opening with `newline=""` follows its documented file-handling pattern. UTF-8 is broadly suitable; `utf-8-sig` writes a byte-order mark that some spreadsheet applications use to detect Unicode, but other workflows may prefer plain UTF-8. Choose based on the consumer. The example expects flat values; nested dictionaries and lists need deliberate conversion before writing.

## JavaScript in Node.js

In Node.js, `JSON.parse` reads the source and `JSON.stringify` can preserve nested values as JSON text. A small CSV writer should quote a field if it contains a comma, quote, carriage return, or newline, and double any embedded quotes. For production scripts, prefer a maintained CSV library when available rather than reimplementing edge cases.

    function csvCell(value) {
      const text = value == null ? "" :
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }
    const rows = JSON.parse(inputText);
    if (!Array.isArray(rows) || rows.some(row => !row || Array.isArray(row) || typeof row !== "object")) {
      throw new TypeError("Expected an array of objects");
    }
    const headers = [...new Set(rows.flatMap(Object.keys))];
    const csv = [headers, ...rows.map(row => headers.map(key => row[key] ?? ""))]
      .map(row => row.map(csvCell).join(",")).join("\r\n");

This example uses CRLF record separators and serializes nested containers as JSON text, which is one explicit preservation strategy. It maps both null and missing values to blank cells; change that policy if they must remain distinguishable. For large files, avoid reading everything into memory and use streaming file and CSV APIs.

## PowerShell

PowerShell can parse JSON with `ConvertFrom-Json` and create CSV output with `Export-Csv`:

    $rows = Get-Content -Raw -Encoding utf8 .\input.json | ConvertFrom-Json
    $rows | Export-Csv -Path .\output.csv -NoTypeInformation -Encoding utf8

`Export-Csv` expects objects and chooses columns from their properties. For data with inconsistent keys, normalize objects first so the exported header set is stable. Depending on the PowerShell version and downstream application, UTF-8 encoding details may vary; verify the generated file with the consumer. `ConvertTo-Csv` returns text when a pipeline string is more appropriate.

Nested objects may become type names or string representations that are not useful as CSV. Select and flatten the exact fields needed before exporting. For example, create a calculated property for a nested city field and serialize an array with `ConvertTo-Json -Compress` when retaining it in one cell. Test values that contain quotes, separators, line breaks, and non-ASCII characters.

## Validate the output

After writing the file, open it with a CSV parser, not only a spreadsheet. Check that each data row has the expected field count, that quotes are balanced, and that line breaks inside quoted fields remain inside one logical cell. Spreadsheet display can hide distinctions and may reinterpret date-looking strings or long identifiers. For identifiers with leading zeroes, verify that the importing application does not coerce them into numbers.

Add tests for an empty array, one row, missing keys, nulls, commas, quotes, multiline text, Unicode, nested objects, arrays, and unusual header names. Confirm that the number of logical records matches expectations. Round-trip through a CSV parser to inspect field values; byte-for-byte equality is not required because serializers may normalize quoting and line endings.

## Security and data handling

CSV files opened in spreadsheet software can trigger formula interpretation when a cell begins with characters treated as formulas. Quoting alone may not prevent formula execution in every application. If exporting untrusted values for spreadsheet use, learn the target application's CSV injection mitigations and apply them with care; prefixing values can change data and should be a documented output policy.

Keep sensitive data out of temporary logs and command histories. Validate input size before processing and use streaming approaches for large exports. Never treat a converted file as safe simply because it parses; review where it will be opened and what formulas or external links it can contain.

## Conclusion

All three environments can parse JSON and produce CSV, but the hard part is deciding how a tree becomes rows and columns. Use standard parsers and writers, define null and nested-value policies, preserve Unicode, and test the output with the system that will import it. For production data, include those choices in code and documentation rather than relying on a one-off manual conversion.

## Automate schema normalization before writing

Real exports are often not a flat list. If a value is an object with a `records` property, extract that array explicitly instead of silently treating the top-level object as a one-row record. If the input is a page envelope with both `items` and `nextPageToken`, decide whether the conversion should include only the current page or gather pages upstream. File conversion cannot infer pagination semantics from the JSON shape alone.

A normalization stage should map source fields to stable CSV columns. Renaming a nested property, converting a timestamp, or splitting a list into multiple rows is a business rule and belongs in readable code with tests. Keep that stage separate from CSV quoting. Then the writer can focus on representing cells correctly while the mapping layer explains how the data model becomes a table.

## Make exports reproducible and reviewable

For scheduled exports, define a stable header order rather than taking whatever property appears first in the latest data. A new field can then be added intentionally with a version note. Track record counts and rejected rows, but avoid writing complete sensitive records into application logs. A summary can report that three records failed without leaking their contents.

If several teams consume the file, publish a short data dictionary: column name, source path, type, null behavior, date format, and whether the column can contain embedded line breaks. Include a sample containing difficult but valid values. This documentation prevents spreadsheet users from guessing what an empty cell or serialized nested object means.

CSV may also be opened in a spreadsheet that evaluates formula-like cell contents. Treat values from untrusted sources as data, inspect how the target application imports them, and apply a documented mitigation when needed. That mitigation can change the cell's literal text, so preserve the original data separately when exact round-trip fidelity matters.

