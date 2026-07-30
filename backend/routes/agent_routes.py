from flask import Blueprint, request, jsonify
from models import db, AIAgent, Team, AuditLog
from auth import token_required, roles_required

agent_bp = Blueprint('agents', __name__, url_prefix='/api/agents')

@agent_bp.route('', methods=['GET'])
@token_required
def get_agents(current_user):
    team_id = request.args.get('team_id', type=int)
    if team_id:
        agents = AIAgent.query.filter_by(team_id=team_id).all()
    else:
        agents = AIAgent.query.all()
    return jsonify([a.to_dict() for a in agents]), 200

@agent_bp.route('/<int:agent_id>', methods=['GET'])
@token_required
def get_agent(current_user, agent_id):
    agent = AIAgent.query.get_or_404(agent_id)
    return jsonify(agent.to_dict()), 200

@agent_bp.route('', methods=['POST'])
@token_required
@roles_required('Admin', 'Manager')
def create_agent(current_user):
    data = request.get_json() or {}
    team_id = data.get('team_id')
    name = data.get('agent_name')
    pref_model = data.get('preferred_model', 'gpt-4o')
    fall_model = data.get('fallback_model', 'gpt-4o-mini')
    budget = float(data.get('monthly_budget', 500.0))

    if not team_id or not name:
        return jsonify({'message': 'Team ID and Agent name are required.'}), 400

    agent = AIAgent(
        team_id=team_id,
        agent_name=name,
        preferred_model=pref_model,
        fallback_model=fall_model,
        monthly_budget=budget,
        used_budget=0.0,
        remaining_budget=budget,
        status='Active'
    )
    db.session.add(agent)
    db.session.commit()
    return jsonify(agent.to_dict()), 201

@agent_bp.route('/<int:agent_id>', methods=['PUT'])
@token_required
@roles_required('Admin', 'Manager')
def update_agent(current_user, agent_id):
    agent = AIAgent.query.get_or_404(agent_id)
    data = request.get_json() or {}

    if 'agent_name' in data:
        agent.agent_name = data['agent_name']
    if 'preferred_model' in data:
        agent.preferred_model = data['preferred_model']
    if 'fallback_model' in data:
        agent.fallback_model = data['fallback_model']
    if 'monthly_budget' in data:
        agent.monthly_budget = float(data['monthly_budget'])
        agent.remaining_budget = max(0.0, agent.monthly_budget - agent.used_budget)
    if 'status' in data:
        agent.status = data['status']

    db.session.commit()
    return jsonify(agent.to_dict()), 200

@agent_bp.route('/<int:agent_id>/switch-model', methods=['POST'])
@token_required
@roles_required('Admin', 'Manager')
def switch_agent_to_fallback(current_user, agent_id):
    """Action to switch preferred model to fallback model for cost savings."""
    agent = AIAgent.query.get_or_404(agent_id)
    old_model = agent.preferred_model
    agent.preferred_model = agent.fallback_model
    
    audit = AuditLog(
        user_id=current_user.id, 
        username=current_user.username, 
        action="Switch Model to Fallback", 
        target_type="AIAgent", 
        target_id=agent_id, 
        details=f"Switched model from {old_model} to {agent.fallback_model}"
    )
    db.session.add(audit)
    db.session.commit()
    return jsonify({'message': f'Switched agent model to fallback: {agent.fallback_model}', 'agent': agent.to_dict()}), 200
