---
title: "How to Handle Comments in JSON Files"
description: "JSON does not include comments. Learn portable alternatives, how JSON-like dialects differ, and how to review comment removal safely."
primaryKeyword: "json comments"
secondaryKeywords: ["json comments helper", "json formatter", "json parser"]
published: "2026-10-15"
updated: "2026-10-15"
relatedTools: ["comments-helper", "validator", "fixer"]
relatedArticles: ["json-validator-guide", "json-formatter-guide", "json-parser-guide"]
---

Standard JSON does not define comments. A line beginning with two slashes or a block between slash-star markers is not valid JSON syntax. Some editors, configuration tools, and language libraries accept comments as an extension, but that does not make the resulting file portable to every JSON parser. If data must be exchanged as standard JSON, remove comments deliberately or store the explanation outside the document.

## Why comments fail in strict JSON

JSON is intended as a small data interchange format with a defined set of values and delimiters. Its grammar does not include comment tokens. A strict parser that encounters a slash where it expects a property name, comma, value, or closing delimiter reports an error.

For example, this comment makes the following object invalid to a standard JSON parser:

    {
      // The account used by the importer
      "account": "demo"
    }

A parser designed for a particular JSON-with-comments dialect may accept it. That behavior is specific to that implementation. A file that works in one editor can fail in a web API, a standard library parser, or an older tool. Confirm the exact format expected by the consumer before relying on an extension.

## Portable ways to document data

The safest option is often to put explanation in a README or a companion document. That keeps the JSON payload valid and separates human documentation from values consumed by applications.

Some systems allow metadata fields such as "_comment" or "description". Use those only when the receiving schema permits them. Adding an undocumented property can break a strict consumer, so do not treat a comment-shaped field as universally safe.

Configuration formats designed for comments may be a better fit if people frequently edit the file. YAML and TOML are common alternatives, but converting to another format changes syntax and can change type-inference behavior. Confirm the target parser and test the converted file before replacing a JSON contract. The [JSON vs YAML guide](json-vs-yaml/) discusses when that trade-off makes sense.

## Removing comments without damaging strings

Removing comments with a broad regular expression is risky. A JSON string can contain text that looks like comment syntax, such as a URL with two slashes or a note that mentions a slash-star sequence. A regular expression may delete those characters even though they are data.

A safer scanner tracks whether it is inside a quoted string and whether the previous character escapes the current character. It recognizes comment markers only outside strings. A conservative suggestion can replace comment characters with spaces while preserving newline positions, which helps keep parser line numbers stable. The result still needs to be parsed and reviewed.

The [JSON Comments Helper](../../../tools/json/comments-helper/) creates a preview for standard line and block comments. It does not modify the original input. If the comments are unclosed or removing them still leaves invalid syntax, the tool reports that rather than claiming a repair succeeded. Review the before and after text, especially where comments sit between values.

Comment removal can expose a different syntax problem. For example, a comment may have been used in place of a missing comma or may sit between tokens that need separation. Replacing a comment with whitespace preserves token boundaries better than deleting it, but it cannot infer the author's intended punctuation. A successful parse is necessary, not sufficient: confirm that the data values still match the original intent.

## JSON-with-comments dialects

Some development tools allow comments in configuration files and strip them before parsing. Others support comments plus trailing commas. Their accepted syntax, error reporting, and version compatibility vary. If a file belongs to a specific tool, consult that tool's documentation and use its parser in tests. Do not label a file simply “JSON” if its actual format includes extensions; name the dialect clearly.

Comments are not retained as ordinary JSON object values. A parser that accepts them generally removes or ignores the comment text. If you parse and rewrite the document with a standard serializer, the comments disappear. A text-preserving editor or concrete syntax tree may be required if comments must survive changes.

## Preserve meaning when commenting out a value

A comment is sometimes used to disable a property temporarily. In JSON, commenting out one property also interacts with commas. Removing the line may leave a trailing comma or may require moving a separator. Do not automate that edit without checking the resulting object.

If the property should remain available but be disabled, a schema may support an explicit enabled flag. Otherwise, keep an unmodified copy or use a configuration language that supports comments. A commented-out value in a separate README may be clearer than a value hidden in a non-portable dialect.

## Test the actual consumer

The consumer's parser is the authority for compatibility. If a configuration file is loaded by a specific program, validate it with that program or its maintained parser. A generic online JSON validator will correctly reject comments under strict JSON grammar, even when the target application has a documented extension.

Do not silently strip comments from user data in a production pipeline. If a conversion step is required, name it, make it reproducible, and test that it does not change string values or remove meaningful content. Keep source and generated output separate when both are needed.

## Conclusion

For portable JSON, keep comments outside the data or use a documented metadata field supported by the schema. If the consumer accepts a JSON-like dialect, treat it as a specific format and test with that consumer. When removing comments, parse-aware scanning and review protect strings better than a global replacement, but the result still needs validation.

## Remove comments only with a parser-aware method

The [JSON Comments Helper](../../../tools/json/comments-helper/) can mask comment syntax for inspection, but every stripping routine needs to recognize whether slash characters occur inside a quoted string. A URL such as `https://example.org/a` contains two slashes that are data, not a comment. Escaped quotes also affect where strings end. A regular expression that works on a simple sample can corrupt a real document.

After removing an extension, parse the result with a strict JSON parser and compare important values with the source dialect. Keep a copy of the original and show the user the transformation. If the target application supports the same comment syntax, validate using that application's parser instead of converting unnecessarily.

Keep an example of the exact dialect in the project's documentation and run its parser in automated checks. New contributors may otherwise add comments because their editor colors them, not realizing that a deployment tool reads strict JSON. A quick local check before commit catches the mismatch without depending on an online service or a reviewer noticing a single slash.


