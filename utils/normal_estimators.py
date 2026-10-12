"""
utils/normal_estimators.py
==========================
Unified interface for swappable surface-normal estimators used in the
MatchCityLoc foundation-model ablation (`--normal_model` on pipeline_matching.py).

Supported model keys
--------------------
  moge2-vits       MoGe-2 ViT-S  (Ruicheng/moge-2-vits-normal)   ~35M
  moge2-vitb       MoGe-2 ViT-B  (Ruicheng/moge-2-vitb-normal)  ~104M
  moge2-vitl       MoGe-2 ViT-L  (Ruicheng/moge-2-vitl-normal)  ~331M
  metric3dv2-vits  Metric3D-v2 ViT-Small  (torch.hub)
  metric3dv2-vitl  Metric3D-v2 ViT-Large  (torch.hub)
  metric3dv2-vitg  Metric3D-v2 ViT-Giant2 (torch.hub)

All estimators return normals as (H, W, 3) float32 numpy arrays in
camera-frame coordinates, normalised to unit length. Background / invalid
pixels are set to (0, 0, 0).
"""

import time
from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image as PILImage


# ---------------------------------------------------------------------------
# Public model-key registry
# ---------------------------------------------------------------------------

MOGE2_MODELS = {
    "moge2-vits": "Ruicheng/moge-2-vits-normal",
    "moge2-vitb": "Ruicheng/moge-2-vitb-normal",
    "moge2-vitl": "Ruicheng/moge-2-vitl-normal",
}

METRIC3DV2_MODELS = {
    "metric3dv2-vits": "metric3d_vit_small",
    "metric3dv2-vitl": "metric3d_vit_large",
    "metric3dv2-vitg": "metric3d_vit_giant2",
}

ALL_KEYS = list(MOGE2_MODELS) + list(METRIC3DV2_MODELS)


# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------

