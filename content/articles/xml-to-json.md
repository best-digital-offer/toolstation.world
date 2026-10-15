---
title: "How to Convert XML to JSON"
description: "Understand how XML elements, attributes, text, namespaces, and repeated nodes map to JSON, and validate conversion decisions before relying on output."
primaryKeyword: "XML to JSON"
secondaryKeywords: ["convert XML to JSON", "XML JSON converter", "XML attributes JSON"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["xml-to-json", "formatter", "validator"]
relatedArticles: ["json-arrays-objects", "json-parser-guide", "json-to-csv"]
---

Converting XML to JSON requires a mapping because the formats have different data models. XML has elements, attributes, namespaces, text nodes, comments, and mixed content; JSON has objects, arrays, strings, numbers, booleans, and null. There is no universally correct conversion for every XML document. Define how your converter handles attributes, repeated child elements, text, and namespaces, then validate the result against the consuming application's expectations. The [XML to JSON tool](../../../tools/json/xml-to-json/) provides a local, documented subset conversion.

## Start with an XML document tree

XML is markup organized as a tree. An element has a name, may have attributes, and can contain child elements or text. A basic document might be:

    <book id="b17"><title>Data Design</title><pages>240</pages></book>

A converter could represent it as an object with a `book` property, an `@id` field for the attribute, and child properties for title and pages. But that convention is a design choice. Another library might store attributes in a separate object or use a prefix. JSON consumers need to know the chosen convention.

Repeated elements often map naturally to arrays. Two `<author>` children might become an `author` array even though one author could appear as a single object in another file. A converter should preferably use a consistent policy so the result's type does not unexpectedly change between one and several occurrences. If downstream code depends on an array, normalize singleton values at conversion time.

## Attributes, text, and mixed content

Attributes belong to the start tag; child elements create nested structure. XML can include both at once. A convention such as prefixing attribute names with `@` can prevent them from colliding with child element names, but it remains a convention and may conflict with a real name unless escaping rules are defined.

Text content is also complex. Whitespace can be meaningful in a document, or it can be formatting indentation between child nodes. A converter must decide whether to trim it, preserve it, or discard whitespace-only nodes. If an element contains text and child elements, that is mixed content. Collapsing the text into one property may lose its original order relative to children. For a format where that order is significant, a sequence of typed node records may preserve more information than a simple object.

Comments and processing instructions have no native JSON equivalent. If they carry useful operational context, retain them separately or use a conversion format that explicitly represents such nodes. A normal data conversion generally drops them. XML declarations and document type information also need a policy; they are not ordinary business values.

## Namespaces and names

XML namespaces distinguish names that may look identical but have different identities. A prefix is only an alias for a namespace URI. If a conversion drops namespace information or keeps only the prefix, it may merge elements that should be distinct. For interoperability, preserve namespace URIs or use a documented canonical naming scheme. Test documents containing default namespaces as well as prefixed names.

Element names can include characters that do not map comfortably to application property names. JSON permits any string as an object key, but code generators and property access may impose additional restrictions. Keep the original XML name or provide a reversible escaping scheme rather than silently normalizing names into collisions.

## Types and repeated shapes

XML text content is text by default. The string `240` is not automatically a JSON number unless a schema or conversion rule says it represents a numeric value. The word `true` is not necessarily a boolean. Inferring types from appearance can change identifiers such as `0017`, which may need to preserve leading zeroes. Use an XML Schema or explicit mapping rules when data types matter.

Empty elements are another decision point. `<note/>` can mean an empty string, an empty object, or simply a present element with no text. It is not automatically equivalent to a missing JSON property or null. Choose based on the source contract and preserve enough context for the consumer to distinguish relevant states.

## Security when parsing XML

XML parsers have security-sensitive features. External entity resolution and document type declarations can cause file or network access in some parser configurations. Do not parse untrusted XML with permissive settings. Use a maintained parser configured to disable external entities and unnecessary document type processing. In a browser, a DOM parser has platform-defined behavior, but the calling application still needs to check parser errors and decide how to handle declarations.

This site's lightweight browser converter rejects documents containing a DOCTYPE and uses DOM parsing for a constrained transformation. That is not a claim that it implements every XML feature or replaces a hardened server-side XML pipeline. Avoid pasting confidential XML into any online service unless its privacy and processing behavior meet your requirements. Local browser execution reduces transmission for this page but does not remove the need to treat input as untrusted.

## Validate a conversion

Test representative source documents: no repeated nodes, one occurrence, several occurrences, attributes, nested namespaces, empty tags, Unicode, mixed content, and significant whitespace. Compare the converted output with the source semantically, not just visually. Then validate the JSON syntax and any destination schema.

If the data will be converted again, a round-trip test can reveal lost information: convert XML to JSON and back, then compare relevant structure. A byte-for-byte comparison is usually unrealistic because formatting and namespace prefixes may change, but important values and ordering should remain as required by the application. Record intentional losses such as comments or attribute ordering.

## Conclusion

XML-to-JSON conversion is a mapping decision, not punctuation replacement. Document conventions for attributes, repeated elements, namespaces, text, and empty nodes. Protect the parser, test real variations, and validate the generated data with the destination schema before using it in an API or production workflow.

## Preserve order when the application needs it

XML children occur in document order. JSON arrays preserve sequence, but JSON object properties should not encode an ordered list of repeated children. A converter that groups children by name can lose their original interleaving. If the source contains significant mixed ordering, use an array of node records or another explicit sequence representation.

Before selecting a simple object mapping, inspect whether the source depends on order for paragraphs, mixed content, or repeated commands. Document that order is preserved or intentionally ignored. This decision is easy to miss in a small example where each child name appears only once.

