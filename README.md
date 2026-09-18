# PlantGuard AI — Real-Time Plant Disease & Damage Detector

PlantGuard AI is a real-time agricultural diagnostics platform built with **Python, Flask, OpenCV, TensorFlow/Keras, and Firebase**. It goes beyond simple image-level classification by performing **pixel-level semantic lesion segmentation** to compute the exact damage percentage and clinical severity of infected leaf tissue.

---

## Key Features

1. **Real-Time OpenCV Camera Feed**: Low-latency video pipeline with a live targeting guide box and frame-skipping AI inference.
2. **Strict Leaf Presence & Quality Validation**: OpenCV contour analysis, blur detection (Laplacian variance), and foliage color-space segmentation ensure the system only runs inference when a single valid leaf is presented.
3. **Deep Learning Classification**: MobileNetV2 transfer learning with dynamic class loading from `labels.json` and a 60% confidence floor to flag uncertain results.
4. **3-Class Lesion Segmentation (U-Net)**: Separates background (0), healthy lamina (1), and diseased lesions (2).
5. **Scientifically Accurate Damage Math**: 
   $$\text{Damage \%} = \left(\frac{\text{Damaged Leaf Area}}{\text{Detected Leaf Lamina Area}}\right) \times 100$$
   *(Calculated strictly against the detected leaf, never against the whole image background).*
6. **5-Tier Severity Metric**:
   - `0–5%`: Healthy / Very Low
   - `5–20%`: Mild
   - `20–40%`: Moderate
   - `40–60%`: Severe
   - `60–100%`: Critical
7. **Firebase Firestore & Storage Integration**: Logs analyses, confidence, lesion area, and URLs to original images and segmentation masks.

---

## Directory Layout

```text
plantguard/
├── app.py                      # Flask backend & REST API endpoints
├── config.py                   # App settings, paths, thresholds, and Firebase config
├── requirements.txt            # Python dependencies (Flask, OpenCV, TensorFlow, etc.)
├── models/
│   ├── disease_classifier.keras# Trained MobileNetV2 classifier model
│   ├── damage_segmenter.keras  # Trained U-Net lesion segmentation model
│   └── labels.json             # Dynamic plant/disease taxonomy dictionary
├── ai/
│   ├── leaf_detector.py        # OpenCV leaf validator & image quality checker
│   ├── classifier.py           # TensorFlow/Keras disease classifier
│   ├── segmenter.py            # 3-Class semantic lesion segmentation
│   ├── damage_calculator.py    # Damage % math and severity assignment
│   └── preprocessing.py        # Image normalization and conversions
├── camera/
│   └── camera.py               # OpenCV VideoCapture streaming thread with HUD
├── firebase/
│   ├── firebase_config.py      # Firebase Admin SDK initialization
│   ├── firebase_storage.py     # Image upload to Firebase Storage
│   └── database.py             # Firestore records manager with local SQLite fallback
├── templates/                  # Jinja2 Flask Web Templates
│   ├── index.html              # Main dashboard & live scanner UI
│   ├── dashboard.html          # Full-screen OpenCV video feed
│   ├── history.html            # Diagnostic history table
│   └── analysis.html           # Detailed specimen report view
├── static/
│   ├── css/style.css           # Modern dark-mode styling
│   └── js/app.js               # Client camera capture & inspection script
├── training/
│   ├── train_classifier.py     # MobileNetV2 transfer learning training pipeline
│   ├── train_segmentation.py   # U-Net 3-class lesion segmentation training pipeline
│   └── dataset/                # Dataset directory structure and guides
└── uploads/                    # Local storage fallback for analyzed frames
```

---

## Quickstart Setup

### Linux / macOS
```bash
# 1. Clone or navigate to the repository
cd plantguard

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the Flask server
python app.py
```

### Windows (PowerShell)
```powershell
# 1. Navigate to plantguard folder
cd plantguard

# 2. Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run application
python app.py
```
Open **http://localhost:5000** in your browser.

---

## REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web dashboard & live optical scanner UI |
| `GET` | `/camera` | Dedicated full-frame video stream page |
| `GET` | `/video_feed` | OpenCV MJPEG multipart stream with dynamic HUD |
| `POST` | `/api/analyze` | Full pipeline: leaf validation, classification, lesion segmentation & damage % |
| `POST` | `/capture` | Captures current frame from stream and saves analysis |
| `GET` | `/history` | History records from Firestore / Local SQLite |
| `GET` | `/analysis/<id>` | Single specimen report |
| `POST` | `/api/predict` | Classification-only endpoint |
| `POST` | `/api/segment` | Lesion segmentation-only endpoint |
| `GET` | `/api/status` | Health check & model status |

### Sample Response (`POST /api/analyze`)

```json
{
  "leaf_detected": true,
  "plant": "Tomato",
  "disease": "Early Blight",
  "scientific_name": "Alternaria solani",
  "confidence": 94.6,
  "leaf_area": 45000,
  "damaged_area": 10800,
  "damage_percentage": 24.0,
  "healthy_percentage": 76.0,
  "severity": "Moderate",
  "processed_image_url": "/uploads/annotated_1710700000.jpg",
  "mask_image_url": "/uploads/mask_1710700000.jpg",
  "is_demo_mode": false,
  "recommendations": [
    "Inspect adjacent plants for early lesion spread.",
    "Maintain dry foliage and optimize root irrigation."
  ]
}
```

---

## Model Training Pipelines

### 1. Training the Disease Classifier (MobileNetV2)
```bash
python training/train_classifier.py --dataset training/dataset/classification --epochs 25 --batch_size 32
```
Outputs trained weights to `models/disease_classifier.keras` and exports updated classes into `models/labels.json`.

### 2. Training the Lesion Segmenter (U-Net)
```bash
python training/train_segmentation.py --dataset training/dataset/segmentation --epochs 35 --lr 0.0003
```
Outputs trained weights to `models/damage_segmenter.keras`.

---

## Firebase Setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** in production mode.
3. Enable **Firebase Storage**.
4. Go to **Project Settings > Service accounts > Generate new private key**.
5. Save the downloaded JSON file as `plantguard/firebase/serviceAccountKey.json`.
6. Set the environment variable in `.env`:
   ```env
   FIREBASE_CREDENTIALS_PATH=plantguard/firebase/serviceAccountKey.json
   FIREBASE_STORAGE_BUCKET=your-app-id.appspot.com
   ```
*(Note: If Firebase credentials are not provided, PlantGuard AI automatically operates in resilient **Local Vault mode** using SQLite and local image storage without crashing).*
