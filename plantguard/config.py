import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'plantguard-ai-secret-key-2026')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '0.0.0.0')

    # Models & Assets Paths
    MODELS_DIR = BASE_DIR / 'models'
    CLASSIFIER_MODEL_PATH = MODELS_DIR / 'disease_classifier.keras'
    SEGMENTER_MODEL_PATH = MODELS_DIR / 'damage_segmenter.keras'
    LABELS_PATH = MODELS_DIR / 'labels.json'

    # Uploads & Storage Directory
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max image size

    # Inference Configuration
    CONFIDENCE_THRESHOLD = 0.60  # Below 60% is reported as Uncertain Result
    CLASSIFIER_INPUT_SIZE = (224, 224)
    SEGMENTER_INPUT_SIZE = (256, 256)
    FRAME_SKIP_INFERENCE = 6  # Run inference every 6 frames on live camera

    # Severity Thresholds (damage percentage)
    SEVERITY_THRESHOLDS = {
        'healthy': (0, 5),
        'mild': (5, 20),
        'moderate': (20, 40),
        'severe': (40, 60),
        'critical': (60, 100)
    }

    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH = os.environ.get(
        'FIREBASE_CREDENTIALS_PATH',
        str(BASE_DIR / 'firebase' / 'serviceAccountKey.json')
    )
    FIREBASE_STORAGE_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET', '')
    DEFAULT_USER_ID = 'demo_farmer_user'

    @classmethod
    def init_app(cls):
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(cls.MODELS_DIR, exist_ok=True)
