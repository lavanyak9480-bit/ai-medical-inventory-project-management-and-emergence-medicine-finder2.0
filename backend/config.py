import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', '0').lower() in ('true', '1', 't', 'yes')
    SECRET_KEY = os.getenv('SECRET_KEY', 'medifind_secret_key_default_2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'medifind_jwt_secret_default_2026')
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24))
    CORS_ORIGINS = [
        o.strip() for o in os.getenv(
            'CORS_ORIGINS',
            'http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173'
        ).split(',') if o.strip()
    ]

    # File uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv('UPLOAD_FOLDER', 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)) # 10 MB
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'pdf'}

    # Production DATABASE_URL override (PostgreSQL / MySQL / SQLite)
    DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

    # MySQL connection parameters
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'medifind_db')
    USE_SQLITE_FALLBACK = os.getenv('USE_SQLITE_FALLBACK', 'True').lower() in ('true', '1', 't')

    # Construct MySQL URI
    MYSQL_SERVER_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}"
    MYSQL_URI = f"{MYSQL_SERVER_URI}/{DB_NAME}"
    SQLITE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'medifind.db')}"

    # Try DATABASE_URL or MySQL first; fallback to SQLite if configured or MySQL unavailable
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or MYSQL_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True
    }
