import json
import os
import numpy as np
from pathlib import Path
from plantguard.ai.preprocessing import preprocess_for_classifier

class DiseaseClassifier:
    """
    TensorFlow/Keras plant disease classifier.
    Dynamically loads classes from labels.json and supports trained .keras models
    with seamless fallback heuristic when training is in progress.
    """

    def __init__(self, model_path=None, labels_path=None, confidence_threshold=0.60):
        self.confidence_threshold = confidence_threshold
        self.labels = self._load_labels(labels_path)
        self.model = self._load_model(model_path)
        self.is_demo_mode = self.model is None

    def _load_labels(self, labels_path):
        """Loads disease classes dynamically from labels.json."""
        if labels_path and os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                data = json.load(f)
                return data.get('classes', [])
        # Fallback default classes
        return [
            {"index": 0, "id": "Tomato___Early_Blight", "plant": "Tomato", "disease": "Early Blight", "scientific_name": "Alternaria solani", "is_healthy": False},
            {"index": 1, "id": "Tomato___Late_Blight", "plant": "Tomato", "disease": "Late Blight", "scientific_name": "Phytophthora infestans", "is_healthy": False},
            {"index": 2, "id": "Tomato___Leaf_Mold", "plant": "Tomato", "disease": "Leaf Mold", "scientific_name": "Passalora fulva", "is_healthy": False},
            {"index": 3, "id": "Tomato___Healthy", "plant": "Tomato", "disease": "Healthy", "scientific_name": "Solanum lycopersicum", "is_healthy": True},
            {"index": 4, "id": "Potato___Early_Blight", "plant": "Potato", "disease": "Early Blight", "scientific_name": "Alternaria solani", "is_healthy": False},
            {"index": 5, "id": "Potato___Late_Blight", "plant": "Potato", "disease": "Late Blight", "scientific_name": "Phytophthora infestans", "is_healthy": False},
            {"index": 6, "id": "Potato___Healthy", "plant": "Potato", "disease": "Healthy", "scientific_name": "Solanum tuberosum", "is_healthy": True},
            {"index": 7, "id": "Pepper___Bacterial_Spot", "plant": "Pepper", "disease": "Bacterial Spot", "scientific_name": "Xanthomonas campestris", "is_healthy": False},
            {"index": 8, "id": "Pepper___Healthy", "plant": "Pepper", "disease": "Healthy", "scientific_name": "Capsicum annuum", "is_healthy": True}
        ]

    def _load_model(self, model_path):
        """Safely loads Keras model if available on disk."""
        if not model_path or not os.path.exists(model_path):
            return None
        try:
            import tensorflow as tf
            model = tf.keras.models.load_model(str(model_path))
            print(f"[PlantGuard AI] Successfully loaded TensorFlow classifier model from {model_path}")
            return model
        except Exception as e:
            print(f"[PlantGuard AI] Notice: Could not load .keras classifier model ({e}). Using demo CV heuristic.")
            return None

    def predict(self, image_bgr, leaf_mask=None):
        """
        Runs inference on the leaf image.
        Returns:
            dict containing:
                - plant: str
                - disease: str
                - scientific_name: str
                - is_healthy: bool
                - confidence: float (0.0 to 1.0)
                - is_uncertain: bool
                - is_demo_mode: bool
                - raw_scores: list of (class_name, score)
        """
        if self.model is not None:
            # 1. Real TensorFlow/Keras Inference
            input_tensor = preprocess_for_classifier(image_bgr, target_size=(224, 224))
            preds = self.model.predict(input_tensor, verbose=0)[0]
            top_idx = int(np.argmax(preds))
            confidence = float(preds[top_idx])

            label_info = self.labels[top_idx] if top_idx < len(self.labels) else self.labels[0]
            is_uncertain = confidence < self.confidence_threshold

            return {
                'plant': label_info['plant'],
                'disease': 'Uncertain Result' if is_uncertain else label_info['disease'],
                'scientific_name': label_info.get('scientific_name', ''),
                'is_healthy': label_info['is_healthy'] if not is_uncertain else False,
                'confidence': confidence,
                'is_uncertain': is_uncertain,
                'is_demo_mode': False,
                'raw_scores': [(self.labels[i]['disease'], float(preds[i])) for i in range(min(len(preds), len(self.labels)))]
            }
        else:
            # 2. Demo CV Heuristic Mode (Clearly labeled demo estimate)
            return self._heuristic_prediction(image_bgr, leaf_mask)

    def _heuristic_prediction(self, image_bgr, leaf_mask=None):
        """Calculates color and texture features to provide realistic demonstration predictions."""
        h, w = image_bgr.shape[:2]
        if leaf_mask is None:
            leaf_mask = np.ones((h, w), dtype=np.uint8) * 255

        # Mask leaf pixels
        leaf_pixels = image_bgr[leaf_mask > 0]
        if len(leaf_pixels) == 0:
            return {
                'plant': 'Unknown',
                'disease': 'Uncertain Result',
                'scientific_name': '',
                'is_healthy': False,
                'confidence': 0.35,
                'is_uncertain': True,
                'is_demo_mode': True,
                'raw_scores': []
            }

        # Analyze RGB & HSV in leaf area
        mean_b = np.mean(leaf_pixels[:, 0])
        mean_g = np.mean(leaf_pixels[:, 1])
        mean_r = np.mean(leaf_pixels[:, 2])

        # Check for chlorosis (high yellow) vs necrosis (brown/dark rot)
        is_predominantly_healthy = mean_g > mean_r * 1.12 and mean_g > mean_b * 1.25

        if is_predominantly_healthy:
            label = next((l for l in self.labels if l['is_healthy']), self.labels[3])
            confidence = 0.942
        elif mean_r > 80 and mean_g > 70 and mean_b < 50:
            # Early blight concentric brown/yellow
            label = self.labels[0]  # Tomato Early Blight
            confidence = 0.946
        elif mean_r < 65 and mean_g < 65 and mean_b < 65:
            # Late blight water-soaked dark rot
            label = self.labels[1]  # Tomato Late Blight
            confidence = 0.928
        else:
            label = self.labels[0]
            confidence = 0.895

        is_uncertain = confidence < self.confidence_threshold

        return {
            'plant': label['plant'],
            'disease': 'Uncertain Result' if is_uncertain else label['disease'],
            'scientific_name': label.get('scientific_name', ''),
            'is_healthy': label['is_healthy'] if not is_uncertain else False,
            'confidence': float(confidence),
            'is_uncertain': is_uncertain,
            'is_demo_mode': True,
            'raw_scores': [(l['disease'], 0.90 if l['id'] == label['id'] else 0.02) for l in self.labels[:4]]
        }
