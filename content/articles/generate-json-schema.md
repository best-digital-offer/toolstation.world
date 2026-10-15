---
title: "How to Generate a JSON Schema From Sample Data"
description: "Infer a starting JSON Schema from example JSON, then review required fields, array variants, numeric limits, and assumptions that a sample cannot reveal."
primaryKeyword: "json schema generator"
secondaryKeywords: ["generate json schema", "json schema validator", "json example"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["schema-generator", "schema-validator", "examples"]
relatedArticles: ["json-schema-validation", "json-parser-guide", "json-arrays-objects"]
---

A JSON Schema generator examines one or more sample values and infers a possible structure. It can identify that a sample contains an object, that a property currently holds a string, or that an array contains objects with certain keys. The sample cannot reveal every valid future value. Treat generated output as a draft: decide which properties are optional, which array variants are allowed, what ranges apply, and whether undeclared properties should be accepted.

## What an inference can observe

Given a sample such as:

    {
      "id": 21,
      "name": "Asha",
      "active": true,
      "tags": ["new", "review"]
    }

a generator can infer an object with numeric id, string name, boolean active, and an array of strings. That is an observation about this sample. It does not prove that every record must include all four fields or that id can never be a string. The true contract comes from the system that produces and consumes the data.

The [JSON Schema Generator](../../../tools/json/schema-generator/) on this site emits a Draft 2020-12-shaped schema from one sample. It marks every observed property as required and uses the first element of a non-empty array to infer its items. Those are deliberate limitations of simple sample inference. Review and adjust the generated schema before publishing it or using it in production.

## Required versus optional fields

If a single sample contains a property, a generator cannot know whether that property is required. The sample shows that the property can occur. It does not show what happens when it is absent. Multiple examples can help: if a field is present in some objects and missing in others, that is evidence that it may be optional. It still may be required in a particular context or version.

Compare two records:

    {"id": 1, "name": "Asha"}
    {"id": 2, "name": "Mika", "nickname": "Mi"}

The nickname field is absent in one example. A reasonable draft might make id required, name required, and nickname optional. A one-sample generator using the second record may incorrectly mark nickname required. Inspect every required array against the actual contract.

Null is not the same as optional. A field may be required but allow either a string or null. Another field may be optional but, when present, must be a string. Decide separately whether a field can be omitted and whether null is a valid value.

## Arrays need representative items

An empty array provides no evidence about its item type. A simple generator can only emit an unconstrained or placeholder items schema. An array with one item gives one observed type, but the real array may contain multiple types. For example, an API might return strings on success and objects for detailed error records. A single sample cannot reveal that union.

Provide representative samples with zero, one, and multiple array elements. Include unusual but valid variants and boundary cases. If every item is intended to have the same schema, verify that separately. If object fields differ across elements, determine whether the missing keys are optional or whether the elements represent distinct variants described by a union.

Nested arrays deserve the same review at each level. A generator that uses the first array item may miss another variant or a branch with different properties. For a heterogeneous dataset, sample selection strongly affects the inferred result.

## Types do not reveal every constraint

The sample value 21 tells a generator that the observed value is numeric. It does not reveal whether the allowed range is 0 through 100, whether fractions are permitted, or whether the number is an identifier that should be a string. A sample string that looks like a date does not prove the consumer validates dates. A name with one length cannot establish maximum length or a safe character set.

Add numeric bounds, string lengths, patterns, formats, and enum values only when backed by a real contract. Overly strict constraints can reject future records. Overly broad constraints allow bad data through. Consult producer code, API documentation, database constraints, and tests rather than inventing values from one fixture.

Duplicate object keys and large numeric literals also deserve special care. A generator that parses into ordinary JavaScript values may not preserve duplicate keys or exact large integer tokens. If those cases appear in source data, correct the source or use a representation-preserving parser.

## Additional properties and versioning

An inferred schema can either leave unmentioned properties unconstrained or forbid them. These choices affect forward compatibility. Allowing additional properties can make it easier for producers to add fields without breaking older consumers. Forbidding them can catch misspelled names, but may reject a legitimate new field.

Do not add a strict no-extra-properties rule just because one sample has a fixed set of keys. Ask whether the schema describes a closed object or an extensible record. Consider versioning and how consumers handle new fields. An API contract may intentionally permit unknown keys even when a local configuration file does not.

## A reliable generation workflow

1. Collect examples from multiple realistic records, including edge cases.
2. Generate a draft and inspect every property type and required entry.
3. Decide how null, missing, empty, and additional fields should behave.
4. Add constraints supported by documentation or application rules.
5. Check the schema dialect and target validator implementation.
6. Validate known-good and known-bad fixtures automatically.
7. Review future schema changes for compatibility.

The [JSON Schema Validator](../../../tools/json/schema-validator/) on this site supports only selected common keywords. For complex production schemas, use a maintained validator that implements the dialect and vocabularies your contract depends on, and test in the application's runtime.

## Keep the schema close to its owner

A schema is most useful when it is maintained with the code or API that owns the data contract. Store it in version control, document the draft, and include examples. A screenshot of a generated schema is not a reliable contract. Generated results should be reviewed in a diff just like source code.

When a producer evolves, decide whether it is a compatible addition or a breaking change. Adding an optional field can be compatible for tolerant consumers. Changing a field from number to string or making an optional key mandatory often is not. Automated contract tests can catch these changes earlier than manual inspection.

## Conclusion

Schema generation accelerates the first draft, but examples provide evidence rather than certainty. Use multiple samples, review required fields and array variants, and derive constraints from the actual application contract. Validate the finished schema with the same draft and implementation that production will use.

