---
title: "JSON Arrays and Objects: Structure, Differences and Examples"
description: "Learn when JSON uses arrays or objects, how to access nested values, and how nulls, ordering, and mixed shapes affect processing."
primaryKeyword: "JSON arrays and objects"
secondaryKeywords: ["JSON object", "JSON array", "JSON data structure"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["tree-viewer", "formatter", "validator"]
relatedArticles: ["json-tree-viewer", "json-formatter-guide", "json-schema-validation"]
---

JSON has two container structures: objects and arrays. An object groups values under unique string keys; an array stores values in a sequence. Choose an object when names describe fields and an array when position or repeated entries matter. Both can contain nested objects, arrays, scalar values, or null. The [JSON Tree Viewer](../../../tools/json/tree-viewer/) helps inspect nested shapes, while the [JSON Validator](../../../tools/json/validator/) checks whether the text parses.

## Objects describe named properties

An object starts with `{` and ends with `}`. Between them, each property is a quoted string name, a colon, and a JSON value. Commas separate properties. For example:

    {
      "id": 42,
      "name": "Ada",
      "active": true,
      "address": { "city": "London", "postalCode": null }
    }

This object represents one entity with named fields. A consumer can access `name` without knowing its position. That makes objects suitable for records, configuration settings, and API responses whose fields are identified by meaning.

JSON object member names are strings. Numbers, booleans, and null are values but cannot be bare property names. Names should be unique. The standard warns about unpredictable behavior when names repeat: one parser may retain the first value, another the last, and another may expose both. Avoid duplicates and consider validating data at its source if duplicate-name ambiguity matters.

Do not assume a meaningful universal property order. JSON objects are semantically unordered collections, although many parsers preserve source order when displaying or serializing. That behavior is useful for readability but should not be an application contract unless the specific format says otherwise. If order matters, represent the sequence as an array.

## Arrays preserve sequence

An array begins with `[` and ends with `]`. Its values are separated by commas, and each value has a position starting at index zero in common programming languages. An array of names might look like `{"skills":["analysis","programming"]}`. The order is meaningful: swapping those two entries produces a different sequence.

An array can contain many values, including objects. A list of records often has this shape:

    [
      { "sku": "A-12", "quantity": 2 },
      { "sku": "B-08", "quantity": 1 }
    ]

The outer array communicates repetition; each object provides names for the columns in one record. This shape is common in API responses and is the most straightforward starting point for converting rows to CSV. If records have inconsistent keys, the conversion must decide whether to union all keys, reject the inconsistency, or use a fixed schema.

Arrays can legally mix value types, but a stable application contract usually defines one expected item shape. A mixed array such as `[1,"two",null]` is valid JSON but may be inconvenient for typed code, sorting, or tabular conversion. A schema can constrain the item type when uniform data is required.

## Values and absence are different

JSON has strings, numbers, booleans, null, objects, and arrays. It has no `undefined`, date, function, or binary value. A property set to null is present and explicitly has no value. A missing property is absent. Those two states can communicate different intent. For example, an update request may interpret a missing `nickname` as “leave unchanged” and null as “clear it,” depending on the API contract.

Empty containers also differ from null. `{}` is an empty object and `[]` is an empty ordered list. Neither means “unknown” automatically. A tool that flattens data should keep this distinction where possible; converting every empty value to a blank cell can lose information. For business imports, document how empty strings, nulls, absent properties, and empty arrays are represented.

Numbers in JSON follow a strict syntax, but their precision depends on the runtime. JavaScript numbers use binary floating-point and cannot exactly represent every large integer. Identifiers, account numbers, and values requiring exact decimal precision may be safer as strings or handled with a suitable decimal/integer library in the consuming application. Formatting a large numeric token cannot restore precision already lost by parsing.

## Nested data and paths

Containers can be nested to any practical depth allowed by a parser. A path such as `orders[0].items[1].price` describes navigation in a common programming notation, but it is not itself a standard JSON feature. Property names may contain dots or brackets, so robust software should use explicit tokens or a documented JSON Pointer syntax instead of splitting paths naively.

Deeply nested structures can be harder to review and transform. A tree viewer makes hierarchy visible, but flattening introduces naming choices. A path-based column `customer.address.city` is convenient until property names contain dots or two different paths collapse to the same label. Escaping path separators or mapping paths to separate metadata avoids collisions.

When a nested array appears under an object, there is no single universal row conversion. One row per parent with a serialized child array preserves the grouping but is less relational. One row per child duplicates parent fields. Separate linked tables preserve relationships more faithfully but require keys and multiple files. Choose the form based on how the output will be queried, not just which option creates the shortest CSV.

## Common syntax mistakes

Object keys and string values require double quotes. Single quotes are not JSON string delimiters. Property-value pairs use colons, and commas separate items; a trailing comma before a closing brace or bracket is invalid in strict JSON. Comments are not part of the standard syntax. These rules differ from JavaScript object literals, which can use shorthand properties and other language features that JSON does not support.

An error near a closing brace often comes from a trailing comma, missing value, or unmatched quote earlier in the object. Read the parser's location and inspect the preceding token. The true source may be a line above the reported point because the parser only knows where the grammar became impossible. A formatter can improve readability after parsing; it cannot make invalid text valid without a repair decision.

## Choosing a useful shape

Use an object for fields addressed by name, an array for ordered or repeated values, and nested combinations when the relationship is part of the data. Avoid arrays whose positions have undocumented meanings, such as `[42,"Ada",true]`, unless the tuple structure is formally specified. An object with labels is easier to extend and review.

Before publishing an API or file format, write down required and optional properties, nullability, array item rules, identifier types, numeric ranges, and whether unknown fields are accepted. A schema or typed interface can make those decisions testable. Sample data alone is not a complete contract because a sample cannot show every optional field or boundary condition.

## Conclusion

Objects provide named fields; arrays provide ordered entries. Their nesting lets JSON represent trees, but conversion and validation require explicit choices about missing values, nulls, ordering, and mixed item shapes. Define the intended structure, test representative edge cases, and use a readable tree or formatter to inspect the result before handing data to another system.

