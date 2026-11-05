#!/usr/bin/env python3
"""Optional full JSON Schema validation for release artifacts.

Requires Python package jsonschema>=4. It is not part of npm validate:all so the
JavaScript project remains runnable without a Python environment.
"""
from __future__ import annotations

import json
import pathlib
import sys
from jsonschema import FormatChecker, validators
from referencing import Registry, Resource

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "schemas"
EXAMPLES_DIR = ROOT / "examples"

schemas = {}
for path in sorted(SCHEMA_DIR.glob("*.json")):
    document = json.loads(path.read_text())
    validators.validator_for(document).check_schema(document)
    schemas[document["$id"]] = document

registry = Registry().with_resources((schema_id, Resource.from_contents(schema)) for schema_id, schema in schemas.items())

artifacts = []
for path in sorted(EXAMPLES_DIR.rglob("*.json")):
    document = json.loads(path.read_text())
    schema_id = document.get("schema")
    if schema_id in schemas:
        artifacts.append((path, document, schemas[schema_id]))

failures = []
for path, document, schema in artifacts:
    validator_class = validators.validator_for(schema)
    validator = validator_class(
        schema,
        registry=registry,
        format_checker=FormatChecker(),
    )
    errors = sorted(validator.iter_errors(document), key=lambda error: list(error.absolute_path))
    if errors:
        for error in errors:
            location = "/".join(str(part) for part in error.absolute_path) or "<root>"
            failures.append(f"{path.relative_to(ROOT)}:{location}: {error.message}")

if failures:
    print("JSON Schema validation failed:", file=sys.stderr)
    for failure in failures:
        print(f"- {failure}", file=sys.stderr)
    raise SystemExit(1)

print(f"Compiled {len(schemas)} schemas and validated {len(artifacts)} example artifacts.")
