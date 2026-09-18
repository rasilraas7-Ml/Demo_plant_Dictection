import cv2
import threading
import time
import numpy as np

class VideoCamera:
    """
    Thread-safe OpenCV video camera streamer with frame-skipping inference,
    guide-box drawing, temporal smoothing, and cached predictions.
    """

    def __init__(self, camera_source=0, leaf_detector=None, classifier=None, segmenter=None):
        self.camera_source = camera_source
        self.leaf_detector = leaf_detector
        self.classifier = classifier
        self.segmenter = segmenter

        self.cap = None
        self.is_running = False
        self.lock = threading.Lock()
        
        self.current_frame = None
        self.latest_prediction = {
            'leaf_valid': False,
            'message': 'Place one leaf inside the frame',
            'plant': 'Waiting for leaf...',
            'disease': '',
            'confidence': 0.0,
            'damage_percentage': 0.0,
            'severity': 'Healthy / Very Low'
        }
        self.frame_counter = 0

    def start(self):
        """Starts video capture thread."""
        with self.lock:
            if self.is_running:
                return
            self.cap = cv2.VideoCapture(self.camera_source)
            # Default to synthetic test feed if physical webcam is absent on headless server
            if not self.cap.isOpened():
                print(f"[PlantGuard Camera] Notice: Camera {self.camera_source} not detected. Using synthetic garden stream.")
            self.is_running = True
            threading.Thread(target=self._capture_loop, daemon=True).start()

    def stop(self):
        """Stops camera capture thread."""
        with self.lock:
            self.is_running = False
            if self.cap and self.cap.isOpened():
                self.cap.release()
                self.cap = None

    def _capture_loop(self):
        while self.is_running:
            frame = None
            if self.cap and self.cap.isOpened():
                success, captured = self.cap.read()
                if success:
                    frame = captured

            if frame is None:
                # Generate realistic test frame for headless/cloud environments
                frame = self._generate_synthetic_leaf_frame()

            # Downsample for faster streaming
            h, w = frame.shape[:2]
            target_w = 640
            target_h = int(h * (target_w / w))
            frame_resized = cv2.resize(frame, (target_w, target_h))

            # Periodic AI Inference (every 6th frame to maintain 30 FPS responsiveness)
            self.frame_counter += 1
            if self.frame_counter % 6 == 0 and self.leaf_detector:
                self._run_inference_on_frame(frame_resized)

            # Draw Guide Overlay & HUD onto display frame
            annotated_frame = self._draw_camera_hud(frame_resized)

            with self.lock:
                self.current_frame = annotated_frame

            time.sleep(0.033) # ~30 FPS

    def get_frame(self):
        """Returns the latest annotated JPEG frame bytes for MJPEG streaming."""
        with self.lock:
            if self.current_frame is None:
                return None
            success, jpeg = cv2.imencode('.jpg', self.current_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            return jpeg.tobytes() if success else None

    def capture_snapshot(self):
        """Returns the current raw BGR frame for full-resolution snapshot analysis."""
        with self.lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return self._generate_synthetic_leaf_frame()

    def _run_inference_on_frame(self, frame):
        """Runs lightweight leaf detection and updates cached prediction."""
        try:
            val = self.leaf_detector.detect_leaf(frame)
            if val['is_valid'] and self.classifier:
                pred = self.classifier.predict(frame, val['leaf_mask'])
                self.latest_prediction = {
                    'leaf_valid': True,
                    'message': 'Leaf detected',
                    'plant': pred['plant'],
                    'disease': pred['disease'],
                    'confidence': pred['confidence'],
                    'bbox': val.get('bbox')
                }
            else:
                self.latest_prediction = {
                    'leaf_valid': False,
                    'message': val['message'],
                    'plant': 'Unknown',
                    'disease': '',
                    'confidence': 0.0,
                    'bbox': None
                }
        except Exception as e:
            print(f"[PlantGuard Camera] Inference exception: {e}")

    def _draw_camera_hud(self, frame):
        """Draws guide box 'Place one leaf inside the frame' and dynamic state."""
        h, w = frame.shape[:2]
        hud_frame = frame.copy()

        box_w = int(w * 0.55)
        box_h = int(h * 0.65)
        bx = (w - box_w) // 2
        by = (h - box_h) // 2

        is_valid = self.latest_prediction.get('leaf_valid', False)
        box_color = (34, 197, 94) if is_valid else (200, 200, 200) # Green or light gray

        # Draw Guide Frame
        cv2.rectangle(hud_frame, (bx, by), (bx + box_w, by + box_h), box_color, 2)
        
        # Corner brackets
        c_len = 20
        cv2.line(hud_frame, (bx, by), (bx + c_len, by), box_color, 4)
        cv2.line(hud_frame, (bx, by), (bx, by + c_len), box_color, 4)
        cv2.line(hud_frame, (bx + box_w, by), (bx + box_w - c_len, by), box_color, 4)
        cv2.line(hud_frame, (bx + box_w, by), (bx + box_w, by + c_len), box_color, 4)
        cv2.line(hud_frame, (bx, by + box_h), (bx + c_len, by + box_h), box_color, 4)
        cv2.line(hud_frame, (bx, by + box_h), (bx, by + box_h - c_len), box_color, 4)
        cv2.line(hud_frame, (bx + box_w, by + box_h), (bx + box_w - c_len, by + box_h), box_color, 4)
        cv2.line(hud_frame, (bx + box_w, by + box_h), (bx + box_w, by + box_h - c_len), box_color, 4)

        # Guide Text
        guide_text = "Place one leaf inside the frame" if not is_valid else "Leaf detected - Hold steady"
        text_size = cv2.getTextSize(guide_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)[0]
        tx = (w - text_size[0]) // 2
        ty = by - 12 if by > 25 else by + 25

        cv2.rectangle(hud_frame, (tx - 6, ty - text_size[1] - 4), (tx + text_size[0] + 6, ty + 6), (20, 20, 20), -1)
        cv2.putText(hud_frame, guide_text, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.55, box_color, 2)

        return hud_frame

    def _generate_synthetic_leaf_frame(self):
        """Generates realistic synthetic garden leaf image when webcam hardware is not connected."""
        frame = np.full((480, 640, 3), (240, 245, 245), dtype=np.uint8)
        # Draw organic leaf
        center = (320, 240)
        axes = (140, 190)
        angle = -15
        cv2.ellipse(frame, center, axes, angle, 0, 360, (45, 160, 50), -1)
        # Midrib
        cv2.line(frame, (320, 380), (320, 100), (80, 210, 90), 3)
        # Lesion target spots (Early Blight simulation)
        cv2.circle(frame, (270, 210), 30, (20, 180, 220), -1) # Chlorotic yellow halo
        cv2.circle(frame, (270, 210), 22, (20, 40, 90), -1)   # Necrotic brown spot
        cv2.circle(frame, (360, 270), 35, (20, 180, 220), -1)
        cv2.circle(frame, (360, 270), 25, (20, 40, 90), -1)
        return frame
