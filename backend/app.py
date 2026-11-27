import os
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, inspect, text
from config import Config
from models import db
from services.seeder_service import seed_initial_data


def _ensure_schema_columns(app):
    """Safely adds any missing columns to existing tables without dropping data."""
    inspector = inspect(db.engine)
    existing_tables = inspector.get_table_names()

    migrations = {
        'medicines': {
            'category': 'VARCHAR(120)',
            'indication': 'TEXT',
            'prescription_status': 'VARCHAR(120)',
            'image_url': 'VARCHAR(500)',
        },
        'inventory': {
            'catalog_item_no': 'VARCHAR(50)',
            'data_source': 'VARCHAR(80)',
            'missing_fields': 'TEXT',
        }
    }

    for table_name, cols in migrations.items():
        if table_name not in existing_tables:
            continue
        existing_cols = {c['name'] for c in inspector.get_columns(table_name)}
        for col_name, col_type in cols.items():
            if col_name not in existing_cols:
                db.session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
    db.session.commit()


def create_app(config_class=Config, config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(config_class)
    if config_overrides:
        app.config.update(config_overrides)

    if app.config.get('FLASK_ENV') == 'production':
        insecure_defaults = {
            'medifind_secret_key_default_2026',
            'medifind_jwt_secret_default_2026',
            'medifind_super_secret_jwt_key_2026_xyz!',
            'medifind_jwt_secret_token_key_medical_ai_2026',
        }
        secret_key = (app.config.get('SECRET_KEY') or '').strip()
        jwt_secret = (app.config.get('JWT_SECRET_KEY') or '').strip()
        if (
            not secret_key
            or not jwt_secret
            or secret_key in insecure_defaults
            or jwt_secret in insecure_defaults
            or len(secret_key) < 24
            or len(jwt_secret) < 24
            or secret_key == jwt_secret
        ):
            raise RuntimeError("Production deployment requires unique, strong custom SECRET_KEY and JWT_SECRET_KEY environment variables.")
        if app.config.get('DEBUG'):
            raise RuntimeError("Production deployment must have FLASK_DEBUG disabled (0).")
        cors_origins = app.config.get('CORS_ORIGINS') or []
        if cors_origins == '*' or '*' in cors_origins:
            raise RuntimeError("Production deployment requires explicit CORS_ORIGINS instead of wildcard '*'.")

    # Enable CORS for frontend integration using configured origins
    cors_origins = app.config.get('CORS_ORIGINS') or '*'
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    # Ensure uploads directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize SQLAlchemy database
    configured_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if configured_uri.startswith('sqlite:///'):
        db_backend = 'sqlite'
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    elif app.config.get('DATABASE_URL'):
        db_backend = configured_uri.split('://')[0].split('+')[0]
    else:
        db_backend = 'mysql'
        try:
            server_engine = create_engine(app.config['MYSQL_SERVER_URI'])
            with server_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{app.config['DB_NAME']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()

            engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
            with engine.connect():
                pass
            print(f"[DB] Successfully connected to MySQL at {app.config['DB_HOST']}:{app.config['DB_PORT']}/{app.config['DB_NAME']}")
        except Exception as e:
            if app.config.get('USE_SQLITE_FALLBACK', True):
                print(f"[DB] MySQL connection not reachable ({e}). Switching to SQLite fallback: {app.config['SQLITE_URI']}")
                app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLITE_URI']
                app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
                db_backend = 'sqlite'
            else:
                print(f"[DB Error] Could not connect to MySQL: {e}")
                raise

    app.config['ACTIVE_DB_BACKEND'] = db_backend
    db.init_app(app)

    # Register API Blueprints
    from routes import (
        auth_bp,
        user_bp,
        medicine_bp,
        inventory_bp,
        pharmacy_bp,
        prescription_bp,
        order_bp,
        admin_bp,
        alert_bp
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(medicine_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(pharmacy_bp)
    app.register_blueprint(prescription_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(alert_bp)

    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'system': 'MediFind AI Backend',
            'version': '1.0.0',
            'database': app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0],
            'active_backend': app.config.get('ACTIVE_DB_BACKEND', 'unknown')
        }), 200

    # Global 400 handler
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Invalid or malformed request.'}), 400

    # Global 404 handler
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Requested API endpoint not found.'}), 404

    # Global 405 handler
    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'HTTP method not allowed for this endpoint.'}), 405

    # Global 413 handler
    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({'error': 'Uploaded file exceeds the maximum allowed size limit (10 MB).'}), 413

    # Global 500 handler
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'An internal server error occurred.'}), 500

    # Security headers on all API responses
    @app.after_request
    def apply_security_headers(response):
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        return response

    # Auto-create tables, migrate missing columns safely & seed/import initial data
    with app.app_context():
        db.create_all()
        _ensure_schema_columns(app)
        try:
            seed_initial_data()
        except Exception as seed_err:
            db.session.rollback()
            # Re-verify pharmacies exist if another worker seeded concurrently
            from models.pharmacy import Pharmacy
            if Pharmacy.query.count() == 0:
                raise seed_err
        print("[DB] Database tables initialized and initial records verified.")

    return app


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app = create_app()
    debug_mode = bool(app.config.get('DEBUG', False))
    print(f"MediFind AI Backend running at http://127.0.0.1:{port} (debug={debug_mode})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
