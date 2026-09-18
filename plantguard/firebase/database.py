import json
import sqlite3
import time
import os
from pathlib import Path
from plantguard.firebase.firebase_config import get_firestore, is_firebase_available

class DatabaseService:
    """
    Manages analysis records with Firestore and automatic local SQLite resilient vault fallback.
    Maintains: users/{userId}/analyses/{analysisId}
    """

    def __init__(self, db_file='analyses.db'):
        self.db_file = Path(db_file)
        self._init_local_db()

    def _init_local_db(self):
        """Initializes local SQLite database if Firebase is not active."""
        conn = sqlite3.connect(str(self.db_file))
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                timestamp TEXT,
                plant TEXT,
                disease TEXT,
                confidence REAL,
                leaf_area INTEGER,
                damaged_area INTEGER,
                damage_percentage REAL,
                healthy_percentage REAL,
                severity TEXT,
                original_image_url TEXT,
                processed_image_url TEXT,
                mask_image_url TEXT,
                recommendations TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def save_analysis(self, record, user_id="demo_farmer_user"):
        """Saves record to Firestore or SQLite."""
        analysis_id = record.get('id') or f"analysis_{int(time.time()*1000)}"
        record['id'] = analysis_id
        record['user_id'] = user_id

        # 1. Firestore Attempt
        firestore_client = get_firestore()
        if firestore_client is not None:
            try:
                doc_ref = firestore_client.collection('users').document(user_id).collection('analyses').document(analysis_id)
                doc_ref.set(record)
                return analysis_id
            except Exception as e:
                print(f"[PlantGuard Database] Firestore write error ({e}), writing to local SQLite.")

        # 2. Local SQLite Persistence
        conn = sqlite3.connect(str(self.db_file))
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO analyses (
                id, user_id, timestamp, plant, disease, confidence,
                leaf_area, damaged_area, damage_percentage, healthy_percentage,
                severity, original_image_url, processed_image_url, mask_image_url, recommendations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            analysis_id,
            user_id,
            record.get('timestamp', ''),
            record.get('plant', ''),
            record.get('disease', ''),
            float(record.get('confidence', 0.0)),
            int(record.get('leaf_area', 0)),
            int(record.get('damaged_area', 0)),
            float(record.get('damage_percentage', 0.0)),
            float(record.get('healthy_percentage', 0.0)),
            record.get('severity', ''),
            record.get('original_image_url', ''),
            record.get('processed_image_url', ''),
            record.get('mask_image_url', ''),
            json.dumps(record.get('recommendations', []))
        ))
        conn.commit()
        conn.close()
        return analysis_id

    def get_history(self, user_id="demo_farmer_user", limit=50):
        """Retrieves analysis history from Firestore or SQLite."""
        firestore_client = get_firestore()
        if firestore_client is not None:
            try:
                docs = firestore_client.collection('users').document(user_id).collection('analyses')\
                    .order_by('timestamp', direction='DESCENDING').limit(limit).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                print(f"[PlantGuard Database] Firestore read error ({e}), falling back to SQLite.")

        conn = sqlite3.connect(str(self.db_file))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM analyses WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?', (user_id, limit))
        rows = cursor.fetchall()
        
        results = []
        for r in rows:
            d = dict(r)
            try:
                d['recommendations'] = json.loads(d['recommendations'])
            except:
                d['recommendations'] = []
            results.append(d)
        conn.close()
        return results

    def get_analysis_by_id(self, analysis_id, user_id="demo_farmer_user"):
        """Fetches single record."""
        firestore_client = get_firestore()
        if firestore_client is not None:
            try:
                doc = firestore_client.collection('users').document(user_id).collection('analyses').document(analysis_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception:
                pass

        conn = sqlite3.connect(str(self.db_file))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM analyses WHERE id = ?', (analysis_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            d = dict(row)
            try:
                d['recommendations'] = json.loads(d['recommendations'])
            except:
                d['recommendations'] = []
            return d
        return None
