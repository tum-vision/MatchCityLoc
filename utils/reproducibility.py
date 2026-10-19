"""Order-independent query seeds for repeatable evaluation."""
import hashlib


def query_seed(base_seed: int, dataset: str, split: str, frame: str) -> int:
    key = '|'.join([str(base_seed), dataset, split, frame])
    return int(hashlib.sha256(key.encode()).hexdigest()[:8], 16) % 2147483647
