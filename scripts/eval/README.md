# Evaluation scripts

These Bash scripts run directly on a Linux GPU machine. Install the dependencies,
activate your Python environment, and prepare the datasets first. The scripts
find the repository relative to their own location, so they also work when
launched from another directory.

```bash
conda activate matchcityloc  # or activate your virtual environment
bash scripts/eval/eval_matching_uavd4l_lod3_intraj.sh
bash scripts/eval/eval_matching_swiss_inplace.sh
bash scripts/eval/eval_matching_semcity_lod3.sh
```

The scripts use the active Python environment and do not activate or install one
automatically. Optional backbones and matchers may need additional dependencies.

## Options and previews

Set `CUDA_VISIBLE_DEVICES=0` to choose a GPU, or `PYTHON=/path/to/python` to use a
specific interpreter. Set `DRY_RUN=1` to print commands without running Python,
loading weights, or evaluating data. Additional pipeline arguments are forwarded
unchanged, including paths containing spaces.

```bash
DRY_RUN=1 bash scripts/eval/eval_matching_swiss_inplace.sh
bash scripts/eval/eval_matching_swiss_inplace.sh --n 5 --out outputs/swiss_smoke
CUDA_VISIBLE_DEVICES=0 bash scripts/eval/eval_matching_semcity_lod3.sh
```

Output goes to the terminal. Use normal shell redirection if a log file is needed.
Pipeline results are written under `outputs/` unless overridden with `--out`.
Choose distinct output directories for separate experiments.

## Main comparisons

| Launchers | Dataset | Refinement updates |
| --- | --- | --- |
| `eval_matching_uavd4l_lod3_{intraj,outtraj}.sh` | UAVD4L-LoD, LoD3 | 3 |
| `eval_matching_swiss_{inplace,outplace}.sh` | Swiss-EPFL | 5, query seed 20261019 |
| `eval_matching_semcity_lod{1,2,3}.sh` | SemCityLockeD | 5 |

The public SemCityLockeD image preparation has the rectification caveat described
in [the dataset documentation](../../datasets/SemCityLockeD/README.md).

## Component comparisons and prior noise

`run_ablation_matchers.sh` and `run_ablation_modalities.sh` run all their
configurations sequentially with three updates. The `_g1`, `_g2`, and `_g3`
variants run smaller configuration groups.

The following launchers accept `all` (the default) or a zero-based task index as
their first argument. Remaining arguments are passed to the pipeline.

| Launcher | Task indices | Refinement updates |
| --- | --- | --- |
| `run_ablation_foundation_matching.sh` | 0–11, six predictors x two splits | 4 |
| `run_matching_prior_noise.sh` | 0–3, each on both UAVD4L-LoD splits | 2 |
| `run_matching_prior_noise_semcitylocked.sh` | 0–3, SemCityLockeD LoD2 | 2 |
| `run_ablation_robustness_matching.sh` | 0–11, broader translation/rotation sweep on both UAVD4L-LoD splits | 3 |

Foundation models are ordered as MoGe-2 ViT-S, ViT-B, ViT-L, then Metric3D-v2
ViT-S, ViT-L, ViT-G. Even task indices use in-Traj and odd indices use out-Traj.
The prior-noise tasks use joint translation/rotation magnitudes of 0, 10, 20, and
30 metres/degrees. The broader robustness sweep is a separate experiment from
the two-update prior-noise analysis.

```bash
DRY_RUN=1 bash scripts/eval/run_ablation_foundation_matching.sh all
bash scripts/eval/run_ablation_foundation_matching.sh 0 --n 5
bash scripts/eval/run_matching_prior_noise.sh all
bash scripts/eval/run_matching_prior_noise_semcitylocked.sh 2
```

The older `eval_ablation_matching_uavd4l_{intraj,outtraj}.sh` examples invoke
`pipeline_matching_ablation.py` with five updates and stride 10. They are not
the full-query main comparisons. Their first two optional arguments are the
output directory and rendering batch size, followed by pipeline options:

```bash
DRY_RUN=1 bash scripts/eval/eval_ablation_matching_uavd4l_intraj.sh outputs/ablation 8
```
