"""Portable evaluation launchers must run without scheduler or GPU dependencies."""
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
LAUNCHERS = ROOT / "scripts/eval"
SCRIPTS = sorted(path for path in LAUNCHERS.glob("*.sh") if path.name != "_common.sh")
TASK_SCRIPTS = {
    "run_ablation_foundation_matching.sh": (12, 1),
    "run_ablation_robustness_matching.sh": (12, 2),
    "run_matching_prior_noise.sh": (4, 2),
    "run_matching_prior_noise_semcitylocked.sh": (4, 1),
}


def launch(script, cwd, *args, dry_run=True, **extra_env):
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(("SLURM", "CONDA"))}
    env.update(DRY_RUN="1" if dry_run else "0", PYTHON="python")
    env.update(extra_env)
    return subprocess.run(["bash", str(LAUNCHERS / script), *args], cwd=cwd,
                          env=env, text=True, capture_output=True, timeout=15)


def commands(output):
    result = []
    for line in output.splitlines():
        parts = shlex.split(line)
        if len(parts) > 2 and parts[1] == "-u":
            result.append(parts)
    return result


@pytest.mark.parametrize("script", SCRIPTS, ids=lambda path: path.name)
def test_every_launcher_has_valid_bash_and_dry_runs(script, tmp_path):
    subprocess.run(["bash", "-n", str(script)], check=True)
    assert not any(token in script.read_text().lower()
                   for token in ("slurm", "sbatch", "srun", "conda activate"))
    result = launch(script.name, tmp_path)
    assert result.returncode == 0, result.stderr
    assert commands(result.stdout)
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize("script,settings", TASK_SCRIPTS.items())
def test_all_tasks_and_single_task_selection(script, settings, tmp_path):
    count, runs_per_task = settings
    full = launch(script, tmp_path, "all", "--n", "1")
    default = launch(script, tmp_path)
    single = launch(script, tmp_path, str(count - 1), "--n", "1")
    assert full.returncode == default.returncode == single.returncode == 0
    assert len(commands(full.stdout)) == len(commands(default.stdout)) == count * runs_per_task
    assert len(commands(single.stdout)) == runs_per_task
    assert all(command[-2:] == ["--n", "1"] for command in commands(full.stdout))


@pytest.mark.parametrize("script,settings", TASK_SCRIPTS.items())
@pytest.mark.parametrize("invalid", ("-1", "999", "invalid"))
def test_invalid_task_is_rejected_before_running_python(script, settings, invalid, tmp_path):
    result = launch(script, tmp_path, invalid)
    assert result.returncode == 2
    assert not commands(result.stdout)


def test_foundation_budget_and_model_split_mapping(tmp_path):
    result = launch("run_ablation_foundation_matching.sh", tmp_path)
    calls = commands(result.stdout)
    models = ["moge2-vits", "moge2-vitb", "moge2-vitl",
              "metric3dv2-vits", "metric3dv2-vitl", "metric3dv2-vitg"]
    for index, call in enumerate(calls):
        assert call[call.index("--normal_model") + 1] == models[index // 2]
        assert call[call.index("--split") + 1] == ("inTraj", "outTraj")[index % 2]
        assert call[call.index("--num_iterations") + 1] == "4"


def test_argument_quoting_and_legacy_positional_arguments(tmp_path):
    output = str(tmp_path / "output with spaces")
    result = launch("eval_matching_swiss_inplace.sh", tmp_path, "--out", output)
    assert commands(result.stdout)[0][-2:] == ["--out", output]
    legacy = launch("eval_ablation_matching_uavd4l_intraj.sh", tmp_path,
                    output, "8", "--n", "1")
    call = commands(legacy.stdout)[0]
    assert call[call.index("--out") + 1] == output
    assert call[call.index("--batchsize") + 1] == "8"
    assert call[-2:] == ["--n", "1"]


@pytest.fixture
def fake_python(tmp_path):
    path = tmp_path / "python with spaces"
    path.write_text(
        f"#!{sys.executable}\n"
        "import json, os, sys\n"
        "print(json.dumps({'argv': sys.argv[1:], 'cwd': os.getcwd(), "
        "'pythonpath': os.environ['PYTHONPATH']}))\n"
        "sys.exit(int(os.environ.get('FAKE_EXIT', '0')))\n"
    )
    path.chmod(0o755)
    return path


def test_actual_execution_uses_active_interpreter_and_repo_directory(tmp_path, fake_python):
    result = launch("eval_matching_swiss_inplace.sh", tmp_path, "--n", "1",
                    dry_run=False, PYTHON=str(fake_python))
    assert result.returncode == 0, result.stderr
    record = json.loads(next(line for line in result.stdout.splitlines() if line.startswith("{")))
    assert Path(record["cwd"]) == ROOT
    assert record["pythonpath"].split(os.pathsep)[0] == str(ROOT)
    assert record["argv"][-2:] == ["--n", "1"]
    assert "--query_seed" in record["argv"]


def test_failed_pipeline_stops_a_sweep(tmp_path, fake_python):
    result = launch("run_ablation_matchers.sh", tmp_path, dry_run=False,
                    PYTHON=str(fake_python), FAKE_EXIT="17")
    assert result.returncode == 17
    assert sum(line.startswith("{") for line in result.stdout.splitlines()) == 1


def test_main_and_component_budgets_are_explicit(tmp_path):
    for script in SCRIPTS:
        if script.name.startswith("eval_ablation_"):
            expected = "5"
        elif "foundation" in script.name:
            expected = "4"
        elif "prior_noise" in script.name:
            expected = "2"
        elif script.name.startswith(("eval_matching_semcity", "eval_matching_swiss")):
            expected = "5"
        else:
            expected = "3"
        result = launch(script.name, tmp_path)
        assert all(call[call.index("--num_iterations") + 1] == expected
                   for call in commands(result.stdout)), script.name
