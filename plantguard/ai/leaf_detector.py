import cv2
import numpy as np

class LeafDetector:
    """
    OpenCV-based plant leaf detection and quality validator.
    Ensures input frame contains a single clear leaf before running deep neural models.
    """

    def __init__(self, blur_threshold=35.0, min_leaf_ratio=0.035, max_leaf_ratio=0.75):
        self.blur_threshold = blur_threshold
        self.min_leaf_ratio = min_leaf_ratio
        self.max_leaf_ratio = max_leaf_ratio

    def check_blur(self, gray_image):
        """Calculates variance of the Laplacian to evaluate image focus / blur."""
        laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
        variance = laplacian.var()
        return variance

    def detect_leaf(self, image_bgr):
        """
        Detects if a valid single leaf is in the frame.
        
        Returns:
            dict with:
                - status: 'valid_single_leaf', 'no_leaf', 'multiple_leaves', or 'low_quality'
                - is_valid: bool
                - message: str
                - confidence: float (0.0 to 1.0)
                - bbox: (x, y, w, h) or None
                - leaf_mask: binary mask of detected leaf or None
                - blur_score: float
        """
        h, w = image_bgr.shape[:2]
        total_pixels = h * w

        # 1. Quality & Lighting Check
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        blur_score = self.check_blur(gray)

        if mean_brightness < 25 or mean_brightness > 240 or blur_score < self.blur_threshold:
            return {
                'status': 'low_quality',
                'is_valid': False,
                'message': 'Image quality too low. Please adjust lighting and hold the leaf steady.',
                'confidence': 0.20,
                'bbox': None,
                'leaf_mask': None,
                'blur_score': float(blur_score)
            }

        # 2. Plant Foliage Mask Extraction (Color segmentation in HSV & Lab color spaces)
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        
        # Green foliage spectrum
        lower_green = np.array([25, 35, 35])
        upper_green = np.array([88, 255, 255])
        mask_green = cv2.inRange(hsv, lower_green, upper_green)

        # Chlorotic yellow / halo spectrum
        lower_yellow = np.array([16, 40, 60])
        upper_yellow = np.array([32, 255, 255])
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)

        # Necrotic brown lesion spectrum
        lower_brown = np.array([8, 45, 30])
        upper_brown = np.array([24, 230, 180])
        mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)

        combined_foliage_mask = cv2.bitwise_or(mask_green, mask_yellow)
        combined_foliage_mask = cv2.bitwise_or(combined_foliage_mask, mask_brown)

        # Morphological filtering to clean noise and bridge leaf veins
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        cleaned_mask = cv2.morphologyEx(combined_foliage_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel, iterations=1)

        # 3. Contour Analysis for Single vs Multiple Leaves
        contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {
                'status': 'no_leaf',
                'is_valid': False,
                'message': 'Please place a single leaf clearly inside the camera frame.',
                'confidence': 0.10,
                'bbox': None,
                'leaf_mask': None,
                'blur_score': float(blur_score)
            }

        # Sort contours by area descending
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        largest_contour = contours[0]
        largest_area = cv2.contourArea(largest_contour)
        leaf_coverage = largest_area / total_pixels

        # Check if largest contour is too small
        if leaf_coverage < self.min_leaf_ratio:
            return {
                'status': 'no_leaf',
                'is_valid': False,
                'message': 'Please place a single leaf clearly inside the camera frame.',
                'confidence': 0.15,
                'bbox': None,
                'leaf_mask': None,
                'blur_score': float(blur_score)
            }

        # Check for multiple prominent leaves
        if len(contours) > 1:
            second_largest_area = cv2.contourArea(contours[1])
            # If second leaf is at least 45% the size of the first leaf, warn multiple leaves
            if second_largest_area > largest_area * 0.45 and (second_largest_area / total_pixels) > 0.08:
                return {
                    'status': 'multiple_leaves',
                    'is_valid': False,
                    'message': 'Multiple leaves detected. Please place a single leaf clearly inside the frame.',
                    'confidence': 0.40,
                    'bbox': None,
                    'leaf_mask': None,
                    'blur_score': float(blur_score)
                }

        # Isolate single leaf mask
        leaf_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(leaf_mask, [largest_contour], -1, 255, thickness=cv2.FILLED)

        x, y, bw, bh = cv2.boundingRect(largest_contour)

        return {
            'status': 'valid_single_leaf',
            'is_valid': True,
            'message': 'Leaf detected successfully.',
            'confidence': min(0.99, 0.80 + leaf_coverage * 0.25),
            'bbox': (int(x), int(y), int(bw), int(bh)),
            'leaf_mask': leaf_mask,
            'blur_score': float(blur_score)
        }
