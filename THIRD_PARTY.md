# Third-party components

MatchCityLoc's license does not replace the licenses of dependencies, data or institutional marks.

## Vendored source

The `thirdparty/image-matching-webui/` directory contains the Image Matching WebUI matching adapters and their supporting implementations. Upstream: <https://github.com/Vincentqyw/image-matching-webui>.

The default matcher uses its MINIMA-trained RoMa adapter and the bundled RoMa source. Model weights are downloaded from the upstream model hub on first use. Alternative matcher implementations are retained for the optional ablations. Additional dependencies may be required for those alternatives.

Each component retains its own `LICENSE`, `NOTICE` or equivalent attribution file. Absolute scratch-directory paths in upstream COTR and RoRD training examples are replaced with generic `/path/to/` placeholders.

## Separately installed dependencies

- MoGe-2: <https://github.com/microsoft/MoGe>
- MINIMA: <https://github.com/LSXI7/MINIMA>
- RoMa: <https://github.com/Parskatt/RoMa>
- nvdiffrast: <https://github.com/NVlabs/nvdiffrast>

Consult the upstream repositories and model cards for their code, model and dataset terms.

## Dataset annotations

The three annotation files in `datasets/SemCityLockeD/` are attributed to SemCityLoc / SemCityLockeD and retain their CC BY-NC 4.0 terms. Their source revision and checksums are documented alongside the files. Raw images, city models and trained weights are not bundled.
