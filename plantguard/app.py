import os
import time
import cv2
import numpy as np
from datetime import datetime
from flask import Flask, render_template, Response, request, jsonify, send_from_directory

from plantguard.config import Config
from plantguard.ai.leaf_detector import LeafDetector
from plantguard.ai.classifier import DiseaseClassifier
from plantguard.ai.segmenter import DamageSegmenter
from plantguard.ai.damage_calculator import DamageCalculator
from plantguard.ai.preprocessing import load_image_from_bytes, encode_image_to_base64
from plantguard.camera.camera import VideoCamera
from plantguard.firebase.firebase_config import init_firebase, is_firebase_available
from plantguard.firebase.firebase_storage import StorageService
from plantguard.firebase.database import DatabaseService

app = Flask(__name__)
app.config.from_object(Config)
Config.init_app()

# Initialize AI & Infrastructure Services
init_firebase(Config.FIREBASE_CREDENTIALS_PATH, Config.FIREBASE_STORAGE_BUCKET)

leaf_detector = LeafDetector()
classifier = DiseaseClassifier(Config.CLASSIFIER_MODEL_PATH, Config.LABELS_PATH, Config.CONFIDENCE_THRESHOLD)
segmenter = DamageSegmenter(Config.SEGMENTER_MODEL_PATH)
storage_service = StorageService(Config.UPLOAD_FOLDER)
database_service = DatabaseService()

# Camera instance (lazy load / fallback safe)
camera = VideoCamera(camera_source=0, leaf_detector=leaf_detector, classifier=classifier, segmenter=segmenter)

# Serve uploaded images statically
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)

@app.route('/')
def index():
    """Main Web Dashboard."""
    history = database_service.get_history(limit=5)
    return render_template('index.html', history=history, is_firebase=is_firebase_available())

@app.route('/camera')
def camera_view():
    """Dedicated live camera view."""
    return render_template('dashboard.html', is_firebase=is_firebase_available())

def generate_video_frames():
    """MJPEG stream generator for live video feed."""
    camera.start()
    while True:
        frame_bytes = camera.get_frame()
        if frame_bytes is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            time.sleep(0.04)

