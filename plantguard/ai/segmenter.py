import os
import cv2
import numpy as np
from pathlib import Path
from plantguard.ai.preprocessing import preprocess_for_segmenter

class DamageSegmenter:
    """
    3-Class Semantic Lesion Segmentation:
        Class 0: Background
        Class 1: Healthy Leaf Lamina
        Class 2: Diseased / Damaged Lesion Area
    """

    def __init__(self, model_path=None):
        self.model = self._load_model(model_path)
        self.is_demo_mode = self.model is None

    def _load_model(self, model_path):
        """Loads trained U-Net .keras segmentation model if present."""
        if not model_path or not os.path.exists(model_path):
            return None
        try:
            import tensorflow as tf
            model = tf.keras.models.load_model(str(model_path))
            print(f"[PlantGuard AI] Successfully loaded U-Net segmenter model from {model_path}")
            return model
        except Exception as e:
            print(f"[PlantGuard AI] Notice: Could not load .keras segmenter model ({e}). Using computer-vision lesion segmentation.")
            return None

    def segment_leaf(self, image_bgr, leaf_mask=None, bbox=None):
        """
        Performs semantic lesion segmentation on leaf.
        
        Returns:
            dict containing:
                - mask_raw: (H, W) uint8 with values 0 (bg), 1 (healthy), 2 (lesion)
                - mask_colored: (H, W, 3) BGR mask image
                - overlay_bgr: (H, W, 3) BGR image with translucent lesion highlight & HUD
                - total_leaf_pixels: int (Class 1 + Class 2)
                - damaged_pixels: int (Class 2)
        """
        h, w = image_bgr.shape[:2]

        if self.model is not None:
            # 1. Run inference via loaded U-Net model
            input_tensor = preprocess_for_segmenter(image_bgr, target_size=(256, 256))
            pred_mask = self.model.predict(input_tensor, verbose=0)[0] # (256, 256, 3)
            pred_classes = np.argmax(pred_mask, axis=-1).astype(np.uint8)
            # Resize mask back to original dimensions
            mask_raw = cv2.resize(pred_classes, (w, h), interpolation=cv2.INTER_NEAREST)
        else:
            # 2. Run Algorithmic Lesion Segmentation in Color Space (Adaptive CV)
            mask_raw = self._algorithmic_segmentation(image_bgr, leaf_mask)

        # Count pixel areas
        total_leaf_pixels = int(np.sum(mask_raw > 0))
        damaged_pixels = int(np.sum(mask_raw == 2))

        # Generate Visual Damage Mask Image:
        # Background = Black [0, 0, 0]
        # Healthy Leaf = Forest Green [21, 128, 61]
        # Damaged Lesions = Vivid Red/Crimson [40, 50, 235]
        mask_colored = np.zeros((h, w, 3), dtype=np.uint8)
        mask_colored[mask_raw == 1] = [34, 139, 34]   # BGR for Healthy Green
        mask_colored[mask_raw == 2] = [40, 50, 235]   # BGR for Diseased Lesion Red

        # Generate Semi-Transparent AI Analysis Overlay
        overlay_bgr = image_bgr.copy()
        lesion_indices = (mask_raw == 2)
        
        # Blend lesion highlight onto original leaf
        overlay_bgr[lesion_indices] = cv2.addWeighted(
            image_bgr[lesion_indices], 0.45,
            np.full_like(image_bgr[lesion_indices], [30, 45, 235]), 0.55, 0
        )

        # Draw detected leaf bounding box
        if bbox is not None:
            bx, by, bw, bh = bbox
            cv2.rectangle(overlay_bgr, (bx, by), (bx + bw, by + bh), (34, 197, 94), 2)
            # Corner accents
            c_len = 16
            cv2.line(overlay_bgr, (bx, by), (bx + c_len, by), (34, 197, 94), 4)
            cv2.line(overlay_bgr, (bx, by), (bx, by + c_len), (34, 197, 94), 4)

        return {
            'mask_raw': mask_raw,
            'mask_colored': mask_colored,
            'overlay_bgr': overlay_bgr,
            'total_leaf_pixels': max(1, total_leaf_pixels),
            'damaged_pixels': min(total_leaf_pixels, damaged_pixels)
        }

    def _algorithmic_segmentation(self, image_bgr, leaf_mask=None):
        """High-precision computer-vision lesion segmentation isolating chlorosis and necrosis."""
        h, w = image_bgr.shape[:2]
        if leaf_mask is None:
            # Simple thresholding to find leaf
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
            _, leaf_mask = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)

        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        h_ch, s_ch, v_ch = cv2.split(hsv)
        b, g, r = cv2.split(image_bgr)

        # Class 1: Healthy Green tissue
        healthy_mask = (g > r * 0.90) & (g > b * 1.15) & (g > 35) & (leaf_mask > 0)

        # Class 2: Lesions (Chlorotic Yellows, Necrotic Browns, Water-soaked patches)
        chlorotic_yellow = (h_ch >= 15) & (h_ch <= 34) & (s_ch >= 35) & (leaf_mask > 0)
        necrotic_brown = (h_ch >= 6) & (h_ch <= 24) & (v_ch < 170) & (r >= g * 0.85) & (leaf_mask > 0)
        dark_water_soaked = (r < 55) & (g < 55) & (b < 55) & (leaf_mask > 0) & (r + g + b > 40)

        lesion_mask = (chlorotic_yellow | necrotic_brown | dark_water_soaked) & (leaf_mask > 0)

        # Construct final ternary mask
        mask_raw = np.zeros((h, w), dtype=np.uint8)
        mask_raw[healthy_mask] = 1
        mask_raw[lesion_mask] = 2

        return mask_raw
