#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

# Group 2: rgb+normal outTraj, depth+normal (x2)  â 3 combos
combos=(
  "rgb normal outTraj"
  "depth normal inTraj"
  "depth normal outTraj"
)

for combo in "${combos[@]}"; do
    uav=$(echo "$combo" | cut -d' ' -f1)
    lod=$(echo "$combo" | cut -d' ' -f2)
    split=$(echo "$combo" | cut -d' ' -f3)
    echo "Running modality: UAV $uav vs LoD $lod on $split"
    run_pipeline pipeline_matching.py \
        --num_iterations 3 \
        --dataset uavd4l --split "$split" \
        --uav_mode "$uav" --lod_mode "$lod" \
        --matcher_key "minima(RoMa)" \
        --out "outputs/ablation_modalities/${uav}_${lod}_${split}" \
        "$@"
done

echo "Group 2 done."
