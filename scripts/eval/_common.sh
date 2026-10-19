#!/usr/bin/env bash
# Shared setup for evaluation launchers. Activate your Python environment first.
MATCHCITYLOC_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$MATCHCITYLOC_ROOT"
export PYTHONPATH="$MATCHCITYLOC_ROOT${PYTHONPATH:+:$PYTHONPATH}"

run_pipeline() {
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        printf '%q ' "${PYTHON:-python}" -u "$@"
        printf '\n'
    else
        "${PYTHON:-python}" -u "$@"
    fi
}

select_tasks() {
    local selection="$1" count="$2" index
    TASK_INDICES=()
    if [[ "$selection" == "all" ]]; then
        for ((index=0; index<count; index++)); do
            TASK_INDICES+=("$index")
        done
    elif [[ "$selection" =~ ^[0-9]{1,2}$ ]] && (( 10#$selection < count )); then
        TASK_INDICES+=("$((10#$selection))")
    else
        printf 'Expected all or a task index from 0 to %s, got: %s\n' "$((count - 1))" "$selection" >&2
        return 2
    fi
}
