#!/usr/bin/env python3

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.utils.model_catalog import (
    FRONTEND_GENERATED_MODEL_CATALOG_PATH,
    GENERATED_MODEL_CATALOG_PATH,
    build_catalog_validation_report,
)


def _format_surface_summary(surface_summary):
    lines = []
    for surface, groups in surface_summary.items():
        counts = ", ".join(
            f"{group}={len(model_ids)}"
            for group, model_ids in groups.items()
        )
        lines.append(f"- {surface}: {counts}")
    return lines


def main() -> int:
    report = build_catalog_validation_report()

    status = "PASSED" if report.ok else "FAILED"
    print(f"Model catalog validation {status}")
    print(f"- backend artifact: {GENERATED_MODEL_CATALOG_PATH}")
    print(f"- frontend artifact: {FRONTEND_GENERATED_MODEL_CATALOG_PATH}")
    print(f"- families: {report.stats['families']}")
    print(f"- models: {report.stats['models']}")
    print(f"- visible models: {report.stats['visible_models']}")
    print(f"- defaults: {report.stats['defaults']}")
    print("- visible model counts by surface:")
    for line in _format_surface_summary(report.stats["surface_summary"]):
        print(f"  {line}")

    hidden_models = report.stats.get("hidden_models", [])
    planned_models = report.stats.get("planned_models", [])
    if hidden_models:
        print(f"- hidden models: {', '.join(hidden_models)}")
    if planned_models:
        print(f"- planned models: {', '.join(planned_models)}")

    # Phase 2: canonical metadata summary
    print(f"- model lines: {report.stats.get('model_lines', 0)}")
    print(f"- canonical modes: {report.stats.get('canonical_modes', 0)}")
    print(f"- legacy aliases: {report.stats.get('legacy_aliases', 0)}")
    canonical_defaults = report.stats.get("canonical_defaults", {})
    if canonical_defaults:
        print(f"- canonical defaults: {canonical_defaults}")

    if report.warnings:
        print("Warnings:")
        for warning in report.warnings:
            print(f"- {warning}")

    if report.errors:
        print("Errors:")
        for error in report.errors:
            print(f"- {error}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
