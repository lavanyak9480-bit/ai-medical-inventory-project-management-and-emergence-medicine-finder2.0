import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db
from services.seeder_service import seed_initial_data

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend integration
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Ensure uploads directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize SQLAlchemy database with intelligent connection testing
    # If MySQL is not reachable or database does not exist, automatically falls back to SQLite
    try:
        from sqlalchemy import create_engine
        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        with engine.connect():
            pass
        print(f"[DB] Successfully connected to MySQL at {app.config['DB_HOST']}:{app.config['DB_PORT']}/{app.config['DB_NAME']}")
    except Exception as e:
        if app.config.get('USE_SQLITE_FALLBACK', True):
            print(f"[DB] MySQL connection not reachable ({e}). Switching to SQLite fallback for local execution: {app.config['SQLITE_URI']}")
            app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLITE_URI']
        else:
            print(f"[DB Error] Could not connect to MySQL: {e}")

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
            'database': app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0]
        }), 200

    # Global 404 handler
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Requested API endpoint not found.'}), 404

    # Global 500 handler
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'An internal server error occurred.'}), 500

    # Auto-create tables & seed initial data
    with app.app_context():
        db.create_all()
        seed_initial_data()
        print("[DB] Database tables initialized and initial records seeded successfully.")

    return app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app = create_app()
    print(f"MediFind AI Backend running at http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
