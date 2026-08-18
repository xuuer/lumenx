#!/usr/bin/env python3

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.utils.model_catalog import (
    FRONTEND_GENERATED_MODEL_CATALOG_PATH,
    GENERATED_MODEL_CATALOG_PATH,
    MODEL_CATALOG_SCHEMA_PATH,
    write_catalog_schema,
    write_frontend_generated_catalog,
    write_generated_catalog,
)


def main() -> None:
    write_generated_catalog(GENERATED_MODEL_CATALOG_PATH)
    write_frontend_generated_catalog(FRONTEND_GENERATED_MODEL_CATALOG_PATH)
    write_catalog_schema(MODEL_CATALOG_SCHEMA_PATH)
    print(f"Wrote catalog JSON to {GENERATED_MODEL_CATALOG_PATH}")
    print(f"Wrote frontend catalog JSON to {FRONTEND_GENERATED_MODEL_CATALOG_PATH}")
    print(f"Wrote catalog schema to {MODEL_CATALOG_SCHEMA_PATH}")
    print("Next step: python scripts/validate_model_catalog.py")


if __name__ == "__main__":
    main()
