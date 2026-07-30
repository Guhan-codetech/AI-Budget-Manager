from flask import Blueprint, request, jsonify
from models import db, Team, Organization, AuditLog
from auth import token_required, roles_required

team_bp = Blueprint('teams', __name__, url_prefix='/api/teams')

@team_bp.route('', methods=['GET'])
@token_required
def get_teams(current_user):
    org_id = request.args.get('organization_id', type=int)
    if org_id:
        teams = Team.query.filter_by(organization_id=org_id).all()
    else:
        teams = Team.query.all()
    return jsonify([t.to_dict() for t in teams]), 200

@team_bp.route('/<int:team_id>', methods=['GET'])
@token_required
def get_team(current_user, team_id):
    team = Team.query.get_or_404(team_id)
    return jsonify(team.to_dict()), 200

@team_bp.route('', methods=['POST'])
@token_required
@roles_required('Admin', 'Manager')
def create_team(current_user):
    data = request.get_json() or {}
    org_id = data.get('organization_id')
    name = data.get('team_name')
    budget = float(data.get('monthly_budget', 2500.0))

    if not org_id or not name:
        return jsonify({'message': 'Organization ID and Team name are required.'}), 400

    team = Team(
        organization_id=org_id,
        team_name=name,
        monthly_budget=budget,
        used_budget=0.0,
        remaining_budget=budget
    )
    db.session.add(team)
    db.session.commit()
    return jsonify(team.to_dict()), 201

@team_bp.route('/<int:team_id>', methods=['PUT'])
@token_required
@roles_required('Admin', 'Manager')
def update_team(current_user, team_id):
    team = Team.query.get_or_404(team_id)
    data = request.get_json() or {}

    if 'team_name' in data:
        team.team_name = data['team_name']
    if 'monthly_budget' in data:
        team.monthly_budget = float(data['monthly_budget'])
        team.remaining_budget = max(0.0, team.monthly_budget - team.used_budget)

    db.session.commit()
    return jsonify(team.to_dict()), 200

@team_bp.route('/<int:team_id>', methods=['DELETE'])
@token_required
@roles_required('Admin')
def delete_team(current_user, team_id):
    team = Team.query.get_or_404(team_id)
    db.session.delete(team)
    db.session.commit()
    return jsonify({'message': f'Team #{team_id} deleted.'}), 200
