import os
import cv2
import uuid
import time
from pathlib import Path
from plantguard.firebase.firebase_config import get_storage, is_firebase_available

class StorageService:
    """
    Manages image uploads to Firebase Storage with automatic fallback to local uploads folder.
    Ensures large image buffers are not stored directly in Firestore.
    """

    def __init__(self, local_upload_dir='uploads'):
        self.local_upload_dir = Path(local_upload_dir)
        self.local_upload_dir.mkdir(parents=True, exist_ok=True)

    def upload_image(self, image_bgr, filename_prefix="leaf", folder="analyses"):
        """
        Uploads OpenCV BGR image.
        Returns:
            public_url: str
        """
        unique_id = uuid.uuid4().hex[:12]
        filename = f"{filename_prefix}_{int(time.time())}_{unique_id}.jpg"

        # Check Firebase Storage
        bucket = get_storage()
        if bucket is not None:
            try:
                blob = bucket.blob(f"{folder}/{filename}")
                _, buffer = cv2.imencode('.jpg', image_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
                blob.upload_from_string(buffer.tobytes(), content_type='image/jpeg')
                blob.make_public()
                return blob.public_url
            except Exception as e:
                print(f"[PlantGuard Storage] Firebase storage upload failed ({e}), falling back to local file.")

        # Fallback to local server path
        local_path = self.local_upload_dir / filename
        cv2.imwrite(str(local_path), image_bgr)
        return f"/uploads/{filename}"
