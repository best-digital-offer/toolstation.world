---
title: "How to Convert JSON to TypeScript Interfaces"
description: "Infer TypeScript types from JSON samples, distinguish optional from nullable fields, and understand why generated declarations need review."
primaryKeyword: "JSON to TypeScript"
secondaryKeywords: ["JSON TypeScript interface", "generate TypeScript types from JSON", "JSON type generator"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["typescript", "schema-generator", "validator"]
relatedArticles: ["generate-json-schema", "json-arrays-objects", "json-validator-guide"]
---

Converting JSON to TypeScript means inspecting JSON values and producing type declarations that describe the observed shapes. A generator can infer that a property is a string, number, boolean, object, or array, but one sample cannot reveal every valid value. Review generated declarations for optional fields, nullability, unions, numeric limits, and application semantics. Use the [JSON to TypeScript tool](../../../tools/json/to-typescript/) as a starting point and confirm the types against the actual API contract.

## What can be inferred from a sample

Given an object such as `{"id":"u-17","active":true,"score":8}`, a generator can infer a TypeScript type with string, boolean, and number properties. Nested objects can become named interfaces or inline object types. An array's item type can be inferred from its observed items. These are structural observations, not proof that the producer always follows the sample.

Names need to be generated for nested anonymous shapes. A generator may derive a child interface name from the property path or produce an inline type. It must sanitize names that are not valid identifiers and guard against collisions. The resulting type can use quoted property keys when a JSON key contains spaces or punctuation.

An empty array provides no item examples, so its type is ambiguous. A generator might use `unknown[]`, `never[]`, or a placeholder requiring user review. It should not invent a specific item type. Likewise, a property whose sample value is null does not reveal its non-null alternatives. Additional representative samples are necessary.

## Optional and nullable are not the same

An optional property may be missing: `name?: string`. A nullable property is present but can have a null value: `name: string | null`. These states are different. A single JSON sample cannot establish which one applies across all records. If a batch includes mixed records, one can observe a key missing from some objects and mark it optional, but the sample still may not cover future responses.

In TypeScript, compiler settings affect how optional properties and null checks are enforced. A generated interface should match the project's configuration and runtime validation strategy. Types disappear at runtime; a TypeScript declaration does not parse incoming JSON or guarantee that external data obeys the declared shape.

For a stable API, use the documented response schema as the source of truth. Generated types should be checked into the project or regenerated in a controlled build, with changes reviewed like code. Avoid generating declarations from one transient production response and treating them as a complete contract.

## Arrays, unions, and numeric types

If an array contains objects with different properties, the generator must determine whether they are variants of a union or inconsistent examples of one type. For example, a payment may be a card record or a bank transfer record, each with different required fields. A broad optional-property interface may compile but hide an important discriminant. A tagged union with a property such as `kind` is often more accurate when the API supplies one.

JSON has one numeric grammar, while TypeScript generally represents parsed JavaScript numbers with `number`. It does not distinguish integer and decimal types. JavaScript numbers also cannot exactly represent every large integer. If an API returns exact identifiers or high-precision decimal values, a string type plus explicit parser may be safer than a plain `number` declaration.

Tuples can preserve fixed-length array structure, but JSON samples rarely prove that an array always has the same length or positional meaning. Do not infer a tuple merely because the example contains two items. Use an array type unless the contract defines positions, or review the generated type manually.

## Example and runtime validation

A generated interface could describe a user response like this:

    interface User {
      id: string;
      active: boolean;
      profile?: {
        displayName: string;
      } | null;
    }

The optional and nullable choices need to reflect real producer behavior. The interface can help application code, but after receiving JSON you need a runtime check if the input is untrusted or versioned independently. A parser confirms JSON syntax. A schema validator or hand-written type guard checks business shape. Type assertions such as `JSON.parse(text) as User` only tell the compiler to trust the programmer; they do not inspect the value.

For robust data ingestion, parse into `unknown`, validate it, then narrow the type. Runtime validation can check required properties, allowed values, array elements, and invariants. Keep tests for missing fields, null values, unexpected extra properties, wrong types, and API version changes. A generated declaration and a runtime validator solve related but different problems.

## Review checklist for generated types

Check that property names retain their original spelling and that reserved words or unusual characters are safely represented. Review nested interface names for collisions and confirm arrays received the intended item type. Look for `any`; it removes compile-time checking and often hides uncertainty. `unknown` communicates uncertainty more honestly and forces consumers to narrow the value.

Check whether all observed sample records were combined. A tool given one object may mark every property required because each appears in that one sample, while the real endpoint returns sparse variants. Add examples from different cases or describe the API manually. Consider version-specific response structures and discriminator fields.

Finally, run the project's TypeScript compiler and tests. Generated syntax can be valid but inconsistent with lint rules, strict null checks, naming conventions, or the runtime model. Keep a clear record of how the declaration was produced so another developer can reproduce it.

## Conclusion

JSON samples can reveal structural hints but cannot establish all valid data. Treat generated TypeScript as a draft, review optionality and nullability, and add runtime validation at untrusted boundaries. For production contracts, prefer an authoritative schema or API definition supplemented by representative fixtures and tests.

## Use unknown at untrusted boundaries

The type `unknown` is useful when parsing because the compiler requires code to inspect the value before using it. By contrast, `any` disables many checks and can let a bad assumption spread. A type guard can check that a value is a non-null object, that a property exists, and that its value has the expected primitive type. Complex rules are often clearer in a schema validator.

Avoid treating a generated interface as a parser. A response can change at runtime while old declarations continue to compile. Validate at the boundary, convert into a trusted internal model, and keep the rest of the application insulated from raw payload quirks.


