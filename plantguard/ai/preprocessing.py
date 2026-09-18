import cv2
import numpy as np
from PIL import Image
import io

def load_image_from_bytes(image_bytes):
    """Decodes raw image bytes into an OpenCV BGR numpy array."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image from provided bytes.")
    return img

def preprocess_for_classifier(image_bgr, target_size=(224, 224)):
    """Preprocesses BGR image for MobileNetV2 / EfficientNet input."""
    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    # Resize with high-quality cubic interpolation
    resized = cv2.resize(img_rgb, target_size, interpolation=cv2.INTER_CUBIC)
    # Normalize pixel intensities between 0.0 and 1.0 (or -1.0 to 1.0 depending on MobileNet)
    normalized = resized.astype(np.float32) / 255.0
    # Expand dims for batch: (1, 224, 224, 3)
    return np.expand_dims(normalized, axis=0)

def preprocess_for_segmenter(image_bgr, target_size=(256, 256)):
    """Preprocesses BGR image for U-Net lesion segmentation input."""
    img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(img_rgb, target_size, interpolation=cv2.INTER_LINEAR)
    normalized = resized.astype(np.float32) / 255.0
    return np.expand_dims(normalized, axis=0)

def encode_image_to_base64(image_bgr, format='.jpg', quality=90):
    """Encodes an OpenCV image to a base64 Data URL string."""
    import base64
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality] if format == '.jpg' else []
    success, buffer = cv2.imencode(format, image_bgr, encode_params)
    if not success:
        raise ValueError("Failed to encode image to buffer.")
    b64_str = base64.b64encode(buffer).decode('utf-8')
    mime = 'image/jpeg' if format in ('.jpg', '.jpeg') else 'image/png'
    return f"data:{mime};base64,{b64_str}"
