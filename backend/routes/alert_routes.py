from flask import Blueprint, request, jsonify
from models import db, Alert, AuditLog
from auth import token_required, roles_required

alert_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alert_bp.route('', methods=['GET'])
@token_required
def get_alerts(current_user):
    severity = request.args.get('severity')
    agent_id = request.args.get('agent_id', type=int)
    is_resolved = request.args.get('is_resolved')

    query = Alert.query
    if severity:
        query = query.filter_by(severity=severity)
    if agent_id:
        query = query.filter_by(agent_id=agent_id)
    if is_resolved is not None:
        resolved_bool = is_resolved.lower() == 'true'
        query = query.filter_by(is_resolved=resolved_bool)

    alerts = query.order_by(Alert.timestamp.desc()).all()
    return jsonify([a.to_dict() for a in alerts]), 200

@alert_bp.route('/<int:alert_id>/resolve', methods=['POST'])
@token_required
@roles_required('Admin', 'Manager')
def resolve_alert(current_user, alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.is_resolved = True
    
    audit = AuditLog(
        user_id=current_user.id, 
        username=current_user.username, 
        action="Resolve Alert", 
        target_type="Alert", 
        target_id=alert_id
    )
    db.session.add(audit)
    db.session.commit()
    return jsonify({'message': f'Alert #{alert_id} resolved.', 'alert': alert.to_dict()}), 200

@alert_bp.route('/resolve-all', methods=['POST'])
@token_required
@roles_required('Admin', 'Manager')
def resolve_all_alerts(current_user):
    unresolved = Alert.query.filter_by(is_resolved=False).all()
    for a in unresolved:
        a.is_resolved = True
    db.session.commit()
    return jsonify({'message': f'Resolved {len(unresolved)} alerts.'}), 200
