# MatchCityLoc SemCityLockeD release files

This directory contains the exact 937-frame evaluation annotations used for the MatchCityLoc paper:

- `GT_pose.txt`: ground-truth world-to-camera poses.
- `GPS_pose_add_error.txt`: noisy pose priors used by the reported experiments.
- `intrinsic.txt`: camera intrinsics for the 5644×4082 paper query images.

The files were recovered from the SemCityLoc source history (commit `0661420ebce4c2f0bbaccc2d21958db79caef40d`) and normalized from CRLF to LF line endings. Recomputing the pose-prior errors from these files reproduces all 937 values stored by the MatchCityLoc LoD3 evaluation, with maximum differences of `4.3e-14` m and `2.2e-11` degrees.

## Exact LoD models

Download the models from the pinned SemCityLockeD Hugging Face revision `26622132a6a480ccb7b0ef938cf064d7c5ed56d0`. The files used by MatchCityLoc have these SHA-256 checksums:

```text
f2b0354e493bffbff5cf6d5f26e170b46b169ccc96ad92f37817d0d3d597f9a9  TUM_CC_lod1.obj
9000168790677a24283959546a55344a1667b67e10e16c70a93dcf0fadcdc6f8  TUM_CC_lod2.obj
8aa9cb0c62bf68c03894bee6eba732e111059656bc37aac01927e1b2b47d466b  TUM_CC_lod3.obj
```

LoD3 was compared byte-for-byte with a surviving copy used by the paper. LoD2 is byte-identical to the model stored in the SemCityLoc source history. LoD1 was verified against an experiment-derived mesh: its complete geometry and face ordering match.

The model files are not duplicated in Git because LoD3 is 108 MB and exceeds GitHub's normal 100 MB per-file limit. Pinning the upstream revision and verifying the hashes gives the same bytes without Git LFS.

## Public dataset comparison

The MatchCityLoc experiments used 937 rectified query images at **5644×4082**. The pinned public Hugging Face release contains 962 raw/distorted DJI captures at **5280×3956**. All 937 paper filenames occur in the public release; the public release has 25 additional frames.

The public JPEGs report `DewarpFlag=0` and carry OpenCV-format factory calibration in the DJI XMP `DewarpData` field. Nine public/paper pairs were compared geometrically. One shared distortion model maps the pairs with a median residual of 0.35 px (95% below 1.37 px), which confirms that the paper images are undistorted/rectified exports rather than resized copies. Applying only the embedded DJI factory calibration leaves a 2.75 px median residual, indicating that the paper export used a refined calibration that is no longer present in the source tree.

Consequently, the public images plus the paper intrinsics are not an exact reproduction of the paper input. The exact models and annotations are reproducible, but exact end-to-end SemCityLockeD paper reproduction still requires publication of the 937 rectified query images or recovery of the refined source-camera calibration. Do not label a factory-XMP dewarping as exact.

Use `python scripts/prepare_semcitylocked.py data/SemCityLockeD` from the repository root for automatic download, layout creation, approximate public-image rectification, and checksum verification. Use `--image-mode exact --rectified-images DIR` when the exact paper JPEGs are available.

These files follow the SemCityLockeD CC BY-NC 4.0 license.
