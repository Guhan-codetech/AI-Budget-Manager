from flask import Blueprint, jsonify
from models import db, Organization, Team, AIAgent, Session, APIUsageLog, Alert
from datetime import datetime, timedelta
from auth import token_required
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
@token_required
def get_dashboard_summary(current_user):
    orgs = Organization.query.all()
    teams = Team.query.all()
    agents = AIAgent.query.all()
    sessions = Session.query.all()
    usage_logs = APIUsageLog.query.all()

    total_budget = sum(o.monthly_budget for o in orgs)
    used_budget = sum(o.used_budget for o in orgs)
    remaining_budget = sum(o.remaining_budget for o in orgs)

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    
    today_logs = APIUsageLog.query.filter(APIUsageLog.request_time >= today_start, APIUsageLog.status == 'Success').all()
    today_spending = sum(l.cost for l in today_logs)

    running_sessions_count = Session.query.filter_by(status='Running').count()
    active_agents_count = AIAgent.query.filter_by(status='Active').count()

    warnings_count = Alert.query.filter(Alert.severity.in_(['Warning', 'High']), Alert.is_resolved == False).count()
    blocked_requests_count = APIUsageLog.query.filter_by(status='Blocked').count()

    successful_logs = [l for l in usage_logs if l.status == 'Success']
    avg_cost_per_request = (sum(l.cost for l in successful_logs) / len(successful_logs)) if successful_logs else 0.0
    total_tokens = sum(l.tokens for l in usage_logs)

    return jsonify({
        'kpis': {
            'total_organization_budget': round(total_budget, 2),
            'used_budget': round(used_budget, 2),
            'remaining_budget': round(remaining_budget, 2),
            'today_spending': round(today_spending, 2),
            'monthly_spending': round(used_budget, 2),
            'running_sessions': running_sessions_count,
            'active_ai_agents': active_agents_count,
            'total_ai_agents': len(agents),
            'budget_warnings': warnings_count,
            'blocked_requests': blocked_requests_count,
            'average_cost_per_request': round(avg_cost_per_request, 4),
            'total_tokens': total_tokens
        }
    }), 200

@dashboard_bp.route('/charts', methods=['GET'])
@token_required
def get_dashboard_charts(current_user):
    now = datetime.utcnow()
    
    # 1. Daily Spending (Last 14 Days)
    daily_spending = []
    for i in range(13, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())

        day_cost = db.session.query(func.sum(APIUsageLog.cost))\
            .filter(APIUsageLog.request_time >= day_start, APIUsageLog.request_time <= day_end, APIUsageLog.status == 'Success')\
            .scalar() or 0.0

        day_tokens = db.session.query(func.sum(APIUsageLog.tokens))\
            .filter(APIUsageLog.request_time >= day_start, APIUsageLog.request_time <= day_end)\
            .scalar() or 0

        daily_spending.append({
            'date': day_date.strftime('%b %d'),
            'spending': round(day_cost, 2),
            'tokens': day_tokens
        })

    # 2. Team Budget Comparison
    teams = Team.query.order_by(Team.used_budget.desc()).limit(8).all()
    team_comparison = [
        {
            'team_name': t.team_name.split(' - ')[-1],
            'monthly_budget': t.monthly_budget,
            'used_budget': t.used_budget,
            'remaining_budget': t.remaining_budget
        } for t in teams
    ]

    # 3. Top Spending AI Agents
    top_agents = AIAgent.query.order_by(AIAgent.used_budget.desc()).limit(6).all()
    top_agents_data = [
        {
            'agent_name': a.agent_name,
            'used_budget': a.used_budget,
            'monthly_budget': a.monthly_budget,
            'preferred_model': a.preferred_model
        } for a in top_agents
    ]

    # 4. Model Usage Distribution
    model_counts = db.session.query(APIUsageLog.model, func.count(APIUsageLog.usage_id), func.sum(APIUsageLog.cost))\
        .group_by(APIUsageLog.model).all()
    
    model_distribution = [
        {
            'model': m[0],
            'requests': m[1],
            'total_cost': round(m[2] or 0.0, 2)
        } for m in model_counts
    ]

    # 5. Recent Requests (10)
    recent_requests = APIUsageLog.query.order_by(APIUsageLog.request_time.desc()).limit(8).all()
    recent_requests_data = [l.to_dict() for l in recent_requests]

    # 6. Recent Alerts (6)
    recent_alerts = Alert.query.order_by(Alert.timestamp.desc()).limit(6).all()
    recent_alerts_data = [a.to_dict() for a in recent_alerts]

    return jsonify({
        'daily_spending': daily_spending,
        'team_comparison': team_comparison,
        'top_agents': top_agents_data,
        'model_distribution': model_distribution,
        'recent_requests': recent_requests_data,
        'recent_alerts': recent_alerts_data
    }), 200
