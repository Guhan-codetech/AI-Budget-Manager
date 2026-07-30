from flask import Blueprint, request, jsonify
from models import db, Organization, AuditLog
from auth import token_required, roles_required

org_bp = Blueprint('organizations', __name__, url_prefix='/api/organizations')

@org_bp.route('', methods=['GET'])
@token_required
def get_organizations(current_user):
    orgs = Organization.query.all()
    return jsonify([o.to_dict() for o in orgs]), 200

@org_bp.route('/<int:org_id>', methods=['GET'])
@token_required
def get_organization(current_user, org_id):
    org = Organization.query.get_or_404(org_id)
    return jsonify(org.to_dict()), 200

@org_bp.route('', methods=['POST'])
@token_required
@roles_required('Admin')
def create_organization(current_user):
    data = request.get_json() or {}
    name = data.get('organization_name')
    budget = float(data.get('monthly_budget', 10000.0))

    if not name:
        return jsonify({'message': 'Organization name is required.'}), 400

    org = Organization(
        organization_name=name,
        monthly_budget=budget,
        used_budget=0.0,
        remaining_budget=budget
    )
    db.session.add(org)

    audit = AuditLog(user_id=current_user.id, username=current_user.username, action="Create Organization", target_type="Organization", details=f"Created {name} with budget ${budget}")
    db.session.add(audit)
    db.session.commit()

    return jsonify(org.to_dict()), 201

@org_bp.route('/<int:org_id>', methods=['PUT'])
@token_required
@roles_required('Admin', 'Manager')
def update_organization(current_user, org_id):
    org = Organization.query.get_or_404(org_id)
    data = request.get_json() or {}

    if 'organization_name' in data:
        org.organization_name = data['organization_name']
    if 'monthly_budget' in data:
        org.monthly_budget = float(data['monthly_budget'])
        org.remaining_budget = max(0.0, org.monthly_budget - org.used_budget)

    audit = AuditLog(user_id=current_user.id, username=current_user.username, action="Update Organization", target_type="Organization", target_id=org_id, details=f"Updated budget to ${org.monthly_budget}")
    db.session.add(audit)
    db.session.commit()

    return jsonify(org.to_dict()), 200

@org_bp.route('/<int:org_id>', methods=['DELETE'])
@token_required
@roles_required('Admin')
def delete_organization(current_user, org_id):
    org = Organization.query.get_or_404(org_id)
    db.session.delete(org)
    db.session.commit()
    return jsonify({'message': f'Organization #{org_id} deleted successfully.'}), 200
