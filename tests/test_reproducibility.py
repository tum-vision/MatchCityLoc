"""Evaluation budgets and query seeds must match the verified protocol."""
import ast
import hashlib
from pathlib import Path

from utils.reproducibility import query_seed

ROOT = Path(__file__).resolve().parents[1]


def test_seed_matches_frozen_swiss_protocol():
    frame = 'urbanscape-2020-09-17-planned_00353_100_0039_0121_img.jpg'
    expected = int(hashlib.sha256(('20261019|swiss_epfl|inPlace|' + frame).encode()).hexdigest()[:8], 16) % 2147483647
    assert query_seed(20261019, 'swiss_epfl', 'inPlace', frame) == expected


def test_seed_is_order_independent_and_frame_specific():
    frames = ['first.jpg', 'second.jpg', 'third.jpg']
    seeds = {f: query_seed(7, 'uavd4l', 'inTraj', f) for f in frames}
    assert seeds == {f: query_seed(7, 'uavd4l', 'inTraj', f) for f in reversed(frames)}
    assert len(set(seeds.values())) == 3
    assert all(0 <= s < 2147483647 for s in seeds.values())


def test_main_launchers_use_reported_budgets():
    for split in ('intraj', 'outtraj'):
        assert '--num_iterations 3' in (ROOT/f'slurm/eval_matching_uavd4l_lod3_{split}.sh').read_text()
    for split in ('inplace', 'outplace'):
        text = (ROOT/f'slurm/eval_matching_swiss_{split}.sh').read_text()
        assert '--num_iterations 5' in text
        assert '--query_seed 20261019' in text
    ast.parse((ROOT/'pipeline_matching.py').read_text())
