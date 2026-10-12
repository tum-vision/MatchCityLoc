"""Render LoD normals / edges at a given pose for qualitative figures."""

import cv2
import numpy as np

from utils.io import load_intrinsics, scale_K
from utils.lod import LoD

DISPLAY_H = 480
NORMAL_OVERLAY_ALPHA = 0.55
EDGE_COLOR = np.array([255, 40, 40], dtype=np.float32)
EDGE_ALPHA = 0.88
EDGE_THRESH = 0.38


def lod_normals_to_rgb(normals: np.ndarray) -> np.ndarray:
    return np.clip((normals * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)


def blend_overlay(img: np.ndarray, layer: np.ndarray, valid: np.ndarray, alpha: float) -> np.ndarray:
    out = img.astype(np.float32)
    lay = layer.astype(np.float32)
    out[valid] = (1.0 - alpha) * out[valid] + alpha * lay[valid]
    return np.clip(out, 0, 255).astype(np.uint8)


def process_frame(sample, lod: LoD, intrinsic_path: str, seg=None):
    r_h = DISPLAY_H
    r_w = max(1, int(round(r_h * sample["src_W"] / sample["src_H"])))
    img_bgr = cv2.imread(sample["img_path"])
    img_rgb = cv2.cvtColor(
        cv2.resize(img_bgr, (r_w, r_h), interpolation=cv2.INTER_AREA),
        cv2.COLOR_BGR2RGB,
    )

    fx, fy, cx, cy, src_W, src_H = load_intrinsics(intrinsic_path, sample["img_name"])
    K = scale_K(fx, fy, cx, cy, src_W, src_H, r_w, r_h)
    w2c = sample["w2c_gt"]
    lod_c = lod.crop_to_camera_pose(
        w2c, K, (r_h, r_w), margin=1.2, footprint_extend_m=200.0,
    )

    depths, normals = lod_c.render_depth_normals_batch([w2c], K, (r_h, r_w))
    depth = depths[0]
    normal_rgb = lod_normals_to_rgb(normals[0])
    valid = depth > 0.0

    edges = lod_c.render_edges_batch([w2c], K, (r_h, r_w), sobel_scale=8.0)[0]
    edge_mask = edges > EDGE_THRESH

    overlay = blend_overlay(img_rgb, normal_rgb, valid, NORMAL_OVERLAY_ALPHA)
    overlay = overlay.astype(np.float32)
    overlay[edge_mask] = (1.0 - EDGE_ALPHA) * overlay[edge_mask] + EDGE_ALPHA * EDGE_COLOR
    overlay = np.clip(overlay, 0, 255).astype(np.uint8)

    return {
        "name": sample["img_name"],
        "overlay": overlay,
        "uav": img_rgb,
    }
