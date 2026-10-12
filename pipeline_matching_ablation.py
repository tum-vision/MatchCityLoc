#!/usr/bin/env python3
"""
pipeline_matching.py
====================
Image-matching-based UAV localisation pipeline (MINIMA / Roma).

Matches predicted MoGe normals (or depth) from the query UAV image against
LoD-rendered normals/depth from the GPS-prior viewpoint, then runs PnP to
refine the pose.

Supports the paper datasets:
  - uavd4l  : inTraj / outTraj  (data/UAVD4L-LoD/<split>)
  - swiss_epfl : inPlace / outPlace  (data/Swiss-EPFL)
  - semcitylocked : SemCityLockeD (data/SemCityLockeD)

Usage::

    # Single frame
    PYTHONPATH=. python pipeline_matching.py \
        --dataset uavd4l --split inTraj \
        --img_name DJI_0001.jpg \
        --out outputs/matching_intraj

    # Full evaluation
    PYTHONPATH=. python pipeline_matching.py \
        --dataset uavd4l --split inTraj \
        --out outputs/matching_intraj

    # swiss_epfl inPlace
    PYTHONPATH=. python pipeline_matching.py \
        --dataset swiss_epfl --split inPlace \
        --data_root data/Swiss-EPFL \
        --out outputs/matching_swiss_ip
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import cv2
import matplotlib.cm as cm
import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image as PILImage
from scipy.spatial.transform import Rotation
from tqdm import tqdm

_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(_ROOT))
sys.path.insert(0, str(_ROOT / "thirdparty" / "image-matching-webui"))

from datasets.uavd4l import UAVD4LDataset
from datasets.swiss_epfl import SwissEPFLDataset
from datasets.semcitylocked import SemCityLockeDDataset
from utils.normal_estimators import load_normal_estimator, ALL_KEYS as NORMAL_MODEL_KEYS
from utils.lod import LoD
from utils.pipeline_config import PipelineRunConfig
from utils.timing import GpuTimer

from utils.eval_helpers import _safe_metrics, _recall_pct
from utils.pose import pose_error as pnp_pose_error
from utils.pose import CameraPose, euler_to_camera_pose, pose_tensor_to_dict

from moge2.inference import normal_to_rgb
import yaml
from types import SimpleNamespace
from imcui.hloc.utils.base_model import dynamic_load
from imcui.hloc import matchers, extractors
from imcui.hloc import match_dense, match_features, extract_features
from easydict import EasyDict


# ─────────────────────────────────────────────────────────────────────────────
# Small utilities
# ─────────────────────────────────────────────────────────────────────────────


def draw_matches(img1, img2, pts1, pts2, N=200):
    if len(pts1) > N:
        idx = np.random.choice(len(pts1), N, replace=False)
        pts1 = pts1[idx]
        pts2 = pts2[idx]
    
    img1_bgr = cv2.cvtColor(img1, cv2.COLOR_RGB2BGR)
    img2_bgr = cv2.cvtColor(img2, cv2.COLOR_RGB2BGR)
    
    kp1 = [cv2.KeyPoint(float(p[0]), float(p[1]), 1) for p in pts1]
    kp2 = [cv2.KeyPoint(float(p[0]), float(p[1]), 1) for p in pts2]
    matches = [cv2.DMatch(i, i, 0) for i in range(len(pts1))]
    
    out = cv2.drawMatches(img1_bgr, kp1, img2_bgr, kp2, matches, None, matchColor=(0, 255, 0), flags=2)
    return cv2.cvtColor(out, cv2.COLOR_BGR2RGB)

def _generate_vis_plot(sample, vis_data, out_dir, target_h, target_w, match_mode):
    import matplotlib.pyplot as plt
    from pathlib import Path
    
    stem = os.path.splitext(sample['img_name'])[0]
    out_dir_path = Path(out_dir) / "vis_frames"
    out_dir_path.mkdir(parents=True, exist_ok=True)
    
    img_uav_pil = PILImage.open(sample['img_path']).convert('RGB').resize((target_w, target_h), PILImage.Resampling.BILINEAR)
    img_A_rgb = vis_data['img_A_rgb']
    img_gt_rgb = vis_data.get('img_gt_rgb', None)
    lod_history = vis_data['history']
    
    # 1. Generate Per-Iteration plots
    for i, hist in enumerate(lod_history):
        img_B_rgb = hist['img_B_rgb']
        metrics = hist['metrics']
        H_mat = hist.get('H_mat')
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        axes[0, 0].imshow(img_A_rgb)
        axes[0, 0].set_title(f'Image A (MoGe {match_mode.capitalize()})')
        axes[0, 0].axis('off')
        
        axes[0, 1].imshow(img_B_rgb)
        axes[0, 1].set_title(f'Image B (LoD {match_mode.capitalize()})')
        axes[0, 1].axis('off')
        
        inlier_A = metrics.get('inlier_A')
        inlier_B = metrics.get('inlier_B')
        if inlier_A is not None and inlier_B is not None:
            match_vis = draw_matches(img_A_rgb, img_B_rgb, inlier_A, inlier_B)
            axes[1, 0].imshow(match_vis)
            axes[1, 0].set_title(f"Matches ({metrics.get('match_inliers', 0)} inliers)")
        else:
            axes[1, 0].imshow(img_B_rgb)
            axes[1, 0].set_title('No Matches')
        axes[1, 0].axis('off')
        
        if H_mat is not None:
            warp_B = cv2.warpPerspective(img_B_rgb, H_mat, (target_w, target_h))
            alpha = 0.5
            overlay = cv2.addWeighted(img_A_rgb, alpha, warp_B, 1 - alpha, 0)
            axes[1, 1].imshow(overlay)
            axes[1, 1].set_title('Warped B overlay on A')
        else:
            axes[1, 1].imshow(img_B_rgb)
            axes[1, 1].set_title('No Homography')
        axes[1, 1].axis('off')
        
        out_path = out_dir_path / f"{stem}_iter_{i}.png"
        plt.tight_layout()
        plt.savefig(str(out_path), dpi=150, bbox_inches='tight')
        plt.close(fig)
    
    # 2. Generate Summary Plot
    total_panels = 2 + (1 if img_gt_rgb is not None else 0) + len(lod_history)
    num_cols = 3
    num_rows = (total_panels + num_cols - 1) // num_cols
    
    fig_summary, axes_summary = plt.subplots(num_rows, num_cols, figsize=(15, 5 * num_rows))
    axes_summary = axes_summary.flatten()
    
    idx = 0
    axes_summary[idx].imshow(img_uav_pil)
    axes_summary[idx].set_title('Original UAV Image')
    axes_summary[idx].axis('off')
    idx += 1
    
    axes_summary[idx].imshow(img_A_rgb)
    axes_summary[idx].set_title(f'MoGe Predicted {match_mode.capitalize()}')
    axes_summary[idx].axis('off')
    idx += 1
    
    if img_gt_rgb is not None:
        axes_summary[idx].imshow(img_gt_rgb)
        axes_summary[idx].set_title(f'GT Pose {match_mode.capitalize()}')
        axes_summary[idx].axis('off')
        idx += 1
    
    for i, hist in enumerate(lod_history):
        lod_img = hist['img_B_rgb']
        metrics = hist['metrics']
        
        axes_summary[idx].imshow(lod_img)
        title = f'LoD {match_mode.capitalize()} (GPS Prior)' if i == 0 else f'LoD {match_mode.capitalize()} (Iter {i} Result)'
            
        t_err = metrics.get('t_err', -1)
        r_err = metrics.get('r_err', -1)
        if t_err >= 0:
            title += f'\nT: {t_err:.2f}m | R: {r_err:.2f}°'
        
        title += f"\nEdge: {metrics.get('edge_align', -1.0):.3f}"
        if metrics.get('match_inliers', 0) > 0:
            title += f"\nMatches: {metrics.get('match_inliers', 0)} | PnP: {metrics.get('pnp_inliers', 0)}"
            
        axes_summary[idx].set_title(title, fontsize=10)
        axes_summary[idx].axis('off')
        idx += 1
        
    for i in range(idx, len(axes_summary)):
        axes_summary[i].axis('off')
        
    summary_path = out_dir_path / f"{stem}_summary.png"
    plt.tight_layout()
    plt.savefig(str(summary_path), dpi=150, bbox_inches='tight')
    plt.close()


def compute_sobel_edges(img_tensor: torch.Tensor) -> torch.Tensor:
    """Compute Sobel edge magnitude from a (C, H, W) float tensor."""
    gray = img_tensor.mean(dim=0, keepdim=True)
    sobel_x = torch.tensor(
        [[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]],
        device=img_tensor.device
    ).view(1, 1, 3, 3)
    sobel_y = torch.tensor(
        [[-1., -2., -1.], [0., 0., 0.], [1., 2., 1.]],
        device=img_tensor.device
    ).view(1, 1, 3, 3)
    gray_b = gray.unsqueeze(0)
    grad_x = F.conv2d(gray_b, sobel_x, padding=1)
    grad_y = F.conv2d(gray_b, sobel_y, padding=1)
    return torch.sqrt(grad_x ** 2 + grad_y ** 2).squeeze()


def angular_diff(R1: np.ndarray, R2: np.ndarray) -> float:
    cos_theta = (np.trace(R1 @ R2.T) - 1) / 2
    return float(np.degrees(np.arccos(np.clip(cos_theta, -1.0, 1.0))))


def scale_K_matrix(K: np.ndarray, src_hw: tuple, dst_hw: tuple) -> np.ndarray:
    src_H, src_W = src_hw
    dst_H, dst_W = dst_hw
    sx, sy = dst_W / src_W, dst_H / src_H
    K2 = np.asarray(K, dtype=np.float64).copy()
    K2[0, 0] *= sx; K2[0, 2] *= sx
    K2[1, 1] *= sy; K2[1, 2] *= sy
    return K2


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline class
# ─────────────────────────────────────────────────────────────────────────────

class FastLocalizationPipeline:
    """Warm-up once, then call estimate_pose() per frame."""

    def __init__(self, cfg: PipelineRunConfig, device: str = 'cuda', matcher_key: str = 'minima(RoMa)',
                 normal_model: str = 'moge2-vits'):
        self.device = device
        self.cfg = cfg
        self.target_hw = (cfg.render_h // 2, cfg.render_w // 2)
        self.matcher_key = matcher_key
        self.normal_model_key = normal_model

        self.normal_estimator = load_normal_estimator(normal_model, device)

        # Load imcui config
        app_yaml_path = str(_ROOT / "thirdparty" / "image-matching-webui" / "config" / "app.yaml")
        with open(app_yaml_path, 'r') as f:
            app_config = yaml.safe_load(f)
        
        matcher_zoo = app_config.get("matcher_zoo", {})
        if matcher_key not in matcher_zoo:
            raise ValueError(f"Matcher key {matcher_key} not found in app.yaml")
        
        import copy
        self.model_info = matcher_zoo[matcher_key]
        self.is_dense = self.model_info.get("dense", True)
        
        print(f"Loading Matcher: {matcher_key} (Dense: {self.is_dense})...")
        if self.is_dense:
            match_c = copy.deepcopy(match_dense.confs[self.model_info["matcher"]])
        else:
            match_c = copy.deepcopy(match_features.confs[self.model_info["matcher"]])

        match_c["model"]["match_threshold"] = 0.2
        match_c["model"]["max_keypoints"] = 2000
        
        Model = dynamic_load(matchers, match_c["model"]["name"])
        self.matcher = Model(match_c["model"]).eval().to(device)
        self.match_conf = match_c
        
        if not self.is_dense:
            feat_c = copy.deepcopy(extract_features.confs[self.model_info["feature"]])
            feat_c["model"]["max_keypoints"] = 2000
            feat_c["model"]["keypoint_threshold"] = 0.05
            FeatModel = dynamic_load(extractors, feat_c["model"]["name"])
            self.extractor = FeatModel(feat_c["model"]).eval().to(device)
            self.feat_conf = feat_c

        print("Models loaded successfully.")

    def estimate_pose(
        self,
        sample: dict,
        lod_full: LoD,
        K: np.ndarray,
        uav_mode: str = 'normal',
        lod_mode: str = 'normal',
        num_iterations: int = 1,
        vis: bool = False,
    ) -> tuple[np.ndarray, dict, dict]:
        """
        Returns
        -------
        w2c_best : (4,4) ndarray   Best refined world-to-camera pose.
        timings  : dict            Sub-step timing info (seconds).
        """
        torch.cuda.empty_cache()
        t_start_all = time.time()
        target_h, target_w = self.target_hw
        img_path = sample['img_path']
        w2c_gps = sample['w2c_gps']
        w2c_current = w2c_gps.copy()
        vis_data = {'history': []}

        fast_enc_res = max(target_h, target_w)

        # ── Normal estimator inference ───────────────────────────────────
        t0 = time.time()
        pred_n_np = self.normal_estimator.infer(img_path, self.target_hw)
        pred_n_t = torch.from_numpy(pred_n_np).to(self.device)  # (H, W, 3)
        t_moge = time.time() - t0

        # ── Build query image ──────────────────────
        if uav_mode == 'rgb':
            img_A_pil = PILImage.open(img_path).convert('RGB').resize((target_w, target_h), PILImage.Resampling.BILINEAR)
            img_A_rgb = np.array(img_A_pil)
        elif uav_mode == 'depth':
            pred_d = pred_d_t.cpu().numpy()
            valid_d = pred_d[pred_d > 0]
            if len(valid_d) > 0:
                vmin, vmax = np.percentile(valid_d, 2), np.percentile(valid_d, 98)
                vis_img = np.clip((pred_d - vmin) / (vmax - vmin + 1e-5), 0, 1)
                img_A_rgb = (cm.magma_r(vis_img)[..., :3] * 255).astype(np.uint8)
            else:
                img_A_rgb = np.zeros((target_h, target_w, 3), dtype=np.uint8)
            img_A_pil = PILImage.fromarray(img_A_rgb)
        else:
            img_A_rgb = normal_to_rgb(pred_n_t.detach().cpu().numpy())
            img_A_pil = PILImage.fromarray(img_A_rgb)
            
        if vis:
            vis_data['img_A_rgb'] = img_A_rgb.copy()

        # ── Crop LoD specifically for this frame ──────────────────────────
        extend_total = self.cfg.crop_extend_m + 50.0
        frame_lod = lod_full.crop_to_camera_pose(
            w2c_gps, K, self.target_hw,
            margin=self.cfg.crop_margin,
            footprint_extend_m=extend_total
        )

        # ── Renderer (re-use cached renderer for this LoD + K) ────────────
        renderer = frame_lod._ensure_renderer(K, self.target_hw, device='gpu')

        c2w_gps = np.linalg.inv(w2c_gps)
        best_w2c = w2c_current.copy()
        best_metric = -1.0

        t_render_total = 0.0
        t_match_total = 0.0
        t_pnp_total = 0.0
        
        iter_history = []

        for _iter in range(num_iterations):

            # ── Render LoD from current pose ────────────────────────────
            t1 = time.time()
            w2c_t = torch.tensor(
                np.asarray(w2c_current, dtype=np.float32), device=renderer.dev
            ).unsqueeze(0)
            with torch.no_grad():
                rend_d_t, rend_n_t = renderer.render_depth_normals_batch(w2c_t)
            rend_n = rend_n_t[0].cpu().numpy()
            rend_d = rend_d_t[0].cpu().numpy()

            # Build reference image
            if lod_mode == 'depth':
                rend_d_valid = rend_d[rend_d > 0]
                if len(rend_d_valid) > 0:
                    d_min, d_max = np.nanmin(rend_d_valid), np.nanmax(rend_d_valid)
                    rend_vis = np.clip((rend_d - d_min) / (d_max - d_min + 1e-5), 0, 1)
                    rend_vis[rend_d == 0] = 0
                    img_B_rgb = (cm.magma_r(rend_vis)[..., :3] * 255).astype(np.uint8)
                else:
                    img_B_rgb = np.zeros_like(img_A_rgb)
            else:
                img_B_rgb = normal_to_rgb(rend_n)

            # Edge-alignment quality metric for best-pose bookkeeping
            rend_n_t_sq = rend_n_t[0]
            valid_mask_n = rend_d_t[0] > 0
            if valid_mask_n.sum() > 0:
                pred_n_for_edge = pred_n_t if pred_n_t.dim() == 3 else pred_n_t
                edges_pred = compute_sobel_edges(pred_n_for_edge.permute(2, 0, 1))
                edges_rend = compute_sobel_edges(rend_n_t_sq.permute(2, 0, 1))
                ep = edges_pred[valid_mask_n]
                er = edges_rend[valid_mask_n]
                edge_align = float((ep / (ep.norm() + 1e-8) * er / (er.norm() + 1e-8)).sum())
            else:
                edge_align = -1.0


            img_B_pil = PILImage.fromarray(img_B_rgb)
            t_render_total += time.time() - t1
            
            if vis:
                metrics_dict = {
                    't_err': -1.0, 'r_err': -1.0, 'edge_align': edge_align,
                    'match_inliers': 0, 'pnp_inliers': 0, 'inlier_A': None, 'inlier_B': None
                }
                if 'w2c_gt' in sample:
                    metrics_dict['t_err'] = np.linalg.norm(np.linalg.inv(w2c_current)[:3, 3] - np.linalg.inv(sample['w2c_gt'])[:3, 3])
                    metrics_dict['r_err'] = angular_diff(w2c_current[:3, :3], sample['w2c_gt'][:3, :3])
                vis_data['history'].append({'img_B_rgb': img_B_rgb.copy(), 'metrics': metrics_dict})

            # ── Feature matching ──────────────────────────────
            t2 = time.time()
            with torch.no_grad():
                if self.is_dense:
                    # dense match expects dict of pre-processing conf
                    prep = self.match_conf.get("preprocessing", {})
                    # default prep
                    prep_conf = EasyDict({
                        "grayscale": prep.get("grayscale", True),
                        "resize_max": prep.get("resize_max", 1024),
                        "dfactor": prep.get("dfactor", 8),
                        "force_resize": False,
                    })
                    pred = match_dense.match_images(self.matcher, img_A_rgb, img_B_rgb, prep_conf, device=self.device)
                    pts_A_np = pred['mkeypoints0_orig']
                    pts_B_np = pred['mkeypoints1_orig']
                else:
                    # sparse match expects features
                    prep = self.feat_conf.get("preprocessing", {})
                    prep_conf = {
                        "grayscale": prep.get("grayscale", True),
                        "resize_max": prep.get("resize_max", 1024),
                        "dfactor": prep.get("dfactor", 8),
                        "force_resize": False,
                    }
                    pred0 = extract_features.extract(self.extractor, img_A_rgb, prep_conf)
                    pred1 = extract_features.extract(self.extractor, img_B_rgb, prep_conf)
                    pred = match_features.match_images(self.matcher, pred0, pred1)
                    pts_A_np = pred['mkeypoints0_orig']
                    pts_B_np = pred['mkeypoints1_orig']

            # Ensure (N, 2) shape — mkeypoints*_orig can be (0,) when no matches
            pts_A_np = np.reshape(pts_A_np, (-1, 2))
            pts_B_np = np.reshape(pts_B_np, (-1, 2))

            # Filter to correspondences that land on valid LoD depth
            pts_B_int = np.round(pts_B_np).astype(int)
            in_bounds = (
                (pts_B_int[:, 0] >= 0) & (pts_B_int[:, 0] < target_w) &
                (pts_B_int[:, 1] >= 0) & (pts_B_int[:, 1] < target_h)
            )
            valid = np.zeros(len(pts_B_np), dtype=bool)
            valid[in_bounds] = rend_d[pts_B_int[in_bounds, 1], pts_B_int[in_bounds, 0]] > 0
            pts_A_np = pts_A_np[valid]
            pts_B_np = pts_B_np[valid]
            t_match_total += time.time() - t2

            # ── PnP ───────────────────────────────────────────────────
            t3 = time.time()
            if len(pts_A_np) < 10:
                t_pnp_total += time.time() - t3
                break

            H_mat, mask = cv2.findHomography(pts_B_np, pts_A_np, cv2.USAC_MAGSAC, 8.0, 0.9999)
            if mask is None:
                t_pnp_total += time.time() - t3
                break
            mask = mask.flatten().astype(bool)
            inlier_A = pts_A_np[mask]
            inlier_B = pts_B_np[mask]
            
            if vis:
                vis_data['history'][-1]['metrics']['match_inliers'] = int(mask.sum())
                vis_data['history'][-1]['metrics']['inlier_A'] = inlier_A.copy()
                vis_data['history'][-1]['metrics']['inlier_B'] = inlier_B.copy()
                vis_data['history'][-1]['H_mat'] = H_mat.copy()

            if len(inlier_A) < 10:
                t_pnp_total += time.time() - t3
                break

            # Unproject LoD correspondences to 3D world
            pts_3d, pts_2d = [], []
            c2w_current = np.linalg.inv(w2c_current)
            
            # Use ALL valid points (pts_A_np, pts_B_np) rather than Homography inliers
            for i in range(len(pts_B_np)):
                u_b, v_b = pts_B_np[i]
                ui, vi = int(round(u_b)), int(round(v_b))
                if ui < 0 or ui >= target_w or vi < 0 or vi >= target_h:
                    continue
                z = rend_d[vi, ui]
                if z <= 0:
                    continue
                x = (u_b - K[0, 2]) * z / K[0, 0]
                y = (v_b - K[1, 2]) * z / K[1, 1]
                pt_world = (c2w_current @ np.array([x, y, z, 1.0]))[:3]
                pts_3d.append(pt_world)
                pts_2d.append(pts_A_np[i])

            pts_3d = np.array(pts_3d, dtype=np.float32)
            pts_2d = np.array(pts_2d, dtype=np.float32)

            if len(pts_3d) < 6:
                t_pnp_total += time.time() - t3
                break

            ret, rvec, tvec, _inliers = cv2.solvePnPRansac(
                pts_3d, pts_2d, K.astype(np.float32), None,
                reprojectionError=8.0,
                iterationsCount=1000,
                flags=cv2.SOLVEPNP_ITERATIVE
            )

            if ret:
                if vis and _inliers is not None:
                    vis_data['history'][-1]['metrics']['pnp_inliers'] = int(len(_inliers))
                R_pred, _ = cv2.Rodrigues(rvec)
                w2c_pred = np.eye(4)
                w2c_pred[:3, :3] = R_pred
                w2c_pred[:3, 3] = tvec.flatten()

                c2w_pred = np.linalg.inv(w2c_pred)
                div_t = np.linalg.norm(c2w_pred[:3, 3] - c2w_gps[:3, 3])
                div_r = angular_diff(w2c_pred[:3, :3], w2c_gps[:3, :3])

                # Divergence guard
                if div_t > 45.0 or div_r > 25.0:
                    t_pnp_total += time.time() - t3
                    break

                # Track metrics but always accept the iteration's pose as the new current pose
                num_inliers = len(_inliers) if _inliers is not None else 0
                print(f"[Iter {_iter}] div_t(GPS): {div_t:.2f}m | div_r(GPS): {div_r:.2f}deg | edge_align: {edge_align:.3f} | pnp_inliers: {num_inliers}")

                w2c_current = w2c_pred
                iter_history.append({
                    'iter': _iter,
                    'w2c': w2c_current.copy(),
                    'pnp_inliers': num_inliers,
                    'edge_align': edge_align
                })

            t_pnp_total += time.time() - t3

        # Use the final non-diverged iteration's pose
        best_w2c = w2c_current.copy()

        t_total = time.time() - t_start_all
        timings = {
            'moge':  t_moge,
            'render': t_render_total,
            'match': t_match_total,
            'pnp':   t_pnp_total,
            'total': t_total,
        }
        tqdm.write(
            f"  Timing — MoGe:{t_moge:.2f}s  Render:{t_render_total:.2f}s  "
            f"Match:{t_match_total:.2f}s  PnP:{t_pnp_total:.2f}s  "
            f"Total:{t_total:.2f}s"
        )
        if vis and 'w2c_gt' in sample:
            w2c_t_gt = torch.tensor(np.asarray(sample['w2c_gt'], dtype=np.float32), device=renderer.dev).unsqueeze(0)
            with torch.no_grad():
                rend_d_gt_t, rend_n_gt_t = renderer.render_depth_normals_batch(w2c_t_gt)
            if lod_mode == 'depth':
                rend_d_gt = rend_d_gt_t[0].cpu().numpy()
                rend_d_valid = rend_d_gt[rend_d_gt > 0]
                if len(rend_d_valid) > 0:
                    d_min, d_max = np.nanmin(rend_d_valid), np.nanmax(rend_d_valid)
                    rend_vis = np.clip((rend_d_gt - d_min) / (d_max - d_min + 1e-5), 0, 1)
                    rend_vis[rend_d_gt == 0] = 0
                    img_gt_rgb = (cm.magma_r(rend_vis)[..., :3] * 255).astype(np.uint8)
                else:
                    img_gt_rgb = np.zeros_like(img_A_rgb)
            else:
                img_gt_rgb = normal_to_rgb(rend_n_gt_t[0].cpu().numpy())
            vis_data['img_gt_rgb'] = img_gt_rgb

        return best_w2c, iter_history, timings, vis_data


# ─────────────────────────────────────────────────────────────────────────────
# Reporting
# ─────────────────────────────────────────────────────────────────────────────

def _save_metrics_json(all_metrics: list[dict], out_dir: str) -> None:
    """Persist per-frame metrics (JSON-serialisable subset) to <out>/metrics.json."""
    def _json_safe(v):
        if isinstance(v, (np.floating, float)):
            return float(v)
        if isinstance(v, (np.integer, int)):
            return int(v)
        if isinstance(v, np.ndarray):
            return v.tolist()
        return v

    safe = [
        {k: _json_safe(v) for k, v in m.items() if k != 'w2c_pred'}
        for m in all_metrics
    ]
    path = os.path.join(out_dir, 'metrics.json')
    with open(path, 'w') as f:
        json.dump(safe, f, indent=2)
    print(f"Saved per-frame metrics → {path}")


def _print_matching_summary(all_metrics: list[dict], num_iterations: int) -> None:
    """Summary table: GPS baseline vs. Matching result, recall @ 1/2/3/5 m."""
    if not all_metrics:
        return

    stages = [
        ('GPS prior',   'gps_prior_t_err',        'gps_prior_r_err'),
    ]
    for it in range(num_iterations):
        stages.append((f'Matching (Iter {it+1})', f'iter_{it}_te', f'iter_{it}_re'))
    
    stages.append(('Strategy: Max Inliers', 'strategy_max_inliers_te', 'strategy_max_inliers_re'))
    stages.append(('Strategy: Max Edge', 'strategy_max_edge_te', 'strategy_max_edge_re'))
    stages.append(('Matching (Final)',    'pnp_best_overall_t_err',  'pnp_best_overall_r_err'))

    n = len(all_metrics)
    print(f"\n{'=' * 82}")
    print(f"  MATCHING PIPELINE — POSE ERROR SUMMARY  ({n} frames)")
    print(f"{'=' * 82}")
    hdr = (
        f"  {'method':<24} {'TE(m)':>7} {'RE(°)':>7} "
        f"{'R@1m':>6} {'R@2m':>6} {'R@3m':>6} {'R@5m':>6}"
    )
    print(hdr)
    print(f"  {'-' * 78}")

    for name, te_key, re_key in stages:
        tes = _safe_metrics([m.get(te_key) for m in all_metrics])
        res = _safe_metrics([m.get(re_key) for m in all_metrics])
        if not tes:
            continue
        te_med = float(np.median(tes))
        re_med = float(np.median(res)) if res else float('nan')
        r1 = _recall_pct([m.get(te_key) for m in all_metrics], 1.0)
        r2 = _recall_pct([m.get(te_key) for m in all_metrics], 2.0)
        r3 = _recall_pct([m.get(te_key) for m in all_metrics], 3.0)
        r5 = _recall_pct([m.get(te_key) for m in all_metrics], 5.0)
        print(
            f"  {name:<24} {te_med:7.2f} {re_med:7.2f} "
            f"{r1:5.0f}% {r2:5.0f}% {r3:5.0f}% {r5:5.0f}%"
        )

    # Per-frame breakdown
    if n > 1:
        print(f"\n  Per-frame final TE / RE  (m / °):")
        for m in all_metrics:
            stem = os.path.splitext(m.get('frame', '?'))[0]
            te = m.get('pnp_best_overall_t_err', float('nan'))
            re = m.get('pnp_best_overall_r_err', float('nan'))
            gps_te = m.get('gps_prior_t_err', float('nan'))
            delta = te - gps_te if (not np.isnan(te) and not np.isnan(gps_te)) else float('nan')
            delta_s = f"{delta:+.2f}" if not np.isnan(delta) else "  ?"
            print(f"    {stem:<40} TE={te:6.2f}m  RE={re:5.2f}°  Δ={delta_s}m")

    print(f"{'=' * 82}\n")


# ─────────────────────────────────────────────────────────────────────────────
# main()
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset', type=str, default='uavd4l',
                        choices=['uavd4l', 'swiss_epfl', 'semcitylocked'])
    parser.add_argument('--data_root', type=str, default=None,
                        help='Dataset root (default: data/UAVD4L-LoD/<split> or data/Swiss-EPFL)')
    parser.add_argument('--split', type=str, default='inTraj',
                        choices=['inTraj', 'outTraj', 'inPlace', 'outPlace'])
    parser.add_argument('--out', type=str, default='outputs/eval_matching',
                        help='Output directory for metrics JSON and logs.')
    parser.add_argument('--img_name', '--fname', type=str, default=None,
                        help='Evaluate a single image by name.')
    parser.add_argument('--n', type=int, default=None,
                        help='Max number of frames to evaluate.')
    parser.add_argument('--uav_mode', type=str, default='normal',
                        choices=['rgb', 'normal', 'depth'],
                        help='UAV modality.')
    parser.add_argument('--lod_mode', type=str, default='normal',
                        choices=['normal', 'depth'],
                        help='LoD modality.')
    parser.add_argument('--matcher_key', type=str, default='minima(RoMa)',
                        help='Matcher key from imcui app.yaml.')
    parser.add_argument('--vis', action='store_true', help='Generate iterative visualisation plots.')
    parser.add_argument('--num_iterations', type=int, default=5,
                        help='Number of pose-refinement iterations.')
    parser.add_argument('--mesh_path', type=str, default=None,
                        help='Override LoD mesh path.')
    parser.add_argument('--batchsize', type=int, default=None,
                        help='GPU render batch size (overrides config).')
    parser.add_argument('--device', type=str,
                        default='cuda' if torch.cuda.is_available() else 'cpu')
    parser.add_argument('--config', type=str, default=None,
                        help='Path to a custom pipeline YAML config.')
    parser.add_argument('--perturb_gt_t', type=float, default=0.0,
                        help='Translation noise to add to GT pose instead of using GPS (meters)')
    parser.add_argument('--perturb_gt_r', type=float, default=0.0,
                        help='Rotation noise to add to GT pose instead of using GPS (degrees)')
    parser.add_argument('--random_seed', type=int, default=None)
    parser.add_argument('--normal_model', type=str, default='moge2-vits',
                        choices=NORMAL_MODEL_KEYS,
                        help='Normal estimator backbone for the UAV image '
                             '(default: moge2-vits). Options: '
                             + ', '.join(NORMAL_MODEL_KEYS))
    parser.add_argument('--stride', type=int, default=1,
                        help='Evaluate only every N-th frame.')
    args = parser.parse_args()

    # ── Resolve config + data root ────────────────────────────────────────
    if args.data_root is None:
        if args.dataset == 'uavd4l':
            args.data_root = f'data/UAVD4L-LoD/{args.split}'
        elif args.dataset == 'semcitylocked':
            args.data_root = 'data/SemCityLockeD'
        else:
            args.data_root = 'data/Swiss-EPFL'

    cfg = PipelineRunConfig.resolve(
        args.dataset, args.data_root, split=args.split, config_path=args.config
    )
    target_h, target_w = cfg.render_h // 2, cfg.render_w // 2

    os.makedirs(args.out, exist_ok=True)
    print(f"Pipeline config: {cfg.name}  (profile={cfg.profile})")
    print(f"Output directory: {args.out}")

    # ── Dataset ──────────────────────────────────────────────────────────
    fname_list = [args.img_name] if args.img_name else None
    if args.dataset == 'uavd4l':
        dataset = UAVD4LDataset(
            data_root=args.data_root,
            render_size=(target_h, target_w),
            fname=fname_list,
            n=args.n,
        )
    elif args.dataset == 'semcitylocked':
        dataset = SemCityLockeDDataset(
            data_root=args.data_root,
            render_size=(target_h, target_w),
            fname=fname_list,
            n=args.n,
        )
    else:
        dataset = SwissEPFLDataset(
            data_root=args.data_root,
            split=args.split,
            render_size=(target_h, target_w),
            fname=fname_list,
            n=args.n,
        )
    if args.stride > 1:
        dataset.frames = dataset.frames[::args.stride]
        
    print(f"Evaluating {len(dataset)} frames at render size {target_h}×{target_w}")

    if len(dataset) == 0:
        print("Dataset is empty — nothing to do.")
        return

    if args.perturb_gt_t > 0.0 or args.perturb_gt_r > 0.0:
        print(f"  [Robustness] Perturbing GT poses by t={args.perturb_gt_t}m, r={args.perturb_gt_r}deg")
        if args.random_seed is not None:
            np.random.seed(args.random_seed)
        
        for img_name in dataset.frames:
            w2c_gt = dataset.gt_poses.get(img_name)
            if w2c_gt is not None:
                # Add uniform noise in [-args.perturb_gt_t, args.perturb_gt_t]
                t_noise = np.random.uniform(-args.perturb_gt_t, args.perturb_gt_t, size=3)
                r_noise = np.eye(3)
                if args.perturb_gt_r > 0.0:
                    r_euler = np.random.uniform(-args.perturb_gt_r, args.perturb_gt_r, size=3)
                    
                    # Option A: Drones don't flip upside down. Cap Pitch/Roll noise to realistic ±5 deg.
                    # Yaw (r_euler[2]) still gets the full [-args.perturb_gt_r, args.perturb_gt_r] noise.
                    r_euler[0] = np.clip(r_euler[0], -5.0, 5.0)
                    r_euler[1] = np.clip(r_euler[1], -5.0, 5.0)
                    
                    r_noise = Rotation.from_euler('xyz', r_euler, degrees=True).as_matrix()
                
                # Apply noise to c2w
                c2w_gt = np.linalg.inv(w2c_gt)
                c2w_gt[:3, 3] += t_noise
                c2w_gt[:3, :3] = r_noise @ c2w_gt[:3, :3]
                w2c_pert = np.linalg.inv(c2w_gt)
                
                dataset.gps_poses[img_name] = w2c_pert
                stem = os.path.splitext(img_name)[0]
                if hasattr(dataset, 'gps_poses_stem'):
                    dataset.gps_poses_stem[stem] = w2c_pert


    # ── LoD mesh ─────────────────────────────────────────────────────────
    mesh_path = cfg.mesh_path_for(args.dataset, args.mesh_path)
    print(f"Loading mesh: {mesh_path} ...")
    if str(mesh_path).endswith('.npz'):
        lod_full = LoD.from_npz(mesh_path)
    else:
        lod_full = LoD(mesh_path)
    batchsize = args.batchsize if args.batchsize is not None else cfg.cv_batch_size
    lod_full.set_batch_size(batchsize)
    print(f"  {lod_full.num_vertices} vertices, {lod_full.num_faces} faces")

    # Removed global crop logic, handled per-frame in estimate_pose.

    # ── Build pipeline (loads models + warm-up) ───────────────────────────
    pipeline = FastLocalizationPipeline(cfg, args.device, args.matcher_key,
                                         normal_model=args.normal_model)
    print(f"  Normal estimator: {args.normal_model}")

    # ── Per-frame evaluation loop ─────────────────────────────────────────
    all_metrics: list[dict] = []
    n_frames = len(dataset)

    frame_pbar = tqdm(
        enumerate(dataset),
        total=n_frames,
        desc="Matching",
        unit="frame",
        dynamic_ncols=True,
        file=sys.stdout,
    )

    for frame_idx, sample in frame_pbar:
        img_name  = sample['img_name']
        img_path  = sample['img_path']
        K         = sample['K']
        w2c_gt    = sample.get('w2c_gt')
        gt_pose   = sample.get('gt_pose')
        w2c_gps   = sample['w2c_gps']

        stem = os.path.splitext(img_name)[0]
        tqdm.write(f"\n[{frame_idx + 1}/{n_frames}] {img_name}")

        # GPS baseline error
        gps_te, gps_re = (
            pnp_pose_error(CameraPose.from_w2c(w2c_gps), gt_pose)
            if gt_pose is not None
            else (float('nan'), float('nan'))
        )
        tqdm.write(f"  GPS prior:  t={gps_te:.2f}m  R={gps_re:.2f}°")


        # ── Ablation Selection ──────────────────────────────────────────
        with torch.no_grad():
            renderer = lod_full._ensure_renderer(K, (cfg.render_h // 2, cfg.render_w // 2), device='gpu')
            w2c_gps_t = torch.tensor(np.asarray(w2c_gps, dtype=np.float32), device=renderer.dev)
            color_map, id_map = renderer.render_segmentation(w2c_gps_t, mode="instance")
            visible_bids, counts = np.unique(id_map, return_counts=True)
            valid_idx = visible_bids > 0
            visible_bids = visible_bids[valid_idx]
            counts = counts[valid_idx]

            valid_size_idx = counts >= 100
            visible_bids = visible_bids[valid_size_idx]
            counts = counts[valid_size_idx]

            if len(visible_bids) >= 3:
                sorted_idx = np.argsort(counts)
                smallest_bid = int(visible_bids[sorted_idx[0]])
                mid_bid = int(visible_bids[sorted_idx[len(sorted_idx) // 2]])
                largest_bid = int(visible_bids[sorted_idx[-1]])
            else:
                smallest_bid = mid_bid = largest_bid = None

        ablation_scenarios = [
            ("Baseline", []),
            ("Missing_Small", [smallest_bid] if smallest_bid else []),
            ("Missing_Mid", [mid_bid] if mid_bid else []),
            ("Missing_Large", [largest_bid] if largest_bid else []),
        ]

        for scenario_name, dropped_bids in ablation_scenarios:
            lod_full.ignore_buildings(dropped_bids)
            print(f"\n  === Scenario: {scenario_name} (Dropped: {dropped_bids}) ===")
            # Run matching pipeline
            w2c_pred, iter_history, timings, vis_data = pipeline.estimate_pose(
                sample, lod_full, K,
                uav_mode=args.uav_mode,
                lod_mode=args.lod_mode,
                num_iterations=args.num_iterations,
                vis=args.vis,
            )

            if args.vis:
                _generate_vis_plot(sample, vis_data, args.out, target_h, target_w, args.uav_mode)

            # Prediction error
            pred_te, pred_re = (
                pnp_pose_error(CameraPose.from_w2c(w2c_pred), gt_pose)
                if gt_pose is not None
                else (float('nan'), float('nan'))
            )
            tqdm.write(f"  Prediction: t={pred_te:.2f}m  R={pred_re:.2f}°")

            frame_pbar.set_postfix(TE=f"{pred_te:.1f}m", t=f"{timings['total']:.2f}s")

            metrics = {
                'frame': img_name,
                'scenario': scenario_name,
                'dropped_bids': dropped_bids,
                'frame':                   img_name,
                'normal_model':            args.normal_model,
                'gps_prior_t_err':         gps_te,
                'gps_prior_r_err':         gps_re,
                'pnp_best_overall_t_err':  pred_te,
                'pnp_best_overall_r_err':  pred_re,
                't_moge':                  timings['moge'],
                't_render':                timings['render'],
                't_match':                 timings['match'],
                't_pnp':                   timings['pnp'],
                't_total':                 timings['total'],
            }

            # Calculate ablation metrics
            if gt_pose is not None and len(iter_history) > 0:
                for h in iter_history:
                    it = h['iter']
                    te, re = pnp_pose_error(CameraPose.from_w2c(h['w2c']), gt_pose)
                    metrics[f'iter_{it}_te'] = te
                    metrics[f'iter_{it}_re'] = re
                    metrics[f'iter_{it}_inliers'] = h['pnp_inliers']
                    metrics[f'iter_{it}_edge'] = h['edge_align']

                # Compute best-inliers strategy
                best_inliers_h = max(iter_history, key=lambda x: x['pnp_inliers'])
                te, re = pnp_pose_error(CameraPose.from_w2c(best_inliers_h['w2c']), gt_pose)
                metrics['strategy_max_inliers_te'] = te
                metrics['strategy_max_inliers_re'] = re

                # Compute best-edge strategy
                best_edge_h = max(iter_history, key=lambda x: x['edge_align'])
                te, re = pnp_pose_error(CameraPose.from_w2c(best_edge_h['w2c']), gt_pose)
                metrics['strategy_max_edge_te'] = te
                metrics['strategy_max_edge_re'] = re

            all_metrics.append(metrics)

        lod_full.ignore_buildings([])
        # Flush intermediate metrics so slurm logs are readable live
        if (frame_idx + 1) % 10 == 0 or (frame_idx + 1) == n_frames:
            _save_metrics_json(all_metrics, args.out)


    # ── Final reporting ───────────────────────────────────────────────────
    import csv
    print("=" * 60)
    print(f"PIPELINE COMPLETED  ({len(all_metrics)} evaluations)")
    print("=" * 60)
    
    ablation_csv_path = os.path.join(args.out, "ablation_results.csv")
    with open(ablation_csv_path, "w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["frame", "scenario", "dropped_bids", "gps_te", "gps_re", "te", "re", "strategy_max_inliers_te", "strategy_max_inliers_re", "strategy_max_edge_te", "strategy_max_edge_re"])
        for m in all_metrics:
            writer.writerow([
                m.get("frame", ""),
                m.get("scenario", ""),
                str(m.get("dropped_bids", [])),
                f"{m.get('gps_prior_t_err', float('nan')):.2f}",
                f"{m.get('gps_prior_r_err', float('nan')):.2f}",
                f"{m.get('pnp_best_overall_t_err', float('nan')):.2f}",
                f"{m.get('pnp_best_overall_r_err', float('nan')):.2f}",
                f"{m.get('strategy_max_inliers_te', float('nan')):.2f}",
                f"{m.get('strategy_max_inliers_re', float('nan')):.2f}",
                f"{m.get('strategy_max_edge_te', float('nan')):.2f}",
                f"{m.get('strategy_max_edge_re', float('nan')):.2f}",
            ])
            
    print(f"Saved ablation results to {ablation_csv_path}")
    print("Done.")

if __name__ == '__main__':
    main()
