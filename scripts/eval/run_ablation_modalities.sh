#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

modalities=(
  "rgb depth"
  "rgb normal"
  "depth normal"
  "depth depth"
  "normal normal"
)

for pair in "${modalities[@]}"; do
    uav=$(printf '%s' "$pair" | cut -d' ' -f1)
    lod=$(printf '%s' "$pair" | cut -d' ' -f2)
    for split in inTraj outTraj; do
        echo "Running modality: UAV $uav vs LoD $lod on $split"
        run_pipeline pipeline_matching.py \
            --num_iterations 3 \
            --dataset uavd4l --split "$split" \
            --uav_mode "$uav" --lod_mode "$lod" \
            --matcher_key "minima(RoMa)" \
            --out "outputs/ablation_modalities/${uav}_${lod}_${split}" \
            "$@"
    done
done

echo "Done."
