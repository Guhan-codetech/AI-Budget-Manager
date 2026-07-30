from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db, User
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.organization_routes import org_bp
from routes.team_routes import team_bp
from routes.agent_routes import agent_bp
from routes.session_routes import session_bp
from routes.usage_routes import usage_bp
from routes.alert_routes import alert_bp
from routes.analytics_routes import analytics_bp
from routes.report_routes import report_bp
from routes.settings_routes import settings_bp
from routes.llm_routes import llm_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(org_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(usage_bp)
    app.register_blueprint(alert_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(llm_bp)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'online', 'service': 'Agent Budget Controller Platform'}), 200

    with app.app_context():
        db.create_all()
        if not User.query.first():
            from services.seed_data import seed_database
            seed_database()

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
