---
title: "How to Convert JSON to YAML"
description: "Convert JSON-compatible data into readable YAML, understand how nesting and scalar values map, and verify the result with the intended parser."
primaryKeyword: "JSON to YAML"
secondaryKeywords: ["convert JSON to YAML", "JSON YAML converter", "JSON YAML syntax"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["yaml-converter", "formatter", "validator"]
relatedArticles: ["json-vs-yaml", "json-comments", "create-json-file"]
---

To convert JSON to YAML, parse the JSON into data and serialize that data with a YAML serializer. This preserves the basic objects, arrays, strings, numbers, booleans, and null values while changing their notation. Do not convert with search-and-replace: braces, commas, quotes, and indentation have different grammatical roles. The [JSON to YAML tool](../../../tools/json/to-yaml/) in this project serializes JSON-compatible values in the browser and explains its scope.

## How the structures map

JSON objects become YAML mappings. A JSON key and its value are represented as a key followed by a colon, and nested values are indented below that key. JSON arrays become YAML sequences, commonly written as dash-prefixed items. A scalar remains a scalar, although its textual representation may change. For instance, JSON `true` may be emitted as YAML `true`, while a string may be quoted when quoting is needed to preserve its meaning.

An object like `{"name":"Ada","active":true}` can become:

    name: Ada
    active: true

An array of objects becomes a sequence whose items are mappings. Indentation shows that each object's fields belong to the same list item. A formatter may choose compact flow notation for small lists, but block notation is often easier to review in configuration files.

Null values, empty objects, and empty arrays need care because their concise YAML notation can look similar to an omitted value. The serializer should emit an explicit representation that its target parser reads correctly. After conversion, parse the output and compare the resulting data structure with the original parsed JSON value.

## Why parsing is essential

JSON source is text, not a set of punctuation marks to replace. A comma between object properties has a different function from a comma inside a string. Braces can appear as ordinary characters in a string. A global transformation cannot reliably distinguish syntax from content. Parsing first gives the converter a structured tree, and a serializer can then make syntactically appropriate choices.

This approach also gives a useful failure point. If the JSON is invalid, the converter can report a parse error before generating anything. If YAML serialization fails for an unsupported value, the error can identify a data limitation. A successful text substitution would provide no such assurance.

## The JSON-compatible subset

JSON represents a narrower data model than general YAML. It does not have YAML comments, tags, anchors, aliases, or custom scalar types. A JSON-to-YAML converter can represent all parsed JSON values using ordinary YAML, but a YAML-to-JSON converter may face constructs with no direct JSON counterpart. Conversion direction matters.

Numbers can be especially subtle. JSON syntax permits numeric values that a target programming language may parse with limited precision. A large integer could be rounded if converted through a floating-point runtime. Treat identifiers as strings when they are not quantities. For numeric fields requiring exactness, test the parser and serializer chain with values at the relevant boundaries rather than assuming visual preservation guarantees numeric identity.

Strings that look like YAML syntax must remain strings. Text such as `yes`, `null`, `2026-01-02`, or `12` may be interpreted differently by some YAML parsers or versions if emitted without quotes. A capable serializer quotes ambiguous strings. Never remove those quotes merely to make a file look cleaner without checking the target parser's interpretation.

## Check the target YAML parser

YAML has versions, schemas, and parser options. An application may support only one version or restrict features. After conversion, use that application's parser or its documented linter. A generic YAML preview cannot guarantee that a particular deployment system accepts the document or interprets implicit scalars the same way.

If the YAML will be edited later, decide whether comments and anchors are part of the maintained source. They are not carried from JSON because JSON has no representation for them. Conversely, if a YAML file is converted into JSON, comments are discarded because they are not part of the parsed data model. Keep comments in documentation or annotate fields using an application-supported property when the information must survive machine conversion.

## A reliable conversion workflow

Start with a source file under version control or a separate backup. Parse the JSON and inspect the overall shape. Convert it to YAML, then parse the output with the intended parser. Compare the source and parsed result structurally, accounting for documented number and string representation. Review changes to empty values, long strings, Unicode, and nested lists.

For a configuration migration, validate more than syntax. Run the application or deployment validator in a non-production environment. Confirm required keys, environment overrides, and secret handling. A syntactically valid configuration may still have an unsupported property or a valid-but-dangerous setting.

For automation, add the round-trip check to tests. Parse JSON input, serialize to YAML, parse YAML back, and assert relevant types and values. Test strings that resemble numbers or booleans, multiline strings, empty arrays, nulls, Unicode characters, and deep nesting. Use realistic maximum-size inputs if the file is large.

## Common mistakes

Changing commas into line breaks does not handle nested arrays or object boundaries. Removing quotes from every string can transform values into booleans or numbers. Treating every blank cell as null can alter meaning. Another frequent mistake is assuming that comments from an existing YAML file will survive conversion through JSON; once parsed, those comments are not represented in the JSON data.

It is also easy to confuse conversion with validation. A conversion tool can faithfully represent malformed business data that is structurally legal. If `enabled` contains the string `"perhaps"`, the result may still be valid YAML even if the consuming program expects a boolean. Use a schema, application validator, and integration test for these requirements.

## Conclusion

Parse JSON and serialize its data with a real YAML implementation. Confirm how ambiguous strings, numbers, nulls, and empty containers are represented, then validate with the YAML parser that will consume the file. Treat the output as a format conversion that needs review, especially for configuration or data used in production.

## When to preserve JSON instead

If a file is exchanged directly with an API or consumed by a tool that expects JSON, converting it to YAML may add a new parsing dependency without improving the workflow. Keep the original format when interoperability, generated clients, or existing validation tools depend on it. YAML is most useful when its human-editing features solve a real maintenance problem.

For generated documentation, it can be helpful to provide both representations, but identify one as canonical. Verify they describe the same data whenever either changes. A stale secondary format is worse than a single clear source of truth because readers may choose the version that appears more readable but no longer matches the application.


