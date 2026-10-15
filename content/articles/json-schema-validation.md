---
title: "JSON Schema Validation: A Practical Guide"
description: "Use JSON Schema to check data shape, required fields, and value constraints, and understand which draft and implementation features are involved."
primaryKeyword: "json schema validator"
secondaryKeywords: ["json schema validation", "json validator", "json schema draft 2020-12"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["schema-validator", "schema-generator", "validator"]
relatedArticles: ["generate-json-schema", "json-validator-guide", "json-parser-guide"]
---

JSON Schema describes the structure and constraints of JSON values. A validator parses the instance and schema, then checks whether the instance satisfies the schema's supported rules. This can catch missing fields, wrong types, values outside a range, and strings that fail a pattern. It does not replace application logic, and an implementation that supports only a subset of the standard must say so clearly.

## Syntax validation comes first

JSON Schema validation assumes the instance itself is valid JSON. If the text has a missing comma or an unclosed string, a JSON parser must reject it before a schema can inspect the value. The schema is also JSON text, so it must parse correctly.

The [JSON Schema Validator](../../../tools/json/schema-validator/) on this site supports a limited set of common keywords: type, properties, required, items, enum, const, numeric bounds, string length bounds, and pattern. It identifies its supported subset and ignores other keywords. It is not a complete implementation of Draft 2020-12. Do not use it as the only production validation layer for a contract that relies on unsupported features.

The official [JSON Schema Draft 2020-12 specification](https://json-schema.org/draft/2020-12) defines core and validation vocabularies. A schema should identify the dialect it targets when interoperability matters. Tools that support different drafts may interpret keywords or defaults differently.

## A small object schema

An object schema can declare expected properties and required names. For example, a customer record might require a name and permit an optional age:

    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer", "minimum": 0}
      },
      "required": ["name"]
    }

The required list names fields that must exist. The properties map describes constraints for values when those properties occur. Unless the schema also constrains additional properties, an undeclared field may still be allowed. This distinction is useful during migrations: a schema can document the fields it understands without rejecting forward-compatible additions.

The site tool supports object type checks, declared property validation, required names, and numeric minimum or maximum. It does not implement every applicator or unevaluated keyword. Check the tool's output and supported-keyword note before treating a passing result as standards-complete.

## Types, arrays, and allowed values

The type keyword can restrict a value to object, array, string, number, integer, boolean, or null. A schema can describe arrays with items and set minimum or maximum numeric values. An enum can list accepted JSON values, while const restricts an instance to one value.

These checks describe shape, not necessarily meaning. A string property called date can still contain text that is not a valid calendar date unless a supported assertion checks it. Some specifications define format annotations and format assertions separately; implementations may not enforce a format automatically. Verify the validator's documented behavior and add application-specific checks for domain rules.

Patterns use regular-expression syntax, which can vary subtly across runtimes. A pattern usually constrains text by searching for a match unless anchored explicitly. When exact whole-string matching matters, include appropriate start and end anchors and test examples in the target implementation.

## Required, optional, and null are different

A property omitted from required is optional, but that does not mean it can be null. If it appears, its schema still applies. To permit null, the type or schema must explicitly allow it. Similarly, an absent array differs from an empty array, and an empty string differs from a missing string field.

These distinctions often affect update APIs. A missing property can mean “leave unchanged”; null can mean “clear”; an empty list can mean “replace with no items.” A schema should reflect the intended contract instead of collapsing all cases into a generic optional label.

## References and advanced features

JSON Schema includes references, composition keywords such as allOf, anyOf, and oneOf, conditional rules, dependent properties, unevaluated properties, and vocabularies. These features support reusable schemas and complex contracts, but they require a validator that implements the relevant dialect and semantics. A basic tool that checks a few keywords cannot validate these cases just because it accepts the surrounding JSON syntax.

References can also raise deployment questions. A validator may need to resolve another schema document, and an external reference can introduce network or trust considerations. Production applications should define which references are allowed, package dependencies predictably, and avoid fetching arbitrary schemas from user-controlled URLs.

## Validate representative instances

Test a schema with examples that should pass and examples that should fail. Include missing required fields, null values, wrong types, boundary values, Unicode strings, arrays with zero and multiple entries, and additional properties. A single happy-path sample will not reveal whether a constraint is too loose or too strict.

When a schema changes, check backward compatibility. Making an optional property required can reject existing records. Tightening an enum can reject a value that older producers still send. Removing a property can break a client even when new data validates. Treat the schema as versioned interface documentation and review changes with producers and consumers.

## Schema generation is a starting point

A generated schema is inferred from observed data, not discovered from every valid instance. One example cannot reveal optional fields, alternate array item types, or rare values. Review generated required lists, ranges, formats, and additional-property behavior before adopting the result. The [JSON Schema Generator](../../../tools/json/schema-generator/) marks observed object fields as required for its sample, so optionality needs human review.

For a stable contract, write or refine the schema alongside application tests. Keep representative fixtures and validate them using the same implementation and draft used in production. Online tools are convenient for exploration, but production behavior should be covered by automated tests in the application's runtime.

## Conclusion

JSON Schema adds explicit shape constraints beyond parsing. Identify the draft, know what the validator actually implements, and test both passing and failing examples. Distinguish absent values from null, and use application code for rules that the schema does not express or the chosen validator does not support.

## Test schemas as executable contracts

Keep positive and negative fixtures beside the schema. A positive fixture proves an intended example remains accepted; a negative fixture proves a rule still rejects the value it was written to prevent. Include boundary values such as the minimum and maximum number, strings at the permitted length, missing required properties, and arrays with an invalid item. These tests make a schema change reviewable and catch accidental weakening of constraints.

Schema validation should be versioned with the application that consumes it. If two services use different drafts or validator defaults, a document can pass in one environment and fail in another. Record the draft, library version, and enabled vocabularies in the build documentation. For external inputs, keep runtime validation in place even when static type declarations were generated from the same schema.

