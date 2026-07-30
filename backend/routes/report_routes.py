import json
from flask import Blueprint, request, jsonify
from models import db, Report, Organization, Team, AIAgent, APIUsageLog
from auth import token_required

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_bp.route('', methods=['GET'])
@token_required
def get_reports(current_user):
    reports = Report.query.order_by(Report.generated_date.desc()).all()
    return jsonify([r.to_dict() for r in reports]), 200

@report_bp.route('/generate', methods=['POST'])
@token_required
def generate_report(current_user):
    data = request.get_json() or {}
    report_type = data.get('report_type', 'Daily Budget Report')

    # Gather data summary based on report type
    orgs = Organization.query.all()
    teams = Team.query.all()
    agents = AIAgent.query.all()
    usage = APIUsageLog.query.all()

    summary_data = {
        'total_organizations': len(orgs),
        'total_teams': len(teams),
        'total_agents': len(agents),
        'total_requests': len(usage),
        'total_spent': round(sum(o.used_budget for o in orgs), 2),
        'total_tokens': sum(u.tokens for u in usage),
        'generated_by': current_user.username
    }

    report = Report(
        report_type=report_type,
        summary_json=json.dumps(summary_data)
    )
    db.session.add(report)
    db.session.commit()

    return jsonify(report.to_dict()), 201