@app.route('/video_feed')
def video_feed():
    """Live OpenCV MJPEG video stream with dynamic HUD."""
    return Response(generate_video_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/capture', methods=['POST'])
def capture_and_analyze():
    """Captures current camera frame and runs full-resolution analysis."""
    frame_bgr = camera.capture_snapshot()
    if frame_bgr is None:
        return jsonify({'error': 'Failed to capture frame from camera stream'}), 500

    result = _execute_full_pipeline(frame_bgr)
    # Save record
    if result.get('leaf_detected', False):
        database_service.save_analysis(result)
    return jsonify(result)

@app.route('/analyze', methods=['POST'])
@app.route('/api/analyze', methods=['POST'])
def analyze_uploaded_image():
    """
    POST /api/analyze
    Expects multipart form-data 'image' or raw body.
    Returns complete JSON report including damage percentage, severity, and visual masks.
    """
    if 'image' in request.files:
        file = request.files['image']
        image_bytes = file.read()
    elif request.data:
        image_bytes = request.data
    else:
        return jsonify({'error': 'No image provided. Upload an image file with key "image".'}), 400

    try:
        image_bgr = load_image_from_bytes(image_bytes)
    except Exception as e:
        return jsonify({'error': f'Invalid image format: {str(e)}'}), 400

    result = _execute_full_pipeline(image_bgr)
    
    # Save to history if valid leaf
    if result.get('leaf_detected', False):
        database_service.save_analysis(result)

    return jsonify(result)

def _execute_full_pipeline(image_bgr):
    """
    Core Pipeline:
    1. Leaf Validation
    2. Disease Classification (MobileNetV2 / Keras)
    3. Lesion Semantic Segmentation (U-Net)
    4. Damage Percentage Calculation: (damaged_area / leaf_area) * 100
    5. Severity Assignment
    """
    # 1. Leaf Detection & Quality Gate
    validation = leaf_detector.detect_leaf(image_bgr)
    if not validation['is_valid']:
        return {
            'leaf_detected': False,
            'validation_status': validation['status'],
            'message': validation['message'],
            'plant': 'Unknown',
            'disease': 'No Leaf Detected',
            'confidence': 0.0,
            'leaf_area': 0,
            'damaged_area': 0,
            'damage_percentage': 0.0,
            'healthy_percentage': 0.0,
            'severity': 'Healthy / Very Low',
            'processed_image_url': '',
            'mask_image_url': ''
        }

    # 2. Disease Classification
    pred = classifier.predict(image_bgr, validation['leaf_mask'])

    # 3. Lesion Damage Segmentation
    seg = segmenter.segment_leaf(image_bgr, validation['leaf_mask'], validation['bbox'])

    # 4. Damage Calculation
    # DENOMINATOR IS DETECTED LEAF AREA (NOT ENTIRE IMAGE)
    metrics = DamageCalculator.calculate_metrics(
        total_leaf_area=seg['total_leaf_pixels'],
        damaged_area=seg['damaged_pixels']
    )

    # 5. Image Storage / Encoding
    original_url = storage_service.upload_image(image_bgr, filename_prefix="orig")
    processed_url = storage_service.upload_image(seg['overlay_bgr'], filename_prefix="annotated")
    mask_url = storage_service.upload_image(seg['mask_colored'], filename_prefix="mask")

    return {
        'id': f"analysis_{int(time.time()*1000)}",
        'timestamp': datetime.utcnow().isoformat() + "Z",
        'leaf_detected': True,
        'validation_status': validation['status'],
        'message': validation['message'],
        'plant': pred['plant'],
        'disease': pred['disease'],
        'scientific_name': pred['scientific_name'],
        'is_healthy': pred['is_healthy'],
        'confidence': round(pred['confidence'] * 100 if pred['confidence'] <= 1.0 else pred['confidence'], 1),
        'leaf_area': metrics['leaf_area'],
        'damaged_area': metrics['damaged_area'],
        'damage_percentage': metrics['damage_percentage'],
        'healthy_percentage': metrics['healthy_percentage'],
        'severity': metrics['severity'],
        'original_image_url': original_url,
        'processed_image_url': processed_url,
        'mask_image_url': mask_url,
        'is_demo_mode': classifier.is_demo_mode or segmenter.is_demo_mode,
        'recommendations': [
            'Inspect adjacent plants for early lesion spread.',
            'Maintain dry foliage and optimize root irrigation.'
        ]
    }

@app.route('/history')
def history_view():
    """History page and API endpoint."""
    history = database_service.get_history(limit=50)
    if request.headers.get('Accept') == 'application/json':
        return jsonify(history)
    return render_template('history.html', history=history)

@app.route('/analysis/<analysis_id>')
def analysis_detail(analysis_id):
    """View detailed analysis report."""
    record = database_service.get_analysis_by_id(analysis_id)
    if not record:
        return jsonify({'error': 'Analysis record not found'}), 404
    if request.headers.get('Accept') == 'application/json':
        return jsonify(record)
    return render_template('analysis.html', record=record)

@app.route('/api/predict', methods=['POST'])
def api_predict_only():
    """Classification only endpoint."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    img = load_image_from_bytes(request.files['image'].read())
    val = leaf_detector.detect_leaf(img)
    if not val['is_valid']:
        return jsonify({'error': val['message']}), 400
    pred = classifier.predict(img, val['leaf_mask'])
    return jsonify(pred)

@app.route('/api/segment', methods=['POST'])
def api_segment_only():
    """Segmentation only endpoint."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    img = load_image_from_bytes(request.files['image'].read())
    seg = segmenter.segment_leaf(img)
    metrics = DamageCalculator.calculate_metrics(seg['total_leaf_pixels'], seg['damaged_pixels'])
    return jsonify({
        'metrics': metrics,
        'mask_b64': encode_image_to_base64(seg['mask_colored'], format='.png'),
        'overlay_b64': encode_image_to_base64(seg['overlay_bgr'], format='.jpg')
    })

@app.route('/api/status', methods=['GET'])
def api_status():
    """Health check and model telemetry."""
    return jsonify({
        'status': 'online',
        'service': 'PlantGuard AI',
        'classifier_loaded': classifier.model is not None,
        'segmenter_loaded': segmenter.model is not None,
        'firebase_available': is_firebase_available(),
        'timestamp': datetime.utcnow().isoformat() + "Z"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    print(f"Starting PlantGuard AI Flask server on http://{host}:{port}")
    app.run(host=host, port=port, debug=Config.DEBUG)
