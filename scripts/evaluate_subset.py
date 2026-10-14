"""Evaluate final saved MatchCityLoc pose errors on an exact query manifest.

Example:
    python scripts/evaluate_subset.py --metrics outputs/run/metrics.json \
        --manifest split.json --split val --group inTraj --expected-count 188

This aggregates completed localization results, it does not run inference.
The rotation errors must be full geodesic rotation errors in degrees, as
written by pipeline_matching.py. They are not yaw-only errors.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import statistics


def query_ids(manifest, split, group):
    ids = manifest[split][group]
    if not isinstance(ids, list) or not ids:
        raise ValueError("The selected manifest entry must be a nonempty list")
    if any(not isinstance(name, str) or not name for name in ids):
        raise ValueError("Every query ID must be a nonempty string")
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate query IDs in the manifest")
    return ids


def summarize(rows, t_key="pnp_best_overall_t_err", r_key="pnp_best_overall_r_err"):
    if not rows:
        raise ValueError("Cannot evaluate an empty set")
    errors = []
    for row in rows:
        pair = (row[t_key], row[r_key])
        if any(isinstance(x, bool) or not isinstance(x, (int, float))
               or not math.isfinite(x) or x < 0 for x in pair):
            raise ValueError(f"Invalid pose error for {row['frame']}")
        errors.append(pair)
    counts = {str(k): sum(t < k and r < k for t, r in errors) for k in (2, 3, 5)}
    ts, rs = zip(*errors)
    return {
        "query_count": len(rows),
        "joint_success_counts": counts,
        "joint_recall_percent": {k: 100 * n / len(rows) for k, n in counts.items()},
        "median_translation_m": statistics.median(ts),
        "median_rotation_deg": statistics.median(rs),
        "mean_translation_m": statistics.mean(ts),
        "mean_rotation_deg": statistics.mean(rs),
    }


def evaluate(rows, ids):
    by_id = {}
    for row in rows:
        name = row["frame"]
        if name in by_id:
            raise ValueError(f"Duplicate query ID in metrics: {name}")
        by_id[name] = row
    missing = sorted(set(ids) - by_id.keys())
    if missing:
        raise ValueError(f"Missing {len(missing)} requested queries: {missing}")
    selected = [by_id[name] for name in ids]
    return {
        "metric_definition": "strict joint translation (m) and full geodesic rotation (deg)",
        "pose_selection": "saved final pose, including fallback poses",
        "source_query_count": len(rows),
        "requested_query_count": len(ids),
        "missing_queries": [],
        "subset": summarize(selected),
        "subset_prior": summarize(selected, "gps_prior_t_err", "gps_prior_r_err"),
        "full_evaluation": summarize(rows),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metrics", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--split", required=True)
    parser.add_argument("--group", required=True)
    parser.add_argument("--expected-count", type=int)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    ids = query_ids(json.loads(args.manifest.read_text()), args.split, args.group)
    if args.expected_count is not None and len(ids) != args.expected_count:
        parser.error(f"Expected {args.expected_count} queries, found {len(ids)}")
    report = evaluate(json.loads(args.metrics.read_text()), ids)
    report.update({
        "split": args.split, "group": args.group,
        "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(),
        "metrics_sha256": hashlib.sha256(args.metrics.read_bytes()).hexdigest(),
    })
    rendered = json.dumps(report, indent=2, allow_nan=False) + "\n"
    if args.output:
        with args.output.open("x") as output:
            output.write(rendered)
    print(rendered, end="")


if __name__ == "__main__":
    main()
