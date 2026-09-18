import os
from pathlib import Path

_firebase_app = None
_firestore_client = None
_storage_bucket = None

def init_firebase(credentials_path=None, storage_bucket_name=None):
    """
    Safely initializes Firebase Admin SDK.
    Handles 'Firebase unavailable' gracefully so local analysis and SQLite fallback continue working.
    """
    global _firebase_app, _firestore_client, _storage_bucket
    
    if _firebase_app is not None:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, storage

        cred_path = credentials_path or os.environ.get('FIREBASE_CREDENTIALS_PATH')
        
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            options = {}
            if storage_bucket_name:
                options['storageBucket'] = storage_bucket_name
            
            _firebase_app = firebase_admin.initialize_app(cred, options)
            _firestore_client = firestore.client()
            if storage_bucket_name:
                _storage_bucket = storage.bucket(storage_bucket_name)
            print("[PlantGuard AI] Successfully initialized Firebase Admin SDK.")
            return True
        else:
            print("[PlantGuard AI] Firebase credentials not found. Operating in resilient Local Vault mode.")
            return False
    except Exception as e:
        print(f"[PlantGuard AI] Firebase unavailable ({e}). Using resilient Local Vault mode.")
        return False

def get_firestore():
    return _firestore_client

def get_storage():
    return _storage_bucket

def is_firebase_available():
    return _firestore_client is not None