class NormalEstimator(ABC):
    """Abstract base: load once, call infer() per frame."""

    @abstractmethod
    def infer(self, img_path: str, target_hw: tuple[int, int]) -> np.ndarray:
        """Return (H, W, 3) float32 camera-frame unit normals.

        Background / invalid pixels should be zeroed out.
        """

    @abstractmethod
    def infer_depth_and_normal(self, img_path: str, target_hw: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
        """Return (depth, normals) at target_hw resolution.
        
        depth: (H, W) float32 array
        normals: (H, W, 3) float32 camera-frame unit normals
        """

    @property
    @abstractmethod
    def model_key(self) -> str:
        """Human-readable model identifier for logging."""


# ---------------------------------------------------------------------------
# MoGe-2 estimator
# ---------------------------------------------------------------------------

class MoGe2Estimator(NormalEstimator):
    """Wraps MoGeModel.from_pretrained (all ViT-S/B/L variants)."""

    def __init__(self, key: str, device: str):
        from moge.model.v2 import MoGeModel

        hf_id = MOGE2_MODELS[key]
        print(f"Loading MoGe-2 normal estimator: {hf_id} ...")
        self._model = MoGeModel.from_pretrained(hf_id).to(device).eval()
        self._device = device
        self._key = key

    @property
    def model_key(self) -> str:
        return self._key

    @staticmethod
    def _image_array_to_tensor(img_np: np.ndarray, device: str) -> torch.Tensor:
        if img_np.dtype != np.float32:
            img_np = img_np.astype(np.float32)
        if img_np.max() > 1.0:
            img_np = img_np / 255.0
        return torch.from_numpy(img_np).permute(2, 0, 1).to(device)

    def infer_from_image(self, img_np: np.ndarray, target_hw: tuple[int, int]) -> np.ndarray:
        """Returns (H, W, 3) float32 unit normals (no disk I/O)."""
        rH, rW = target_hw
        img_t = self._image_array_to_tensor(img_np, self._device)

        with torch.no_grad():
            output = self._model.infer(img_t)

        normals = output.get("normal")
        if normals is None:
            raise RuntimeError(
                f"Model {self._key} did not return normals. "
                "Make sure you are using a '-normal' variant."
            )
        if isinstance(normals, torch.Tensor):
            n_t = normals.to(self._device)
        else:
            n_t = torch.from_numpy(np.array(normals, dtype=np.float32)).to(self._device)

        n_t = n_t.permute(2, 0, 1).unsqueeze(0)
        n_t = F.interpolate(n_t, size=(rH, rW), mode="bilinear", align_corners=False)
        n_t = n_t[0].permute(1, 2, 0)
        n_t = F.normalize(n_t, dim=-1, eps=1e-8)
        return n_t.cpu().numpy().astype(np.float32)

    def infer(self, img_path: str, target_hw: tuple[int, int]) -> np.ndarray:
        """Returns (H, W, 3) float32 unit normals."""
        return self.infer_from_image(
            np.array(PILImage.open(img_path).convert("RGB"), dtype=np.float32) / 255.0,
            target_hw,
        )

    def infer_depth_and_normal_from_image(
        self, img_np: np.ndarray, target_hw: tuple[int, int],
    ) -> tuple[np.ndarray, np.ndarray]:
        rH, rW = target_hw
        img_t = self._image_array_to_tensor(img_np, self._device)

        with torch.no_grad():
            output = self._model.infer(img_t)

        normals = output.get("normal")
        depth = output.get("depth")

        if isinstance(normals, torch.Tensor):
            n_t = normals.to(self._device)
        else:
            n_t = torch.from_numpy(np.array(normals, dtype=np.float32)).to(self._device)

        if isinstance(depth, torch.Tensor):
            d_t = depth.to(self._device)
        else:
            d_t = torch.from_numpy(np.array(depth, dtype=np.float32)).to(self._device)

        n_t = n_t.permute(2, 0, 1).unsqueeze(0)
        n_t = F.interpolate(n_t, size=(rH, rW), mode="bilinear", align_corners=False)
        n_t = n_t[0].permute(1, 2, 0)
        n_t = F.normalize(n_t, dim=-1, eps=1e-8)

        d_t = d_t.unsqueeze(0).unsqueeze(0)
        d_t = F.interpolate(d_t, size=(rH, rW), mode="bilinear", align_corners=False)
        d_t = d_t[0, 0]

        return d_t.cpu().numpy().astype(np.float32), n_t.cpu().numpy().astype(np.float32)

    def infer_depth_and_normal(self, img_path: str, target_hw: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
        img_np = np.array(PILImage.open(img_path).convert("RGB"), dtype=np.float32) / 255.0
        return self.infer_depth_and_normal_from_image(img_np, target_hw)


# ---------------------------------------------------------------------------
# Metric3D-v2 estimator
# ---------------------------------------------------------------------------

# Metric3D-v2 canonical input: resize+pad to (616, 1064) for ViT models
_M3D_INPUT_HW = (616, 1064)
_M3D_MEAN = np.array([123.675, 116.28, 103.53], dtype=np.float32)
_M3D_STD  = np.array([58.395, 57.12, 57.375], dtype=np.float32)


def _metric3d_preprocess(pil_img: PILImage.Image, target_hw=(616, 1064)):
    """Resize + pad to target_hw, normalise, return (1,3,H,W) tensor + pad info."""
    orig_w, orig_h = pil_img.size
    tH, tW = target_hw

    # Scale so the larger dimension fits, preserving aspect ratio
    scale = min(tH / orig_h, tW / orig_w)
    new_h = int(round(orig_h * scale))
    new_w = int(round(orig_w * scale))
    pil_resized = pil_img.resize((new_w, new_h), PILImage.BILINEAR)

    # Pad to exactly target_hw (bottom/right)
    pad_bottom = tH - new_h
    pad_right = tW - new_w
    canvas = np.zeros((tH, tW, 3), dtype=np.float32)
    canvas[:new_h, :new_w] = np.array(pil_resized, dtype=np.float32)

    # Normalise
    canvas = (canvas - _M3D_MEAN) / _M3D_STD
    tensor = torch.from_numpy(canvas.transpose(2, 0, 1)).unsqueeze(0)  # (1,3,H,W)
    return tensor, (scale, new_h, new_w, pad_bottom, pad_right)


class Metric3Dv2Estimator(NormalEstimator):
    """Wraps torch.hub Metric3D-v2 models (ViT-S / ViT-L / ViT-G2)."""

    def __init__(self, key: str, device: str):
        hub_name = METRIC3DV2_MODELS[key]
        print(f"Loading Metric3D-v2: {hub_name} (via torch.hub) ...")
        self._model = torch.hub.load(
            "yvanyin/metric3d", hub_name, pretrain=True
        ).to(device).eval()
        self._device = device
        self._key = key

    @property
    def model_key(self) -> str:
        return self._key

    def infer(self, img_path: str, target_hw: tuple[int, int]) -> np.ndarray:
        """Returns (H, W, 3) float32 unit normals at target_hw resolution."""
        rH, rW = target_hw
        pil_img = PILImage.open(img_path).convert("RGB")

        rgb_tensor, (scale, proc_h, proc_w, pad_b, pad_r) = _metric3d_preprocess(pil_img)
        rgb_tensor = rgb_tensor.to(self._device)

        with torch.no_grad():
            _, _, output_dict = self._model.inference({"input": rgb_tensor})

        # output_dict['prediction_normal']: (1, 4, H, W) — first 3 channels are XYZ
        pred_normal = output_dict.get("prediction_normal")
        if pred_normal is None:
            raise RuntimeError(
                f"Metric3D model {self._key} did not return 'prediction_normal'. "
                "Ensure the model supports normal estimation."
            )
        pred_normal = pred_normal[:, :3, :, :]  # (1, 3, H, W)

        # Crop out padding, then restore to original image space
        pred_normal = pred_normal[:, :, :proc_h, :proc_w]  # (1, 3, proc_h, proc_w)

        # Resize to target_hw
        pred_normal = F.interpolate(pred_normal, size=(rH, rW), mode="bilinear", align_corners=False)
        pred_normal = pred_normal[0].permute(1, 2, 0)  # (H, W, 3)
        pred_normal = F.normalize(pred_normal, dim=-1, eps=1e-8)
        return pred_normal.cpu().numpy().astype(np.float32)

    def infer_depth_and_normal(self, img_path: str, target_hw: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
        rH, rW = target_hw
        pil_img = PILImage.open(img_path).convert("RGB")

        rgb_tensor, (scale, proc_h, proc_w, pad_b, pad_r) = _metric3d_preprocess(pil_img)
        rgb_tensor = rgb_tensor.to(self._device)

        with torch.no_grad():
            _, _, output_dict = self._model.inference({"input": rgb_tensor})

        pred_normal = output_dict.get("prediction_normal")
        pred_depth = output_dict.get("prediction")
        
        pred_normal = pred_normal[:, :3, :, :]
        pred_normal = pred_normal[:, :, :proc_h, :proc_w]
        pred_normal = F.interpolate(pred_normal, size=(rH, rW), mode="bilinear", align_corners=False)
        pred_normal = pred_normal[0].permute(1, 2, 0)
        pred_normal = F.normalize(pred_normal, dim=-1, eps=1e-8)
        
        pred_depth = pred_depth[:, :, :proc_h, :proc_w]
        pred_depth = F.interpolate(pred_depth, size=(rH, rW), mode="bilinear", align_corners=False)
        pred_depth = pred_depth[0, 0]

        return pred_depth.cpu().numpy().astype(np.float32), pred_normal.cpu().numpy().astype(np.float32)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def load_normal_estimator(model_key: str, device: str) -> NormalEstimator:
    """Load and return a NormalEstimator for the given model key.

    Args:
        model_key: One of ALL_KEYS (e.g. 'moge2-vits', 'metric3dv2-vitl').
        device:    Torch device string (e.g. 'cuda', 'cpu').

    Returns:
        A NormalEstimator ready to call .infer(img_path, target_hw).
    """
    if model_key in MOGE2_MODELS:
        return MoGe2Estimator(model_key, device)
    elif model_key in METRIC3DV2_MODELS:
        return Metric3Dv2Estimator(model_key, device)
    else:
        raise ValueError(
            f"Unknown normal_model key: '{model_key}'. "
            f"Valid options: {ALL_KEYS}"
        )
