# Datasets

MatchCityLoc evaluates on UAVD4L-LoDv2, Swiss-EPFLv2, and SemCityLockeD. Run all commands from the repository root.

## SemCityLockeD

The recommended setup is fully automatic:

```bash
python scripts/prepare_semcitylocked.py data/SemCityLockeD
```

The script downloads the pinned [SemCityLockeD release](https://huggingface.co/datasets/DevinEaston/SemCityLockeD), selects the 937 evaluation frames, creates the expected layout, and verifies the models and annotations.

The public DJI images are distorted, while the paper used rectified images. By default, the script creates a runnable approximation using the DJI factory calibration. This is suitable for using the code, but not for claiming exact reproduction of the paper numbers.

If the exact rectified images are available:

```bash
python scripts/prepare_semcitylocked.py data/SemCityLockeD \
    --image-mode exact \
    --rectified-images /path/to/rectified-paper-images
```

Use `--image-mode raw-only` to download the public images without rectifying them. See [SemCityLockeD provenance](SemCityLockeD/README.md) for the exact release revision and image comparison.

## UAVD4L-LoDv2

Download `UAVD4L-LoD/` and `MODEL/UAVD4L-LoD.obj` from the [LoD-Loc release](https://github.com/VictorZoo/LoD-Loc) ([Baidu archive](https://pan.baidu.com/s/1Ue37i0OQpS2jzo-fQ3o4bA?pwd=xxdv), code `xxdv`). Then run:

```bash
mkdir -p data/MODEL/ply
cp -a /path/to/extracted/UAVD4L-LoD data/
PYTHONPATH=. python utils/obj_to_ply.py \
    /path/to/extracted/MODEL/UAVD4L-LoD.obj \
    data/MODEL/ply/UAVD4L-LoD3.ply
```

The expected splits are `data/UAVD4L-LoD/inTraj/` and `data/UAVD4L-LoD/outTraj/`.

## Swiss-EPFLv2

Download `Swiss-EPFL/` and `MODEL/Swiss-EPFL-LoD.obj` from the same LoD-Loc archive. Then run:

```bash
mkdir -p data/MODEL/ply
cp -a /path/to/extracted/Swiss-EPFL data/
PYTHONPATH=. python utils/obj_to_ply.py \
    /path/to/extracted/MODEL/Swiss-EPFL-LoD.obj \
    data/MODEL/ply/Swiss-EPFL-LoD2.ply
```

Keep the provided `inPlace/`, `outPlace/`, and `split/` directories together. The loader accepts both the full-release filenames (`Query_image_full/`, `GT_pose_full.txt`, etc.) and the shorter demo filenames.

## Expected files

Each evaluation split contains:

```text
Query_image/
GT_pose.txt
GPS_pose.txt
intrinsic.txt
```

SemCityLockeD uses `GPS_pose_add_error.txt` instead of `GPS_pose.txt` and keeps its LoD files under `model/`.

Pose lines use:

```text
<image_name> <qw> <qx> <qy> <qz> <tx> <ty> <tz>
```

Intrinsic lines use:

```text
<image_name> PINHOLE <width> <height> <fx> <fy> <cx> <cy>
```

Downloaded data, generated meshes, checkpoints, and outputs are excluded by `.gitignore`.
