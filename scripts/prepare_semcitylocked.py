#!/usr/bin/env python3
"""Download and prepare SemCityLockeD in MatchCityLoc's expected layout.

The default mode creates a runnable *approximate public-data* version by
undistorting the public DJI captures with their embedded factory calibration.
It does not reproduce the exact rectified JPEGs used by the paper.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
from pathlib import Path

import cv2
import numpy as np
from huggingface_hub import snapshot_download
from PIL import Image
from tqdm import tqdm

try:
    from verify_semcitylocked_release import EXPECTED_SHA256, sha256
except ModuleNotFoundError:  # Support `python -m scripts.prepare_semcitylocked`.
    from scripts.verify_semcitylocked_release import EXPECTED_SHA256, sha256


REPO_ID = "DevinEaston/SemCityLockeD"
REVISION = "26622132a6a480ccb7b0ef938cf064d7c5ed56d0"
PAPER_SIZE = (5644, 4082)
PUBLIC_SIZE = (5280, 3956)
DEWARP_RE = re.compile(rb'drone-dji:DewarpData="([^"]+)"')


def paper_names(annotation: Path) -> list[str]:
    names = [line.split()[0] for line in annotation.read_text().splitlines() if line.strip()]
    if len(names) != 937 or len(set(names)) != 937:
        raise RuntimeError(f"Expected 937 unique paper frames in {annotation}, found {len(set(names))}")
    return names


def link_or_copy(source: Path, target: Path, force: bool = False) -> None:
    # Hugging Face snapshots contain relative symlinks into their blob cache.
    # Link the file itself, not a symlink that would break in the new directory.
    source = source.resolve(strict=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() or target.is_symlink():
        if not force:
            if not target.is_file():
                raise RuntimeError(
                    f"Existing target is not a readable file: {target}. "
                    "Use a new preparation directory to preserve existing files."
                )
            return
        target.unlink()
    try:
        os.link(source, target)
    except OSError:
        shutil.copy2(source, target)


def download_source(names: list[str], include_images: bool) -> Path:
    patterns = ["LoD_model/TUM_CC_lod1.obj", "LoD_model/TUM_CC_lod2.obj", "LoD_model/TUM_CC_lod3.obj"]
    if include_images:
        patterns.extend(f"original_images/{name}" for name in names)
    print(f"Downloading pinned SemCityLockeD revision {REVISION} ...")
    return Path(
        snapshot_download(
            repo_id=REPO_ID,
            repo_type="dataset",
            revision=REVISION,
            allow_patterns=patterns,
        )
    )


def parse_intrinsics(path: Path) -> dict[str, tuple[int, int, float, float, float, float]]:
    result = {}
    for line in path.read_text().splitlines():
        fields = line.split()
        if not fields:
            continue
        name, model, width, height, fx, fy, cx, cy = fields
        if model != "PINHOLE":
            raise RuntimeError(f"Unsupported paper camera model {model!r} for {name}")
        result[name] = (int(width), int(height), float(fx), float(fy), float(cx), float(cy))
    return result


def dji_calibration(path: Path, width: int, height: int) -> tuple[np.ndarray, np.ndarray]:
    match = DEWARP_RE.search(path.read_bytes())
    if not match:
        raise RuntimeError(f"DJI DewarpData is missing from {path}")
    payload = match.group(1).decode("ascii")
    values = [float(value) for value in payload.split(";", 1)[1].split(",")]
    if len(values) != 9:
        raise RuntimeError(f"Expected 9 DJI calibration values in {path}, found {len(values)}")
    fx, fy, offset_x, offset_y, k1, k2, p1, p2, k3 = values
    camera = np.array(
        [[fx, 0.0, width / 2.0 + offset_x], [0.0, fy, height / 2.0 + offset_y], [0.0, 0.0, 1.0]],
        dtype=np.float64,
    )
    distortion = np.array([k1, k2, p1, p2, k3], dtype=np.float64)
    return camera, distortion


def approximate_rectification(
    raw_dir: Path,
    query_dir: Path,
    names: list[str],
    intrinsics_path: Path,
    force: bool,
) -> None:
    intrinsics = parse_intrinsics(intrinsics_path)
    query_dir.mkdir(parents=True, exist_ok=True)
    map_cache: dict[tuple[float, ...], tuple[np.ndarray, np.ndarray]] = {}

    for name in tqdm(names, desc="Rectifying public images", unit="image"):
        source = raw_dir / name
        target = query_dir / name
        if target.is_file() and not force:
            with Image.open(target) as image:
                if image.size == PAPER_SIZE:
                    continue

        image = cv2.imread(str(source), cv2.IMREAD_COLOR)
        if image is None:
            raise RuntimeError(f"Cannot read {source}")
        height, width = image.shape[:2]
        if (width, height) != PUBLIC_SIZE:
            raise RuntimeError(f"Unexpected public image size for {name}: {width}x{height}")

        out_width, out_height, fx, fy, cx, cy = intrinsics[name]
        camera, distortion = dji_calibration(source, width, height)
        output_camera = np.array([[fx, 0.0, cx], [0.0, fy, cy], [0.0, 0.0, 1.0]], dtype=np.float64)
        key = tuple(camera.ravel()) + tuple(distortion) + tuple(output_camera.ravel()) + (out_width, out_height)
        maps = map_cache.get(key)
        if maps is None:
            maps = cv2.initUndistortRectifyMap(
                camera, distortion, None, output_camera, (out_width, out_height), cv2.CV_16SC2
            )
            map_cache[key] = maps
        rectified = cv2.remap(image, maps[0], maps[1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        temporary = target.with_suffix(".tmp.jpg")
        if not cv2.imwrite(str(temporary), rectified, [cv2.IMWRITE_JPEG_QUALITY, 95]):
            raise RuntimeError(f"Failed to write {temporary}")
        temporary.replace(target)


def validate_images(directory: Path, names: list[str], expected_size: tuple[int, int]) -> None:
    missing = [name for name in names if not (directory / name).is_file()]
    if missing:
        sample = ", ".join(missing[:3])
        raise RuntimeError(f"Missing {len(missing)} required images in {directory}; first: {sample}")
    for name in tqdm(names, desc=f"Validating {directory.name}", unit="image"):
        with Image.open(directory / name) as image:
            if image.size != expected_size:
                raise RuntimeError(
                    f"Unexpected size for {directory / name}: {image.size[0]}x{image.size[1]}, "
                    f"expected {expected_size[0]}x{expected_size[1]}"
                )


def verify_assets(root: Path) -> None:
    failures = []
    for relative, expected in EXPECTED_SHA256.items():
        path = root / relative
        if not path.is_file():
            failures.append(f"missing: {path}")
        elif (actual := sha256(path)) != expected:
            failures.append(f"checksum mismatch: {path}\n  expected {expected}\n  actual   {actual}")
    if failures:
        raise RuntimeError("\n".join(failures))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path("data/SemCityLockeD"))
    parser.add_argument(
        "--image-mode",
        choices=("approximate", "exact", "raw-only"),
        default="approximate",
        help="approximate: runnable public-data conversion (default); exact: use --rectified-images; raw-only: no Query_image",
    )
    parser.add_argument("--rectified-images", type=Path, help="directory containing the exact 937 paper JPEGs")
    parser.add_argument("--source-dir", type=Path, help="already-downloaded Hugging Face repository tree")
    parser.add_argument("--force", action="store_true", help="replace existing prepared files")
    args = parser.parse_args()

    if args.image_mode == "exact" and args.rectified_images is None:
        parser.error("--image-mode exact requires --rectified-images DIR")
    if args.image_mode != "exact" and args.rectified_images is not None:
        parser.error("--rectified-images is only valid with --image-mode exact")

    repo_root = Path(__file__).resolve().parents[1]
    annotations = repo_root / "datasets" / "SemCityLockeD"
    names = paper_names(annotations / "GT_pose.txt")
    root = args.root.resolve()
    root.mkdir(parents=True, exist_ok=True)

    provenance_path = root / "PREPARATION.json"
    query_dir = root / "Query_image"
    if args.image_mode == "approximate" and query_dir.is_dir() and any(query_dir.iterdir()) and not args.force:
        previous_mode = None
        if provenance_path.is_file():
            previous_mode = json.loads(provenance_path.read_text()).get("image_mode")
        if previous_mode != "approximate":
            raise RuntimeError(
                f"{query_dir} already contains images not marked as an approximate preparation. "
                "Use a different target or pass --force to replace them."
            )

    for filename in ("GT_pose.txt", "GPS_pose_add_error.txt", "intrinsic.txt"):
        link_or_copy(annotations / filename, root / filename, args.force)

    include_public = args.image_mode in {"approximate", "raw-only"}
    source = args.source_dir.resolve() if args.source_dir else download_source(names, include_public)
    model_dir = root / "model"
    for lod in (1, 2, 3):
        filename = f"TUM_CC_lod{lod}.obj"
        link_or_copy(source / "LoD_model" / filename, model_dir / filename, args.force)

    if include_public:
        raw_dir = root / "raw_images"
        for name in tqdm(names, desc="Arranging public images", unit="image"):
            link_or_copy(source / "original_images" / name, raw_dir / name, args.force)
        validate_images(raw_dir, names, PUBLIC_SIZE)

    exact = args.image_mode == "exact"
    if exact:
        for name in tqdm(names, desc="Arranging exact paper images", unit="image"):
            source_image = args.rectified_images.resolve() / name
            target_image = query_dir / name
            if target_image.exists() and not args.force:
                try:
                    if source_image.samefile(target_image):
                        continue
                except FileNotFoundError:
                    pass
                raise RuntimeError(
                    f"Refusing to label existing image as exact without replacing it: {target_image}. "
                    "Use a new target or pass --force."
                )
            link_or_copy(source_image, target_image, True)
        validate_images(query_dir, names, PAPER_SIZE)
    elif args.image_mode == "approximate":
        print("WARNING: creating runnable approximate images from DJI factory calibration.")
        print("These images must not be used to claim exact reproduction of the paper results.")
        approximate_rectification(root / "raw_images", root / "Query_image", names, root / "intrinsic.txt", args.force)
        validate_images(root / "Query_image", names, PAPER_SIZE)

    verify_assets(root)
    provenance = {
        "dataset": REPO_ID,
        "revision": REVISION,
        "paper_frames": len(names),
        "image_mode": args.image_mode,
        "exact_paper_images": exact,
    }
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n")

    print(f"\nSemCityLockeD prepared at {root}")
    print("Models and annotations: exact and checksum-verified")
    if exact:
        print("Query images: exact dimensions; supplied images were validated")
    elif args.image_mode == "approximate":
        print("Query images: runnable public-data approximation (not exact paper pixels)")
    else:
        print("Query images: not prepared; use --image-mode approximate or exact")


if __name__ == "__main__":
    main()
