#!/usr/bin/env python3
"""Create the complete MagnaMath handoff ZIP, source manifest, and checksum.

Usage:
  python3 scripts/package-release.py /absolute/or/relative/output.zip

The archive uses a stable root folder and fixed ZIP timestamps. Dependency caches,
Git metadata, and transient Python files are excluded. The source manifest is
regenerated before packaging and covers every distributed file except itself.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys
import zipfile

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FIXED_ZIP_TIME = (2026, 8, 10, 0, 0, 0)
ARCHIVE_ROOT = "MagnaMath-Rebuilt"
EXCLUDED_PARTS = {".git", "node_modules", "__pycache__", ".pytest_cache"}
EXCLUDED_NAMES = {".DS_Store", "MANIFEST.sha256"}


def included_files() -> list[Path]:
    files: list[Path] = []
    for path in PROJECT_ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(PROJECT_ROOT)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if relative.name in EXCLUDED_NAMES:
            continue
        if relative.suffix == ".pyc":
            continue
        files.append(path)
    return sorted(files, key=lambda path: path.relative_to(PROJECT_ROOT).as_posix())


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def write_manifest(files: list[Path]) -> Path:
    manifest = PROJECT_ROOT / "MANIFEST.sha256"
    rows = [
        f"{digest(path)}  {path.relative_to(PROJECT_ROOT).as_posix()}"
        for path in files
    ]
    manifest.write_text("\n".join(rows) + "\n", encoding="utf-8")
    return manifest


def add_file(archive: zipfile.ZipFile, path: Path) -> None:
    relative = path.relative_to(PROJECT_ROOT).as_posix()
    info = zipfile.ZipInfo(f"{ARCHIVE_ROOT}/{relative}", FIXED_ZIP_TIME)
    mode = path.stat().st_mode
    permissions = 0o755 if mode & 0o111 else 0o644
    info.external_attr = (permissions & 0xFFFF) << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def main() -> None:
    package = json.loads((PROJECT_ROOT / "package.json").read_text(encoding="utf-8"))
    default_name = f"MagnaMath-Rebuilt-{package['version']}-Full-Handoff.zip"
    output = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else PROJECT_ROOT.parent / default_name
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    files = included_files()
    manifest = write_manifest(files)
    distributed = sorted(files + [manifest], key=lambda path: path.relative_to(PROJECT_ROOT).as_posix())

    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.unlink(missing_ok=True)
    output.unlink(missing_ok=True)

    with zipfile.ZipFile(temporary, "w", allowZip64=True) as archive:
        for path in distributed:
            add_file(archive, path)
    os.replace(temporary, output)

    checksum = digest(output)
    checksum_path = Path(str(output) + ".sha256")
    checksum_path.write_text(f"{checksum}  {output.name}\n", encoding="utf-8")

    with zipfile.ZipFile(output, "r") as archive:
        bad = archive.testzip()
        if bad is not None:
            raise RuntimeError(f"Archive integrity failure: {bad}")
        names = archive.namelist()

    print(json.dumps({
        "output": str(output),
        "checksum": checksum,
        "checksumFile": str(checksum_path),
        "distributedFiles": len(distributed),
        "archiveEntries": len(names),
        "bytes": output.stat().st_size,
    }, indent=2))


if __name__ == "__main__":
    main()
