from flask import Blueprint, request, jsonify
from models import db, Session, AIAgent, AuditLog
from auth import token_required, roles_required

session_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')

@session_bp.route('', methods=['GET'])
@token_required
def get_sessions(current_user):
    agent_id = request.args.get('agent_id', type=int)
    status = request.args.get('status')
    
    query = Session.query
    if agent_id:
        query = query.filter_by(agent_id=agent_id)
    if status:
        query = query.filter_by(status=status)

    sessions = query.order_by(Session.created_time.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200

@session_bp.route('', methods=['POST'])
@token_required
def create_session(current_user):
    data = request.get_json() or {}
    agent_id = data.get('agent_id')
    budget = float(data.get('session_budget', 50.0))

    if not agent_id:
        return jsonify({'message': 'Agent ID is required.'}), 400

    agent = AIAgent.query.get_or_404(agent_id)
    session = Session(
        agent_id=agent_id,
        session_budget=budget,
        used_budget=0.0,
        remaining_budget=budget,
        status='Running'
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201

@session_bp.route('/<int:session_id>/terminate', methods=['POST'])
@token_required
@roles_required('Admin', 'Manager')
def terminate_session(current_user, session_id):
    session = Session.query.get_or_404(session_id)
    session.status = 'Terminated'
    
    audit = AuditLog(
        user_id=current_user.id, 
        username=current_user.username, 
        action="Terminate Session", 
        target_type="Session", 
        target_id=session_id
    )
    db.session.add(audit)
    db.session.commit()
    return jsonify({'message': f'Session #{session_id} terminated.', 'session': session.to_dict()}), 200
