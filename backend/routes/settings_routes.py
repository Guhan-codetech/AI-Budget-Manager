from flask import Blueprint, request, jsonify
from config import Config
from models import db, AuditLog
from auth import token_required, roles_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

# In-memory settings state for demonstration
SYSTEM_SETTINGS = {
    'warning_threshold': Config.POLICY_WARNING_THRESHOLD * 100,
    'critical_threshold': Config.POLICY_CRITICAL_THRESHOLD * 100,
    'block_threshold': Config.POLICY_BLOCK_THRESHOLD * 100,
    'auto_fallback_enabled': True,
    'email_notifications_enabled': True,
    'slack_webhook_url': 'https://hooks.slack.com/services/T00/B00/XXXXX',
    'default_provider': 'OpenAI'
}

@settings_bp.route('', methods=['GET'])
@token_required
def get_settings(current_user):
    return jsonify({
        'settings': SYSTEM_SETTINGS,
        'model_pricing': Config.MODEL_PRICING
    }), 200

@settings_bp.route('', methods=['PUT'])
@token_required
@roles_required('Admin')
def update_settings(current_user):
    data = request.get_json() or {}
    for key, value in data.items():
        if key in SYSTEM_SETTINGS:
            SYSTEM_SETTINGS[key] = value

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Update System Settings",
        target_type="Settings",
        details="Updated policy threshold configurations"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'Settings updated successfully.', 'settings': SYSTEM_SETTINGS}), 200
