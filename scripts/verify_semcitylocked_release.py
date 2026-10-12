#!/usr/bin/env python3
"""Verify the exact MatchCityLoc SemCityLockeD models and annotations."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


EXPECTED_SHA256 = {
    "GT_pose.txt": "4a357210b28c4b3e94ede75a95c880b261ad2fb7e520dfe883c0aa3df872044f",
    "GPS_pose_add_error.txt": "7b7df3ab893c7a593d98f386d611c7129b76b486b8a795af0bd8aa41acdb0b05",
    "intrinsic.txt": "313875b40539c5dcae44f3f3b84c00671273d42d161a7ae43db46c46ec39f679",
    "model/TUM_CC_lod1.obj": "f2b0354e493bffbff5cf6d5f26e170b46b169ccc96ad92f37817d0d3d597f9a9",
    "model/TUM_CC_lod2.obj": "9000168790677a24283959546a55344a1667b67e10e16c70a93dcf0fadcdc6f8",
    "model/TUM_CC_lod3.obj": "8aa9cb0c62bf68c03894bee6eba732e111059656bc37aac01927e1b2b47d466b",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "root",
        nargs="?",
        type=Path,
        default=Path("data/SemCityLockeD"),
        help="Prepared SemCityLockeD directory (default: data/SemCityLockeD)",
    )
    args = parser.parse_args()

    failures = []
    for relative, expected in EXPECTED_SHA256.items():
        path = args.root / relative
        if not path.is_file():
            failures.append(f"missing: {path}")
            continue
        actual = sha256(path)
        if actual != expected:
            failures.append(f"checksum mismatch: {path}\n  expected {expected}\n  actual   {actual}")
        else:
            print(f"OK  {relative}")

    if failures:
        raise SystemExit("\n".join(failures))
    print("SemCityLockeD models and 937-frame paper annotations: verified")


if __name__ == "__main__":
    main()
