import os
import json
import shutil
from datetime import datetime
from models import db

BACKUP_DIR = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), 'backups')


def create_database_backup(app=None, reason='manual'):
    """
    Creates a timestamped backup of the current database before making changes.
    - If SQLite file exists, copies the .db file directly.
    - Exports all existing tables to a portable JSON snapshot so data is preserved
      regardless of MySQL or SQLite backend.
    """
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    prefix = f"backup_{timestamp}_{reason}"

    backup_info = {
        'timestamp': timestamp,
        'reason': reason,
        'files': []
    }

    # 1. Copy SQLite file if active/present
    if app is not None:
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if uri.startswith('sqlite:///'):
            db_path = uri.replace('sqlite:///', '', 1)
            if os.path.exists(db_path):
                sqlite_copy = os.path.join(BACKUP_DIR, f"{prefix}_medifind.db")
                shutil.copy2(db_path, sqlite_copy)
                backup_info['files'].append(sqlite_copy)

    # 2. Export all table rows via SQLAlchemy reflection
    try:
        snapshot = {}
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        for table_name in inspector.get_table_names():
            rows = db.session.execute(text(f"SELECT * FROM {table_name}")).mappings().all()
            snapshot[table_name] = [
                {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in dict(r).items()}
                for r in rows
            ]
        json_path = os.path.join(BACKUP_DIR, f"{prefix}_snapshot.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(snapshot, f, indent=2, ensure_ascii=False)
        backup_info['files'].append(json_path)
    except Exception as e:
        backup_info['snapshot_error'] = str(e)

    return backup_info
