from flask import Blueprint, request, jsonify, current_app
from models import db, APIUsageLog, AIAgent, Team, Organization
from services.budget_engine import BudgetEngine
from services.traffic_generator import LiveTrafficGenerator
from auth import token_required

usage_bp = Blueprint('usage', __name__, url_prefix='/api/usage')

@usage_bp.route('', methods=['GET'])
@token_required
def get_usage_logs(current_user):
    agent_id = request.args.get('agent_id', type=int)
    model = request.args.get('model')
    provider = request.args.get('provider')
    status = request.args.get('status')
    search = request.args.get('search')
    limit = request.args.get('limit', default=100, type=int)

    query = APIUsageLog.query

    if agent_id:
        query = query.filter_by(agent_id=agent_id)
    if model:
        query = query.filter_by(model=model)
    if provider:
        query = query.filter_by(provider=provider)
    if status:
        query = query.filter_by(status=status)

    logs = query.order_by(APIUsageLog.request_time.desc()).limit(limit).all()
    result = [l.to_dict() for l in logs]

    if search:
        s = search.lower()
        result = [
            l for l in result if s in l['agent_name'].lower() or 
            s in l['model'].lower() or 
            s in l['provider'].lower() or
            s in l['organization_name'].lower() or
            s in l['team_name'].lower()
        ]

    return jsonify(result), 200

@usage_bp.route('/simulate', methods=['POST'])
@token_required
def simulate_api_request(current_user):
    data = request.get_json() or {}
    agent_id = data.get('agent_id')
    session_id = data.get('session_id')
    model = data.get('model')
    input_tokens = int(data.get('input_tokens', 1200))
    output_tokens = int(data.get('output_tokens', 450))

    if not agent_id:
        agent = AIAgent.query.filter_by(status='Active').first()
        if not agent:
            agent = AIAgent.query.first()
        if not agent:
            return jsonify({'message': 'No AI Agent available in database.'}), 400
        agent_id = agent.agent_id

    if not model:
        agent = AIAgent.query.get(agent_id)
        model = agent.preferred_model if agent else 'gpt-4o'

    result = BudgetEngine.process_api_request(
        agent_id=agent_id,
        session_id=session_id,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens
    )

    return jsonify(result), 200 if result['allowed'] else 402

@usage_bp.route('/live-stream/start', methods=['POST'])
@token_required
def start_live_stream(current_user):
    app = current_app._get_current_object()
    LiveTrafficGenerator.start_live_traffic(app)
    return jsonify({'message': 'Real-time background AI traffic stream started.', 'running': True}), 200

@usage_bp.route('/live-stream/stop', methods=['POST'])
@token_required
def stop_live_stream(current_user):
    LiveTrafficGenerator.stop_live_traffic()
    return jsonify({'message': 'Real-time background stream paused.', 'running': False}), 200

@usage_bp.route('/live-stream/status', methods=['GET'])
@token_required
def get_live_stream_status(current_user):
    return jsonify({'running': LiveTrafficGenerator.is_running()}), 200
